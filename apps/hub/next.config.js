/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable standalone output for Docker deployment
  output: 'standalone',
  transpilePackages: ['@demiurge/qor-sdk', '@demiurge/ui-shared', '@demiurge/wallet-wasm'],
  // Server Actions are enabled by default in Next.js 15
  // No need for experimental.serverActions
  
  // Allow large file uploads (1.5GB for media)
  experimental: {
    serverActions: {
      bodySizeLimit: '1.6gb',
    },
  },
  
  // Increase API body size limit
  api: {
    bodyParser: {
      sizeLimit: '1.6gb',
    },
    responseLimit: false,
  },
  webpack: (config, { isServer }) => {
    // Handle WASM files
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    
    // Configure WASM loader
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };
    
    // Ignore WASM wallet module during build (it's loaded dynamically at runtime)
    // Use IgnorePlugin to prevent webpack from trying to resolve it
    const webpack = require('webpack');
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@demiurge\/wallet-wasm$/,
      })
    );
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /packages\/wallet-wasm\/pkg\/wallet_wasm$/,
      })
    );
    
    return config;
  },
}

module.exports = nextConfig
