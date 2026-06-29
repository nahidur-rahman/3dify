"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HiMenu, HiX, HiMoon, HiSun, HiSearch, HiOutlineShoppingCart, HiOutlineUser } from "react-icons/hi";
import { cn } from "@/lib/utils";
import BrandLogo from "./BrandLogo";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const pathname = usePathname();

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

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

  return (
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
            <div className="flex w-full rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 overflow-hidden focus-within:ring-2 focus-within:ring-primary-800 focus-within:border-primary-800 transition-shadow">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-transparent px-5 py-2.5 text-sm outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500"
              />
              <button aria-label="Search" className="px-4 text-gray-500 hover:text-primary-800 dark:hover:text-primary-400 transition-colors flex items-center justify-center">
                <HiSearch className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right Tools */}
          <div className="hidden md:flex flex-shrink-0 items-center gap-6">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="text-gray-700 hover:text-primary-800 dark:text-gray-300 dark:hover:text-primary-400 transition-colors"
            >
              {theme === "dark" ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
            </button>
            <Link href="/login" className="flex flex-col items-center gap-1 text-gray-700 hover:text-primary-800 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
              <HiOutlineUser className="w-6 h-6" />
              <span className="text-[10px] uppercase font-bold sm:inline-block hidden">Account</span>
            </Link>
            <Link href="/cart" className="flex flex-col items-center gap-1 text-gray-700 hover:text-primary-800 dark:text-gray-300 dark:hover:text-primary-400 transition-colors">
              <div className="relative">
                 <HiOutlineShoppingCart className="w-6 h-6" />
                 <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">0</span>
              </div>
              <span className="text-[10px] uppercase font-bold sm:inline-block hidden">Cart</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            className="rounded-xl p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-100 md:hidden"
          >
            {isOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {isOpen && (
        <div className="border-t border-black/5 py-4 dark:border-dark-100 md:hidden bg-white dark:bg-dark px-4 shadow-xl absolute w-full left-0">
          <div className="mb-4">
             <div className="flex w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-dark-100 overflow-hidden focus-within:ring-2 focus-within:ring-primary-800 focus-within:border-primary-800 transition-shadow">
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-full bg-transparent px-4 py-2.5 text-sm outline-none text-gray-900 dark:text-gray-100"
                />
                <button aria-label="Search" className="bg-primary-800 dark:bg-primary-700 text-white px-4 flex items-center justify-center">
                  <HiSearch className="w-5 h-5" />
                </button>
             </div>
          </div>
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
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-black/5 dark:border-white/10">
            <button
              onClick={toggleTheme}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl px-2 py-3 font-medium text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-dark-100"
            >
              {theme === "dark" ? <HiSun className="w-5 h-5" /> : <HiMoon className="w-5 h-5" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
            <Link
              href="/cart"
              onClick={() => setIsOpen(false)}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary-800 text-center font-bold text-white px-2 py-3"
            >
              <HiOutlineShoppingCart className="w-5 h-5" /> Cart (0)
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
