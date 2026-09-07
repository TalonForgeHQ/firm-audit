/** @type {import('next').NextConfig} */
const nextConfig = {
  // wagmi pulls in @walletconnect/universal-provider which requires pino-pretty
  // at runtime. Mark as external so the bundler doesn't try to inline it.
  webpack: (config) => {
    config.externals = [...(config.externals || []), { 'pino-pretty': 'pino-pretty' }];
    return config;
  },
};
export default nextConfig;