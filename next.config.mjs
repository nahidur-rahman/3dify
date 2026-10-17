const storageUrl = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL) : null;
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || "product-images";

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_BUILD_DIR || ".next",
  images: {
    // Variants are generated once on upload; never use Vercel transformations.
    unoptimized: true,
    // These allowlists also limit variants if the optimizer is re-enabled later.
    minimumCacheTTL: 7_776_000, // 90 days
    formats: ["image/webp"],
    qualities: [80],
    deviceSizes: [480, 750],
    imageSizes: [128],
    remotePatterns: storageUrl?.protocol === "https:" ? [{
        protocol: "https",
        hostname: storageUrl.hostname,
        port: "",
        pathname: `/storage/v1/object/public/${storageBucket}/**`,
        search: "",
    }] : [],
  },
};

export default nextConfig;
