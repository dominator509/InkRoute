/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@inkroute/config", "@inkroute/seo", "@inkroute/types", "@inkroute/ui"],
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
