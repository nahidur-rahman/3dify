import { PrismaClient, Category } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin
  const adminPassword = await hash(process.env.ADMIN_PASSWORD || "admin123", 12);
  const admin = await prisma.admin.upsert({
    where: { email: process.env.ADMIN_EMAIL || "admin@3difybd.com" },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || "admin@3difybd.com",
      password: adminPassword,
      name: "Admin",
    },
  });
  console.log(`✅ Admin created: ${admin.email}`);

  // Create sample products
  const sampleProducts = [
    {
      name: "Dragon Figurine",
      description:
        "A beautifully detailed dragon figurine, perfect for collectors and fantasy enthusiasts. Each scale is meticulously crafted with high-resolution 3D printing technology.",
      price: 1500,
      images: ["/placeholder/dragon.jpg"],
      category: Category.FIGURINE,
      color: "Metallic Silver",
      size: "15x10x8 cm",
      weight: 120,
      infillPercentage: 30,
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
      weight: 35,
      infillPercentage: 50,
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
      weight: 200,
      infillPercentage: 20,
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
      weight: 80,
      infillPercentage: 40,
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
      weight: 450,
      infillPercentage: 25,
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
      weight: 300,
      infillPercentage: 15,
      customizable: true,
      inStock: true,
      featured: false,
    },
  ];

  for (const product of sampleProducts) {
    await prisma.product.create({ data: product });
  }
  console.log(`✅ ${sampleProducts.length} sample products created`);

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
