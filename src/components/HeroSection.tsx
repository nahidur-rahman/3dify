import Link from "next/link";
import { BsPrinter } from "react-icons/bs";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark via-dark-100 to-primary-950" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMjIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDJ2LTJoMzR6bTAtMzBWMEgydjRoMzR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 mb-6">
            <BsPrinter className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-primary-400">
              Made to Order in Bangladesh
            </span>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-tight">
            Premium{" "}
            <span className="bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
              3D Printed
            </span>
            <br />
            Products
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            From figurines to phone cases, home decor to custom models — we bring
            your ideas to life, one layer at a time.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/products"
              className="w-full sm:w-auto bg-gradient-to-r from-primary-500 to-primary-600 text-white px-8 py-3.5 rounded-full font-semibold text-lg hover:from-primary-600 hover:to-primary-700 transition-all hover:shadow-xl hover:shadow-primary-500/25 hover:-translate-y-0.5"
            >
              Browse Products
            </Link>
            <Link
              href="/about"
              className="w-full sm:w-auto border border-gray-600 text-gray-300 px-8 py-3.5 rounded-full font-semibold text-lg hover:bg-white/5 hover:border-gray-500 transition-all"
            >
              Learn More
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto">
            {[
              { value: "50+", label: "Products" },
              { value: "100%", label: "Custom Made" },
              { value: "24h", label: "Response Time" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl sm:text-3xl font-bold text-primary-400">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
