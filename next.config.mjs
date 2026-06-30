import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so Turbopack doesn't get confused by stray
  // lockfiles in parent directories.
  turbopack: {
    root: import.meta.dirname,
  },
};

export default withBundleAnalyzer(nextConfig);
