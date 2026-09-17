import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Initialize OpenNext Cloudflare for local development
initOpenNextCloudflareForDev();

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // 关闭 React Strict Mode，防止某些特殊客户端库被双重初始化
  reactStrictMode: false,
  // 这里可以添加将来需要的配置选项
  async headers() {
    const noIndex = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
    return process.env.SITE_INDEXABLE === 'false'
      ? [{ source: '/:path*', headers: noIndex }]
      : [{ source: '/:path*', has: [{ type: 'host', value: '.*\\.workers\\.dev' }], headers: noIndex }];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ['three'],
  webpack: (config, { isServer }) => {
    // Exclude heavy libraries from server bundles
    if (isServer) {
      config.externals = [...(config.externals || []), 'three'];
    }
    return config;
  },
};

export default withNextIntl(nextConfig);
