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
    <section className="py-20 bg-gray-50 dark:bg-dark-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            How It{" "}
            <span className="bg-gradient-to-r from-primary-500 to-primary-400 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400 text-lg">
            Getting your 3D printed product is simple
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative text-center group">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-dark-200 dark:to-dark-300" />
              )}

              {/* Step number */}
              <div className="relative inline-flex">
                <div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <step.icon className="w-8 h-8 text-white" />
                </div>
                <span className="absolute -top-2 -right-2 w-7 h-7 bg-white dark:bg-dark rounded-full flex items-center justify-center text-sm font-bold text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-dark-200">
                  {index + 1}
                </span>
              </div>

              <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
