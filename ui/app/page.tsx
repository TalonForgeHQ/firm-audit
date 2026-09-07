import { createPublicClient, http, parseAbiItem, defineChain } from 'viem';
import RecentList from './RecentList';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_RPC ?? ''] } },
});

const EVENT_DECISION = parseAbiItem(
  'event DecisionProposed(address indexed agent, bytes32 indexed digest, address target, uint256 amount)'
);
const EVENT_EXECUTED = parseAbiItem(
  'event ActionExecuted(address indexed agent, bytes32 indexed digest, bytes32 txHash)'
);
const APPROVED_ABI = [{
  type: 'function', name: 'approved', stateMutability: 'view',
  inputs: [{ name: '', type: 'bytes32' }], outputs: [{ name: '', type: 'bool' }],
}] as const;
type Log = Awaited<ReturnType<ReturnType<typeof createPublicClient>['getLogs']>>;
type LogItem = Log[number];

const TOPIC_DECISION_PROPOSED = '0xe5cf0582abee0da85975d9b5526c7a9826b0933b92c9262b7330b4d3cf6617a5';
// Scan up to 50000 blocks (~5.5 hours at 400ms). Serial — reliable. At ~80ms
// per chunk this takes ~40 seconds for 500 chunks, well inside the 30s budget
// for short windows and 60s for full scans on Pro. We cap proposals found.
const SCAN_BACK = 50000n;
const CHUNK = 99n;
const TARGET = 20;

export default async function Page() {
  const rpc = process.env.NEXT_PUBLIC_RPC;
  const contract = process.env.NEXT_PUBLIC_CONTRACT as `0x${string}` | undefined;
  const agentId = process.env.NEXT_PUBLIC_AGENT_ID;
  if (!rpc || !contract) {
    return (
      <main className="container">
        <h1>FirmAudit</h1>
        <p className="subtitle">Set <code>NEXT_PUBLIC_RPC</code> and <code>NEXT_PUBLIC_CONTRACT</code> in <code>ui/.env.local</code>.</p>
      </main>
    );
  }
  const client = createPublicClient({ chain: monadTestnet, transport: http(rpc) });
  const head = await client.getBlockNumber();
  const fromBlock = head > SCAN_BACK ? head - SCAN_BACK : 0n;

  // Serial scan newest → oldest. Stop when we hit TARGET proposals OR when we
  // walk back past fromBlock. Track which block ranges we've queried to skip
  // re-querying in retry.
  const collected: LogItem[] = [];
  let consecutiveSkips = 0;
  for (let end = head; end > fromBlock && collected.length < TARGET;) {
    const start = end - CHUNK > fromBlock ? end - CHUNK : fromBlock;
    let logs: LogItem[] = [];
    let attempts = 0;
    while (attempts < 4) {
      try {
        logs = (await client.getLogs({
          address: contract as `0x${string}`,
          event: EVENT_DECISION,
          fromBlock: start,
          toBlock: end,
        })) as LogItem[];
        break;
      } catch (e: any) {
        if (e?.status === 429 || e?.shortMessage?.includes?.('429') || e?.details?.includes?.('limited')) {
          attempts += 1;
          await new Promise((res) => setTimeout(res, 1500 * attempts));
        } else {
          // Non-rate-limit error: skip this chunk entirely.
          attempts = 99;
        }
      }
    }
    if (logs.length > 0) {
      collected.unshift(...logs);
      consecutiveSkips = 0;
    } else if (attempts < 99) {
      // We retried 4x and still got nothing (or empty array) — that's a real
      // empty chunk. Move on.
      consecutiveSkips += 1;
      // If we've had 20 empty chunks in a row, the contract is quiet; bail
      // out early to keep response time under Vercel's 60s limit.
      if (consecutiveSkips > 200 && collected.length > 0) break;
    }
    end = start - 1n;
  }

  // Newest first, dedupe by digest.
  collected.sort((a: any, b: any) => Number(b.blockNumber ?? 0n) - Number(a.blockNumber ?? 0n));
  const seen = new Set<string>();
  const unique = collected.filter((p: any) => {
    const d = p.args?.digest as string | undefined;
    if (!d || seen.has(d)) return false;
    seen.add(d);
    return true;
  });
  const kept = unique.slice(0, TARGET);

  const items = await Promise.all(kept.map(async (log: any) => {
    const digest: `0x${string}` = log.args.digest!;
    const [approved, execLogs] = await Promise.all([
      client.readContract({ address: contract as `0x${string}`, abi: APPROVED_ABI, functionName: 'approved', args: [digest] }) as Promise<boolean>,
      client.getLogs({ address: contract as `0x${string}`, event: EVENT_EXECUTED, fromBlock: log.blockNumber ?? 0n, toBlock: 'latest' })
        .then((ls: LogItem[]) => (ls as any[]).filter((l) => l.args?.digest === digest))
        .catch(() => [] as LogItem[]),
    ]);
    const execLog = execLogs[0] as any | undefined;
    return {
      digest,
      agent: log.args.agent!,
      target: log.args.target!,
      amount: log.args.amount! as bigint,
      approved,
      executed: !!execLog,
      execTxHash: execLog?.transactionHash as `0x${string}` | undefined,
    };
  }));

  return <RecentList items={items} contract={contract as `0x${string}`} rpc={rpc} agentId={agentId} />;
}