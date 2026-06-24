import Link from "next/link";
import { FaFacebookMessenger, FaWhatsapp } from "react-icons/fa";
import { categoryByValue, getCategoryPath, type Category } from "@/lib/categories";
import BrandLogo from "./BrandLogo";
import { getMessengerLink, getWhatsAppLink } from "@/lib/utils";

const footerCategoryValues: Category[] = [
  "HOME_DECOR",
  "DESK_ACCESSORIES",
  "COLLECTIBLES_AND_FIGURES",
  "CUSTOM_AND_PERSONALIZED",
];

export default function Footer() {
  const whatsappReady = Boolean((process.env.NEXT_PUBLIC_WHATSAPP || "").trim());
  const messengerReady = Boolean((process.env.NEXT_PUBLIC_MESSENGER || "").trim());

  return (
    <footer className="border-t border-gray-200/80 bg-gray-50/80 dark:border-dark-200 dark:bg-dark-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="group inline-flex mb-4">
              <BrandLogo
                className="transition-transform group-hover:scale-[1.04]"
              />
            </Link>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Premium 3D printed products made to order in Bangladesh, spanning
              decor, workspace pieces, collectibles, gifts, and custom commissions.
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
              {footerCategoryValues.map((categoryValue) => {
                const category = categoryByValue[categoryValue];

                return (
                  <li key={category.value}>
                    <Link
                      href={getCategoryPath(category)}
                      className="text-gray-500 dark:text-gray-400 hover:text-primary-500 transition-colors"
                    >
                      {category.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-gray-200 dark:border-dark-200 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} 3Dify BD. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
