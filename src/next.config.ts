
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  basePath: '/recipes',
  trailingSlash: true,
  /* config options here */
  async redirects() {
    return [
      {
        source: '/',
        destination: '/recipes/',
        permanent: true,
      },
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
