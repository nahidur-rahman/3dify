import Link from "next/link";
import { BsPrinter } from "react-icons/bs";
import { FaFacebookMessenger, FaWhatsapp } from "react-icons/fa";
import { getMessengerLink, getWhatsAppLink } from "@/lib/utils";

export default function Footer() {
  const whatsappReady = Boolean((process.env.NEXT_PUBLIC_WHATSAPP || "").trim());
  const messengerReady = Boolean((process.env.NEXT_PUBLIC_MESSENGER || "").trim());

  return (
    <footer className="border-t border-gray-200/80 bg-gray-50/80 dark:border-dark-200 dark:bg-dark-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600">
                <BsPrinter className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="block bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-xl font-bold text-transparent">
                  3Dify BD
                </span>
                <span className="text-[11px] uppercase tracking-[0.24em] text-gray-400">
                  Modern 3D craftsmanship
                </span>
              </div>
            </Link>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Premium 3D printed products made to order in Bangladesh. From figurines
              to phone cases, we bring your ideas to life layer by layer.
            </p>
            <div className="flex gap-3 mt-4">
              {whatsappReady ? (
                <a
                  href={getWhatsAppLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contact on WhatsApp"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500 text-white transition-colors hover:bg-green-600"
                >
                  <FaWhatsapp className="w-5 h-5" />
                </a>
              ) : (
                <div className="w-10 h-10 bg-gray-300 dark:bg-dark-300 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400">
                  <FaWhatsapp className="w-5 h-5" />
                </div>
              )}

              {messengerReady ? (
                <a
                  href={getMessengerLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Contact on Messenger"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white transition-colors hover:bg-blue-600"
                >
                  <FaFacebookMessenger className="w-5 h-5" />
                </a>
              ) : (
                <div className="w-10 h-10 bg-gray-300 dark:bg-dark-300 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400">
                  <FaFacebookMessenger className="w-5 h-5" />
                </div>
              )}
            </div>
            {(!whatsappReady || !messengerReady) && (
              <p className="text-xs text-gray-400 mt-2">
                Contact links appear only after they are configured and verified.
              </p>
            )}
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
