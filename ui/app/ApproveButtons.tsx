'use client';
import { useEffect, useState } from 'react';
import { useAccount, useConnect, useWriteContract, useSwitchChain } from 'wagmi';
import { monadTestnet } from './wagmi';

type Item = {
  digest: `0x${string}`;
  agent: string;
  target: string;
  amount: bigint;
  approved: boolean;
};

const FIRMAUDIT_ABI = [{
  type: 'function', name: 'recordApproval', stateMutability: 'nonpayable',
  inputs: [
    { name: 'digest', type: 'bytes32' },
    { name: 'decision', type: 'uint8' },
  ],
  outputs: [],
}] as const;

const trunc = (s: string, head = 6, tail = 4) =>
  s.length > head + tail + 2 ? `${s.slice(0, head)}…${s.slice(-tail)}` : s;

export default function ApproveButtons({ digest, contract, rpc }: { digest: `0x${string}`; contract: `0x${string}`; rpc: string }) {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, status: connectStatus, error: connectError } = useConnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { writeContract, isPending, data: txHash, error: writeError, reset } = useWriteContract();
  const [decision, setDecision] = useState<1 | 0 | null>(null);

  useEffect(() => { reset(); }, [digest, reset]);

  const onWrongChain = isConnected && chainId !== monadTestnet.id;

  const submit = (d: 1 | 0) => {
    setDecision(d);
    writeContract({
      address: contract,
      abi: FIRMAUDIT_ABI,
      functionName: 'recordApproval',
      args: [digest, d],
    });
  };

  if (!isConnected) {
    const c = connectors[0];
    return (
      <div className="wallet">
        <button
          className="btn connect"
          disabled={connectStatus === 'pending'}
          onClick={() => c && connect({ connector: c })}
        >
          {connectStatus === 'pending' ? 'Opening MetaMask…' : 'Connect MetaMask'}
        </button>
        {connectError && <div className="wallet-err">{connectError.message.split('\n')[0]}</div>}
        <div className="wallet-hint">Switch MetaMask to <strong>Monad Testnet</strong> (chain 10143) before connecting.</div>
      </div>
    );
  }

  if (onWrongChain) {
    return (
      <div className="wallet">
        <button className="btn connect" disabled={switching} onClick={() => switchChain({ chainId: monadTestnet.id })}>
          {switching ? 'Switching…' : 'Switch to Monad Testnet'}
        </button>
      </div>
    );
  }

  return (
    <div className="wallet">
      <div className="wallet-row">
        <button className="btn approve" disabled={isPending} onClick={() => submit(1)}>
          {isPending && decision === 1 ? 'Confirm in MetaMask…' : 'Approve'}
        </button>
        <button className="btn reject" disabled={isPending} onClick={() => submit(0)}>
          {isPending && decision === 0 ? 'Confirm in MetaMask…' : 'Reject'}
        </button>
      </div>
      <div className="wallet-meta">
        Connected: <code>{trunc(address!, 6, 4)}</code>
      </div>
      {txHash && (
        <div className="wallet-ok">
          Sent ✓ tx <code>{trunc(txHash, 10, 6)}</code> —{' '}
          <a href={`https://testnet.monadvision.com/tx/${txHash}`} target="_blank" rel="noreferrer">view on explorer</a>
        </div>
      )}
      {writeError && (
        <div className="wallet-err">{writeError.message.split('\n').slice(0, 2).join(' — ')}</div>
      )}
    </div>
  );
}