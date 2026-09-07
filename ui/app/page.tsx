import { createPublicClient, http, parseAbiItem, defineChain } from 'viem';
import PendingList from './PendingList';

export const dynamic = 'force-dynamic';

const monadTestnet = defineChain({
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_RPC ?? ''] } },
});

const EVENT_DECISION = parseAbiItem(
  'event DecisionProposed(address indexed agent, bytes32 indexed digest, address target, uint256 amount)'
);
const APPROVED_ABI = [{
  type: 'function',
  name: 'approved',
  stateMutability: 'view',
  inputs: [{ name: '', type: 'bytes32' }],
  outputs: [{ name: '', type: 'bool' }],
}] as const;

export default async function Page() {
  const rpc = process.env.NEXT_PUBLIC_RPC;
  const contract = process.env.NEXT_PUBLIC_CONTRACT as `0x${string}` | undefined;
  if (!rpc || !contract) {
    return (
      <div style={{ padding: 24 }}>
        Set <code>NEXT_PUBLIC_RPC</code> and <code>NEXT_PUBLIC_CONTRACT</code> in <code>ui/.env.local</code>.
      </div>
    );
  }
  const client = createPublicClient({ chain: monadTestnet, transport: http(rpc) });
  const block = await client.getBlockNumber();
  const CHUNK = 99n; // Monad eth_getLogs hard cap is 100; stay under it
  const SCAN_BACK = 5000n; // ~33 min at 400ms blocks
  const fromBlock = block > SCAN_BACK ? block - SCAN_BACK : 0n;
  const ranges: { fromBlock: bigint; toBlock: bigint }[] = [];
  let end = block;
  while (end > fromBlock) {
    const start = end - CHUNK > fromBlock ? end - CHUNK : fromBlock;
    ranges.push({ fromBlock: start, toBlock: end });
    end = start - 1n;
  }
  const allLogs = (await Promise.all(ranges.map((r) =>
    client.getLogs({
      address: contract,
      event: EVENT_DECISION,
      fromBlock: r.fromBlock,
      toBlock: r.toBlock,
    }),
  ))).flat();
  const items = await Promise.all(allLogs.map(async (log) => ({
    digest: log.args.digest!,
    agent: log.args.agent!,
    target: log.args.target!,
    amount: log.args.amount!.toString(),
    approved: await client.readContract({
      address: contract,
      abi: APPROVED_ABI,
      functionName: 'approved',
      args: [log.args.digest!],
    }) as boolean,
  })));
  return <PendingList items={items} contract={contract} rpc={rpc} />;
}