"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import {
  HiMenu,
  HiMoon,
  HiOutlineDocumentText,
  HiOutlineShoppingCart,
  HiSun,
  HiX,
} from "react-icons/hi";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import BrandLogo from "./BrandLogo";
import NavbarSearch from "./NavbarSearch";
import CartDrawer from "@/components/CartDrawer";
import OrdersDrawer from "@/components/OrdersDrawer";
import {
  LOCAL_ORDERS_UPDATED_EVENT,
  loadStoredOrders,
} from "@/lib/localOrderHistory";
import {
  getFacebookLink,
  getInstagramLink,
  hasFacebookConfigured,
  hasInstagramConfigured,
} from "@/lib/utils";

function NavbarSearchFallback({ mobile = false }: { mobile?: boolean }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse border border-gray-200 bg-gray-50 dark:border-dark-200 dark:bg-dark-100",
        mobile ? "h-11 w-full rounded-xl" : "h-11 w-full rounded-full"
      )}
    />
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [ordersCount, setOrdersCount] = useState(0);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const pathname = usePathname();
  const { cartCount, openDrawer, closeDrawer } = useCart();
  const facebookReady = hasFacebookConfigured();
  const instagramReady = hasInstagramConfigured();
  const facebookLink = getFacebookLink();
  const instagramLink = getInstagramLink();

  const refreshOrdersCount = useCallback(() => {
    setOrdersCount(loadStoredOrders().length);
  }, []);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
    refreshOrdersCount();
  }, [refreshOrdersCount]);

  useEffect(() => {
    function handleOrdersUpdated() {
      refreshOrdersCount();
    }

    window.addEventListener("storage", handleOrdersUpdated);
    window.addEventListener(LOCAL_ORDERS_UPDATED_EVENT, handleOrdersUpdated);

    return () => {
      window.removeEventListener("storage", handleOrdersUpdated);
      window.removeEventListener(LOCAL_ORDERS_UPDATED_EVENT, handleOrdersUpdated);
    };
  }, [refreshOrdersCount]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", nextTheme);
  };

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/about", label: "About" },
  ];

  const socialButtonBaseClasses =
    "flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors duration-200";
  const facebookSocialButtonClasses = cn(
    socialButtonBaseClasses,
    "bg-[#1877F2] hover:bg-blue-600"
  );
  const instagramSocialButtonClasses = cn(
    socialButtonBaseClasses,
    "bg-[#E1306C] hover:bg-[#C13584]"
  );
  const disabledSocialButtonClasses =
    "flex h-10 w-10 cursor-not-allowed items-center justify-center rounded-full border border-gray-200 text-gray-300 dark:border-dark-200 dark:text-gray-600";

  const openOrdersDrawer = () => {
    closeDrawer();
    refreshOrdersCount();
    setIsOrdersOpen(true);
  };

  const openCartPanel = () => {
    setIsOrdersOpen(false);
    openDrawer();
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/5 dark:border-white/10 dark:bg-dark/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between gap-4 sm:gap-8">
            {/* Logo & Navigation */}
            <div className="flex items-center gap-8">
                <Link href="/" className="group inline-flex flex-shrink-0">
                  <BrandLogo className="transition-transform group-hover:scale-[1.04]" />
                </Link>
                
                <div className="hidden lg:flex items-center gap-6">
                  {navLinks.map((link) => (
                      <Link
                          key={link.href}
                          href={link.href}
                          className={cn(
                          "text-sm font-bold transition-all",
                          pathname === link.href
                              ? "text-primary-800 dark:text-primary-400"
                              : "text-gray-600 hover:text-primary-800 dark:text-gray-300 dark:hover:text-white"
                          )}
                      >
                          {link.label}
                      </Link>
                  ))}
                </div>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-sm ml-auto mr-4 lg:mx-auto">
              <Suspense fallback={<NavbarSearchFallback />}>
                <NavbarSearch />
              </Suspense>
            </div>

            {/* Right Tools */}
            <div className="hidden md:flex flex-shrink-0 items-center gap-4">
              {facebookReady ? (
                <a
                  href={facebookLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className={facebookSocialButtonClasses}
                >
                  <FaFacebookF className="h-4 w-4" />
                </a>
              ) : (
                <button type="button" aria-label="Facebook unavailable" disabled className={disabledSocialButtonClasses}>
                  <FaFacebookF className="h-4 w-4" />
                </button>
              )}

              {instagramReady ? (
                <a
                  href={instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className={instagramSocialButtonClasses}
                >
                  <FaInstagram className="h-4 w-4" />
                </a>
              ) : (
                <button type="button" aria-label="Instagram unavailable" disabled className={disabledSocialButtonClasses}>
                  <FaInstagram className="h-4 w-4" />
                </button>
              )}

              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="text-gray-700 hover:text-primary-800 dark:text-gray-300 dark:hover:text-primary-400 transition-colors"
              >
                {theme === "dark" ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
              </button>
              <button
                onClick={openOrdersDrawer}
                className="flex flex-col items-center gap-1 text-gray-700 hover:text-primary-800 dark:text-gray-300 dark:hover:text-primary-400 transition-colors"
              >
                <div className="relative">
                  <HiOutlineDocumentText className="w-6 h-6" />
                  {ordersCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-bold text-white">
                      {ordersCount > 99 ? "99+" : ordersCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase font-bold sm:inline-block hidden">Orders</span>
              </button>
              <button
                onClick={openCartPanel}
                className="flex flex-col items-center gap-1 text-gray-700 hover:text-primary-800 dark:text-gray-300 dark:hover:text-primary-400 transition-colors"
              >
                <div className="relative">
                   <HiOutlineShoppingCart className="w-6 h-6" />
                   {cartCount > 0 && (
                     <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce-once">
                       {cartCount > 99 ? "99+" : cartCount}
                     </span>
                   )}
                </div>
                <span className="text-[10px] uppercase font-bold sm:inline-block hidden">Cart</span>
              </button>
            </div>

            {/* Mobile Social Icons & Menu Button */}
            <div className="md:hidden flex items-center gap-1">
              {facebookReady ? (
                <a
                  href={facebookLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors duration-200 bg-[#1877F2] hover:bg-blue-600"
                >
                  <FaFacebookF className="h-3.5 w-3.5" />
                </a>
              ) : null}

              {instagramReady ? (
                <a
                  href={instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors duration-200 bg-[#E1306C] hover:bg-[#C13584]"
                >
                  <FaInstagram className="h-3.5 w-3.5" />
                </a>
              ) : null}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close menu" : "Open menu"}
                className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-100"
              >
                {isOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {isOpen && (
          <div className="border-t border-black/5 py-4 dark:border-dark-100 md:hidden bg-white dark:bg-dark px-4 shadow-xl absolute w-full left-0">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block rounded-xl px-4 py-3 font-medium transition-colors mb-2",
                  pathname === link.href
                    ? "bg-primary-50 text-primary-800 dark:bg-dark-100 dark:text-primary-300"
                    : "text-gray-700 hover:bg-black/5 hover:text-primary-800 dark:text-gray-300 dark:hover:bg-dark-100"
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-6 space-y-3 border-t border-black/5 pt-4 dark:border-white/10">
              <button
                onClick={toggleTheme}
                className="flex w-full items-center justify-center gap-2 rounded-xl px-2 py-3 font-medium text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-dark-100"
              >
                {theme === "dark" ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    openOrdersDrawer();
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-2 py-3 text-center font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-dark-200 dark:text-gray-300 dark:hover:bg-dark-100"
                >
                  <HiOutlineDocumentText className="w-5 h-5" /> Orders ({ordersCount})
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    openCartPanel();
                  }}
                  className="flex items-center justify-center gap-2 rounded-xl bg-primary-800 px-2 py-3 text-center font-bold text-white"
                >
                  <HiOutlineShoppingCart className="w-5 h-5" /> Cart ({cartCount})
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* Cart Drawer rendered here so it's always available */}
      <CartDrawer />
      <OrdersDrawer isOpen={isOrdersOpen} onClose={() => setIsOrdersOpen(false)} />
    </>
  );
}
