import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// script-src has no 'unsafe-inline'/'unsafe-eval' — the app has no inline
// <script> that executes (the JSON-LD block is type="application/ld+json",
// a non-executable data type CSP doesn't restrict). style-src keeps
// 'unsafe-inline' because Motion animates via the DOM style attribute.
const csp = [
  "default-src 'self'",
  "script-src 'self' https://www.googletagmanager.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://raw.githubusercontent.com",
  "media-src 'self' https://raw.githubusercontent.com",
  "font-src 'self'",
  "connect-src 'self' https://pokeapi.co https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so Turbopack doesn't get confused by stray
  // lockfiles in parent directories.
  turbopack: {
    root: import.meta.dirname,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withBundleAnalyzer(nextConfig);
