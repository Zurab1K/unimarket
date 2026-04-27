/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "dphqcfbahoczhiatobin.supabase.co",
      },
    ],
  },
};

export default nextConfig;
