'use client';
import { useState } from 'react';

type Item = {
  digest: `0x${string}`;
  agent: string;
  target: string;
  amount: string;
  approved: boolean;
};

export default function PendingList({ items, contract, rpc }: { items: Item[]; contract: string; rpc: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const cast = (fn: string, args: string) =>
    `cast send ${contract} "${fn}" ${args} \\\n  --rpc-url ${rpc} --private-key $PRIVATE_KEY`;
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ margin: '0 0 8px' }}>FirmAudit — pending decisions</h1>
      <p style={{ color: '#888' }}>Refresh to poll. Click a button to reveal the cast command; copy it to your shell.</p>
      {items.length === 0 && <p>none.</p>}
      {items.map((it) => {
        const tag = (k: string) => it.digest + ':' + k;
        const isOpen = (k: string) => open === tag(k);
        return (
          <div key={it.digest} style={{ border: '1px solid #333', padding: 16, margin: '12px 0', borderRadius: 8 }}>
            <div>digest <code>{it.digest.slice(0, 18)}…</code></div>
            <div>agent  <code>{it.agent}</code></div>
            <div>target <code>{it.target}</code></div>
            <div>amount <code>{it.amount}</code></div>
            <div>status {it.approved ? '✅ approved' : '⏳ pending'}</div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <button onClick={() => setOpen(isOpen('a') ? null : tag('a'))}>Approve</button>
              <button onClick={() => setOpen(isOpen('r') ? null : tag('r'))}>Reject</button>
              <button disabled={!it.approved} onClick={() => setOpen(isOpen('x') ? null : tag('x'))}>Execute</button>
            </div>
            {isOpen('a') && <pre style={pre}>{cast('recordApproval(bytes32,uint8)', `${it.digest} 1`)}</pre>}
            {isOpen('r') && <pre style={pre}>{cast('recordApproval(bytes32,uint8)', `${it.digest} 0`)}</pre>}
            {isOpen('x') && <pre style={pre}>{`cast call ${contract} "approved(bytes32)(bool)" ${it.digest} --rpc-url ${rpc}\n# if true, run from the repo root:\nbash scripts/execute.sh   # sends 0.001 MON to ${it.target}, then recordExecution`}</pre>}
          </div>
        );
      })}
    </div>
  );
}

const pre: React.CSSProperties = { background: '#111', padding: 12, marginTop: 8, overflow: 'auto', fontSize: 13 };