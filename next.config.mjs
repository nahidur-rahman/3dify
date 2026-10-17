/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  images: {
    // Serve source images directly to avoid Vercel Image Optimization quotas.
    // Keep uploaded images compressed: automatic resizing/conversion is disabled.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
