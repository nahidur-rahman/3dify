import Link from "next/link";
import { BsPrinter } from "react-icons/bs";
import { FaFacebookMessenger, FaWhatsapp } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gray-50 dark:bg-dark-100 border-t border-gray-200 dark:border-dark-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                <BsPrinter className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
                3Dify BD
              </span>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Premium 3D printed products made to order in Bangladesh. From figurines
              to phone cases, we bring your ideas to life layer by layer.
            </p>
            <div className="flex gap-3 mt-4">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP || ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:bg-green-600 transition-colors"
              >
                <FaWhatsapp className="w-5 h-5" />
              </a>
              <a
                href={`https://m.me/${process.env.NEXT_PUBLIC_MESSENGER || ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
              >
                <FaFacebookMessenger className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/", label: "Home" },
                { href: "/products", label: "Products" },
                { href: "/about", label: "About Us" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
              Categories
            </h3>
            <ul className="space-y-2">
              {[
                { href: "/products?category=FIGURINE", label: "Figurines" },
                { href: "/products?category=PHONE_CASE", label: "Phone Cases" },
                { href: "/products?category=HOME_DECOR", label: "Home Decor" },
                { href: "/products?category=CUSTOM", label: "Custom Models" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-dark-200 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} 3Dify BD. All rights reserved.</p>
          <p className="mt-1">Made with 🖨️ and ❤️ in Bangladesh</p>
        </div>
      </div>
    </footer>
  );
}
