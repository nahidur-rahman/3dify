import { PrismaClient, Prisma, Category } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function shouldSeedSampleProducts() {
  return (process.env.SEED_SAMPLE_PRODUCTS || "true").toLowerCase() === "true";
}

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin
  const adminPassword = await hash(process.env.ADMIN_PASSWORD || "admin123", 12);
  const admin = await prisma.admin.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@3difybd.com" },
    update: {
      password: adminPassword,
      name: "Admin",
    },
    create: {
      email: process.env.ADMIN_EMAIL || "admin@3difybd.com",
      password: adminPassword,
      name: "Admin",
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  if (!shouldSeedSampleProducts()) {
    console.log("ℹ️ Skipping sample products (SEED_SAMPLE_PRODUCTS=false)");
    console.log("🎉 Seeding complete!");
    return;
  }

  // Create sample products
  const sampleProducts: Prisma.ProductCreateInput[] = [
    {
      name: "Dragon Figurine",
      description:
        "A beautifully detailed dragon figurine, perfect for collectors and fantasy enthusiasts. Each scale is meticulously crafted with high-resolution 3D printing technology.",
      price: 1500,
      images: ["/placeholder/dragon.jpg"],
      category: Category.FIGURINE,
      color: "Metallic Silver",
      size: "15x10x8 cm",
      sizeMode: "FIXED",
      sizeOptions: [],
      weight: 120,
      infillPercentage: 30,
      discountPercent: 0,
      customizable: true,
      inStock: true,
      featured: true,
    },
    {
      name: "Geometric Phone Case",
      description:
        "Sleek geometric pattern phone case with shock-absorbing design. Available for most popular phone models. Lightweight yet durable TPU material.",
      price: 800,
      images: ["/placeholder/phone-case.jpg"],
      category: Category.PHONE_CASE,
      color: "Matte Black",
      size: "16x8x1.2 cm",
      sizeMode: "OPTIONS",
      sizeOptions: [
        { label: "Standard", price: 800 },
        { label: "Premium Grip", price: 950 },
      ],
      weight: 35,
      infillPercentage: 50,
      discountPercent: 10,
      customizable: true,
      inStock: true,
      featured: true,
    },
    {
      name: "Modern Vase",
      description:
        "A stunning modern vase with a twisted spiral design. Perfect centerpiece for any room. Smooth finish with a premium feel.",
      price: 1200,
      images: ["/placeholder/vase.jpg"],
      category: Category.HOME_DECOR,
      color: "White",
      size: "20x10x10 cm",
      sizeMode: "FIXED",
      sizeOptions: [],
      weight: 200,
      infillPercentage: 20,
      discountPercent: 0,
      customizable: false,
      inStock: true,
      featured: true,
    },
    {
      name: "Custom Name Plate",
      description:
        "Personalized 3D printed name plate for your desk or door. Choose your font, color, and size. Makes a great gift!",
      price: 600,
      images: ["/placeholder/nameplate.jpg"],
      category: Category.CUSTOM,
      color: "Any Color",
      size: "20x5x2 cm",
      sizeMode: "OPTIONS",
      sizeOptions: [
        { label: "Small", price: 500 },
        { label: "Medium", price: 600 },
        { label: "Large", price: 750 },
      ],
      weight: 80,
      infillPercentage: 40,
      discountPercent: 5,
      customizable: true,
      inStock: true,
      featured: true,
    },
    {
      name: "Iron Man Helmet",
      description:
        "Wearable Iron Man Mark 85 helmet replica. Highly detailed with metallic finish. A must-have for Marvel fans and cosplayers.",
      price: 3500,
      images: ["/placeholder/ironman.jpg"],
      category: Category.FIGURINE,
      color: "Red & Gold",
      size: "30x25x25 cm",
      sizeMode: "FIXED",
      sizeOptions: [],
      weight: 450,
      infillPercentage: 25,
      discountPercent: 0,
      customizable: false,
      inStock: true,
      featured: false,
    },
    {
      name: "Hexagonal Wall Art Set",
      description:
        "Set of 6 hexagonal wall tiles with 3D geometric patterns. Easy to mount, creates a stunning accent wall.",
      price: 2000,
      images: ["/placeholder/wall-art.jpg"],
      category: Category.HOME_DECOR,
      color: "White & Gray",
      size: "12x12x2 cm each",
      sizeMode: "OPTIONS",
      sizeOptions: [
        { label: "Set of 4", price: 1600 },
        { label: "Set of 6", price: 2000 },
      ],
      weight: 300,
      infillPercentage: 15,
      discountPercent: 12,
      customizable: true,
      inStock: true,
      featured: false,
    },
  ];

  let createdCount = 0;
  let skippedCount = 0;

  for (const product of sampleProducts) {
    const existing = await prisma.product.findFirst({
      where: {
        name: product.name,
        category: product.category,
      },
      select: { id: true },
    });

    if (existing) {
      skippedCount += 1;
      continue;
    }

    await prisma.product.create({ data: product });
    createdCount += 1;
  }

  console.log(`✅ ${createdCount} sample products created`);
  console.log(`ℹ️ ${skippedCount} sample products already existed`);

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
