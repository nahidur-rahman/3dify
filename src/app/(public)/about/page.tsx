import { Metadata } from "next";
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 mb-6">
          <BsPrinter className="w-4 h-4 text-primary-400" />
          <span className="text-sm font-medium text-primary-500">Our Story</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white leading-tight">
          Bringing Ideas to Life,{" "}
          <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
            One Layer at a Time
          </span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          3Dify BD is a startup born out of passion for 3D printing technology. Based
          in Bangladesh, we create premium 3D printed products - from detailed
          figurines and custom phone cases to stunning home decor pieces. Every
          product is printed to order with care and precision.
        </p>
      </div>

      {/* What is 3D Printing */}
      <div className="bg-gray-50 dark:bg-dark-100 rounded-3xl p-8 sm:p-12 mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
          What is 3D Printing?
        </h2>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-lg">
          3D printing (or additive manufacturing) is a process of creating three-dimensional
          objects from a digital file. The object is built layer by layer using materials
          like PLA, ABS, or PETG plastic. This technology allows us to create intricate,
          detailed, and customized products that traditional manufacturing can&apos;t easily
          achieve. From prototypes to finished products, the possibilities are virtually
          endless.
        </p>
      </div>

      {/* Why Choose Us */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-10">
          Why Choose{" "}
          <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
            3Dify BD
          </span>
          ?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white dark:bg-dark-100 rounded-2xl border border-gray-200 dark:border-dark-200 p-6 hover:border-primary-500/50 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 mb-4">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-gradient-to-r from-primary-600 to-primary-800 rounded-3xl p-8 sm:p-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Ready to Get Started?
        </h2>
        <p className="text-primary-100 mb-6 max-w-xl mx-auto">
          Browse our products or reach out to us directly. We&apos;d love to help you
          find or create the perfect 3D printed item.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {whatsappReady ? (
            <a
              href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || ""}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-white text-primary-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-50 transition-all"
            >
              Chat on WhatsApp
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="w-full sm:w-auto bg-gray-200 text-gray-500 px-8 py-3 rounded-full font-semibold cursor-not-allowed"
            >
              WhatsApp Unavailable
            </button>
          )}
          <a
            href="/products"
            className="w-full sm:w-auto border-2 border-white/30 text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition-all"
          >
            Browse Products
          </a>
        </div>
        {!whatsappReady && (
          <p className="mt-3 text-sm text-primary-100/90">
            WhatsApp contact is not configured yet.
          </p>
        )}
      </div>
    </div>
  );
}