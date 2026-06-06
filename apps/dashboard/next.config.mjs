/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@inkroute/auth", "@inkroute/booking", "@inkroute/calendar", "@inkroute/config", "@inkroute/notifications", "@inkroute/payments", "@inkroute/types"],
};

export default nextConfig;
