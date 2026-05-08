"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HiMenu, HiX, HiMoon, HiSun } from "react-icons/hi";
import { BsPrinter } from "react-icons/bs";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
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
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-white/75 backdrop-blur-xl dark:bg-dark/75 dark:shadow-[0_10px_40px_rgba(2,8,23,0.35)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-700 shadow-lg shadow-primary-500/20 transition-transform group-hover:scale-105">
              <BsPrinter className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="block bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-xl font-bold text-transparent">
                3Dify BD
              </span>
              <span className="hidden text-[11px] uppercase tracking-[0.24em] text-gray-500 dark:text-gray-400 sm:block">
                Custom Printed Goods
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-3 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-all",
                  pathname === link.href
                    ? "bg-primary-500/12 text-primary-600 shadow-sm shadow-primary-500/10 dark:text-primary-300"
                    : "text-gray-600 hover:bg-white/70 hover:text-primary-500 dark:text-gray-300 dark:hover:bg-dark-100 dark:hover:text-primary-300"
                )}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="rounded-full border border-gray-200/70 p-2 text-gray-600 transition-colors hover:bg-white dark:border-dark-200 dark:text-gray-300 dark:hover:bg-dark-100"
            >
              {theme === "dark" ? (
                <HiSun className="w-5 h-5" />
              ) : (
                <HiMoon className="w-5 h-5" />
              )}
            </button>
            <Link
              href="/products"
              className="rounded-full bg-gradient-to-r from-primary-500 via-primary-500 to-primary-700 px-5 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary-500/25"
            >
              Shop Now
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Close menu" : "Open menu"}
            className="rounded-xl p-2 text-gray-600 hover:bg-white dark:text-gray-300 dark:hover:bg-dark-100 md:hidden"
          >
            {isOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="border-t border-gray-200/80 py-4 dark:border-dark-200 md:hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "block rounded-xl px-3 py-3 font-medium transition-colors",
                  pathname === link.href
                    ? "bg-primary-500/10 text-primary-600 dark:text-primary-300"
                    : "text-gray-600 hover:bg-white hover:text-primary-500 dark:text-gray-300 dark:hover:bg-dark-100"
                )}
              >
                {link.label}
              </Link>
            ))}
            <button
              onClick={toggleTheme}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-2 py-3 font-medium text-gray-600 hover:bg-white hover:text-primary-500 dark:text-gray-300 dark:hover:bg-dark-100"
            >
              {theme === "dark" ? (
                <HiSun className="w-5 h-5" />
              ) : (
                <HiMoon className="w-5 h-5" />
              )}
              {theme === "dark" ? "Switch to Light" : "Switch to Dark"}
            </button>
            <Link
              href="/products"
              onClick={() => setIsOpen(false)}
              className="mt-3 block rounded-full bg-gradient-to-r from-primary-500 to-primary-700 px-5 py-3 text-center font-semibold text-white"
            >
              Shop Now
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
