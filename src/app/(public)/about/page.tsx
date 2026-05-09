import { Metadata } from "next";
import Link from "next/link";
import { BsPrinter } from "react-icons/bs";
import { HiLightningBolt, HiHeart, HiCube, HiChat } from "react-icons/hi";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about 3Dify BD - premium 3D printed products made to order in Bangladesh.",
};

const features = [
  {
    icon: HiCube,
    title: "Premium Quality",
    description:
      "We use high-quality materials and precise printing settings to ensure every product meets our standards.",
  },
  {
    icon: HiLightningBolt,
    title: "Fast Turnaround",
    description:
      "Most orders are printed and ready within 24-48 hours. We value your time as much as quality.",
  },
  {
    icon: HiHeart,
    title: "Made with Care",
    description:
      "Every item is carefully inspected and finished by hand before it reaches you.",
  },
  {
    icon: HiChat,
    title: "Direct Communication",
    description:
      "No middleman - chat with us directly on WhatsApp or Messenger to discuss your order.",
  },
];

export default function AboutPage() {
  const whatsappReady = Boolean((process.env.NEXT_PUBLIC_WHATSAPP || "").trim());

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="mx-auto mb-10 max-w-4xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/10 px-3 py-0.5">
          <BsPrinter className="w-4 h-4 text-primary-400" />
          <span className="text-xs font-medium text-primary-500">Our Story</span>
        </div>
        <h1 className="text-3xl font-bold leading-tight text-gray-900 dark:text-white sm:text-4xl">
          Bringing Ideas to Life,{" "}
          <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
            One Layer at a Time
          </span>
        </h1>
        <p className="mt-4 text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
          3Dify BD is a startup born out of passion for 3D printing technology. Based
          in Bangladesh, we create premium 3D printed products - from detailed
          figurines and custom phone cases to stunning home decor pieces. Every
          product is printed to order with care and precision.
        </p>
      </div>

      {/* What is 3D Printing */}
      <div className="mb-12 rounded-[2rem] border border-gray-200/70 bg-gray-50/80 p-6 shadow-sm dark:border-dark-200 dark:bg-dark-100/80 sm:p-8">
        <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          What is 3D Printing?
        </h2>
        <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
          3D printing (or additive manufacturing) is a process of creating three-dimensional
          objects from a digital file. The object is built layer by layer using materials
          like PLA, ABS, or PETG plastic. This technology allows us to create intricate,
          detailed, and customized products that traditional manufacturing can&apos;t easily
          achieve. From prototypes to finished products, the possibilities are virtually
          endless.
        </p>
      </div>

      {/* Why Choose Us */}
      <div className="mb-12">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          Why Choose{" "}
          <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
            3Dify BD
          </span>
          ?
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:border-primary-500/50 dark:border-dark-200 dark:bg-dark-100"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/10 text-primary-500">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="rounded-[2rem] bg-gradient-to-r from-primary-600 to-primary-800 p-6 text-center shadow-2xl shadow-primary-900/20 sm:p-8">
        <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
          Ready to Get Started?
        </h2>
        <p className="mx-auto mb-5 max-w-xl text-sm text-primary-100 sm:text-base">
          Browse our products or reach out to us directly. We&apos;d love to help you
          find or create the perfect 3D printed item.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          {whatsappReady ? (
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full rounded-full bg-white px-6 py-2.5 font-semibold text-primary-600 transition-all hover:bg-gray-50 sm:w-auto"
            >
              Chat on WhatsApp
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="w-full cursor-not-allowed rounded-full bg-gray-200 px-6 py-2.5 font-semibold text-gray-500 sm:w-auto"
            >
              WhatsApp Unavailable
            </button>
          )}
          <Link
            href="/products"
            className="w-full rounded-full border border-white/30 px-6 py-2.5 font-semibold text-white transition-all hover:bg-white/10 sm:w-auto"
          >
            Browse Products
          </Link>
        </div>
        {!whatsappReady && (
          <p className="mt-3 text-xs text-primary-100/90">
            WhatsApp contact is not configured yet.
          </p>
        )}
      </div>
    </div>
  );
}