/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }
    ],
    domains: ['i.ibb.co'], // For avatar fallback
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    formats: ['image/webp'],
  }
}

// Add to all pages that fetch data
export const loading = true;
export const dynamic = 'force-dynamic';

module.exports = nextConfig