/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@inkroute/auth", "@inkroute/booking", "@inkroute/calendar", "@inkroute/config", "@inkroute/notifications", "@inkroute/payments", "@inkroute/security", "@inkroute/types"],
};

export default nextConfig;
