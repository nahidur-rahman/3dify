import { HiSearch, HiCube, HiChat, HiTruck } from "react-icons/hi";

const steps = [
  {
    icon: HiSearch,
    title: "Browse",
    description: "Explore our collection of 3D printed products",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: HiChat,
    title: "Contact",
    description: "Reach out via WhatsApp or Messenger to order",
    color: "from-green-500 to-green-600",
  },
  {
    icon: HiCube,
    title: "We Print",
    description: "We 3D print your order with premium materials",
    color: "from-primary-500 to-primary-600",
  },
  {
    icon: HiTruck,
    title: "Deliver",
    description: "Your product is delivered right to your doorstep",
    color: "from-purple-500 to-purple-600",
  },
];

export default function HowItWorks() {
  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] border border-gray-200/70 bg-gray-50/80 p-6 shadow-sm dark:border-dark-200 dark:bg-dark-100/80 sm:p-8">
          <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex rounded-full border border-primary-500/15 bg-primary-500/5 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-500 dark:text-primary-300">
                Simple Process
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                How it{" "}
                <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
                  works
                </span>
              </h2>
              <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                A clear, chat-first workflow that keeps ordering human, flexible, and fast.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200/80 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm dark:border-dark-200 dark:bg-dark dark:text-gray-300">
              No complicated checkout. You confirm details with us before anything gets printed.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="relative text-center group">
                {index < steps.length - 1 && (
                  <div className="absolute left-[60%] top-8 hidden h-0.5 w-[80%] bg-gradient-to-r from-primary-200 via-primary-100 to-transparent dark:from-primary-800 dark:via-dark-200 lg:block" />
                )}

                <div className="relative inline-flex">
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-gradient-to-br ${step.color} shadow-lg transition-transform duration-200 group-hover:scale-105`}
                  >
                    <step.icon className="h-7 w-7 text-white" />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-[11px] font-bold text-gray-700 dark:border-dark-200 dark:bg-dark dark:text-gray-300">
                    {index + 1}
                  </span>
                </div>

                <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-sm leading-5 text-gray-500 dark:text-gray-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
