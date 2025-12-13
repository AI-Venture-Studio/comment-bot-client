/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Image optimization is disabled (standalone output)
  images: {
    unoptimized: true,
  },
};

export default nextConfig;