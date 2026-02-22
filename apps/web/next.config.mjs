/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@omniqr/shared"],
  experimental: {
    optimizePackageImports: ["lucide-react"]
  }
};

export default nextConfig;

