/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true,
  },
  // ffmpeg-installer uses __dirname at runtime to find platform-specific binaries.
  // Bundling breaks that — keep these as external Node modules.
  experimental: {
    serverComponentsExternalPackages: [
      '@ffmpeg-installer/ffmpeg',
      'fluent-ffmpeg',
    ],
  },
  headers: async () => [
    {
      source: '/',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        { key: 'X-Accel-Buffering', value: 'no' },
      ],
    },
    {
      source: '/api/video/:path*',
      headers: [
        {
          key: 'Accept-Ranges',
          value: 'bytes',
        },
        {
          key: 'Cache-Control',
          value: 'public, max-age=3600',
        },
      ],
    },
  ],
};

export default nextConfig;
