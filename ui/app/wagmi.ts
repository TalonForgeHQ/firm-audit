import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';

export const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_RPC ?? ''] } },
} as const;

export const wagmiConfig = createConfig({
  chains: [monadTestnet],
  connectors: [injected({ shimDisconnect: true })],
  transports: { [monadTestnet.id]: http() },
  ssr: true,
});