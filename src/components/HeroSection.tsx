import Link from "next/link";
import { BsPrinter } from "react-icons/bs";
import { HiLightningBolt, HiShieldCheck, HiSparkles } from "react-icons/hi";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-dark to-primary-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.2),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(6,182,212,0.18),_transparent_22%)]" />
      <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:72px_72px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-28 lg:py-32">
        <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-3xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-400/20 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <BsPrinter className="w-4 h-4 text-primary-400" />
            <span className="text-sm font-medium text-primary-400">
              Made to Order in Bangladesh
            </span>
          </div>

          {/* Title */}
          <h1 className="text-balance text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-7xl">
            Precision-built{" "}
            <span className="bg-gradient-to-r from-primary-400 to-primary-300 bg-clip-text text-transparent">
              3D printed
            </span>
            <br />
            pieces with character
          </h1>

          {/* Subtitle */}
          <p className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-gray-300 sm:text-xl">
            From collectible figurines to practical custom prints, 3Dify BD turns
            sketches and concepts into durable, made-to-order products with a clean,
            premium finish.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 text-sm text-gray-200">
            {[
              { icon: HiSparkles, label: "Custom detailing" },
              { icon: HiLightningBolt, label: "Fast order response" },
              { icon: HiShieldCheck, label: "Transparent chat-based ordering" },
            ].map((item) => (
              <div
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 backdrop-blur-sm"
              >
                <item.icon className="h-4 w-4 text-primary-300" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <Link
              href="/products"
              className="inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-primary-500 via-primary-500 to-primary-700 px-8 py-3.5 text-lg font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary-500/25 sm:w-auto"
            >
              Browse Products
            </Link>
            <Link
              href="/about"
              className="inline-flex w-full items-center justify-center rounded-full border border-white/15 bg-white/5 px-8 py-3.5 text-lg font-semibold text-gray-100 transition-all hover:border-white/30 hover:bg-white/10 sm:w-auto"
            >
              Learn More
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid max-w-xl grid-cols-3 gap-4">
            {[
              { value: "50+", label: "Products" },
              { value: "100%", label: "Custom Made" },
              { value: "24h", label: "Response Time" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 text-center backdrop-blur-sm"
              >
                <div className="text-2xl font-bold text-primary-300 sm:text-3xl">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-gray-400 sm:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-primary-500/20 to-transparent blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/8 p-6 shadow-2xl shadow-slate-950/40 backdrop-blur-sm">
              <div className="grid gap-4">
                <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.24em] text-primary-300">
                      Build Quality
                    </span>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                      Verified finish
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {["Clean layers", "Custom sizes", "Material guidance"].map((item) => (
                      <div
                        key={item}
                        className="rounded-2xl border border-white/8 bg-white/5 px-3 py-4 text-center text-sm text-gray-200"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-[1.1fr_0.9fr] gap-4">
                  <div className="rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-primary-500/15 to-primary-900/20 p-5">
                    <div className="text-xs uppercase tracking-[0.24em] text-primary-200">
                      Ordering Flow
                    </div>
                    <p className="mt-3 text-xl font-semibold text-white">
                      Browse → chat → confirm → print → deliver
                    </p>
                    <p className="mt-3 text-sm leading-6 text-gray-300">
                      Simple, direct ordering with real human support instead of a confusing checkout.
                    </p>
                  </div>
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
                    <div className="text-xs uppercase tracking-[0.24em] text-gray-400">
                      Assurance
                    </div>
                    <p className="mt-3 text-3xl font-bold text-white">Made-to-order</p>
                    <p className="mt-2 text-sm text-gray-300">
                      Tailored recommendations for size, color, and finish before production starts.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
