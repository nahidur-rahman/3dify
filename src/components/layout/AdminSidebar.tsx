"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  HiOutlineHome,
  HiOutlineCube,
  HiOutlinePlusCircle,
  HiOutlineLogout,
  HiOutlineUsers,
  HiOutlineShoppingBag,
  HiOutlineTruck,
  HiOutlineMenu,
  HiX,
} from "react-icons/hi";
import type { AdminRole } from "@/lib/types";
import BrandLogo from "./BrandLogo";

interface AdminSidebarProps {
  adminUsername: string;
  adminRole: AdminRole;
}

export default function AdminSidebar({ adminUsername, adminRole }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const menuOpen = openPath === pathname;

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenPath(null);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);
  const roleClasses =
    adminRole === "SUPER"
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-300"
      : "bg-slate-500/10 text-slate-600 dark:text-slate-300";

  const links = [
    { href: "/admin", label: "Dashboard", icon: HiOutlineHome },
    { href: "/admin/orders", label: "Orders", icon: HiOutlineShoppingBag },
    { href: "/admin/products", label: "Products", icon: HiOutlineCube },
    { href: "/admin/shipping", label: "Shipping Rates", icon: HiOutlineTruck },
    { href: "/admin/admins", label: "Admins", icon: HiOutlineUsers },
    { href: "/admin/products/new", label: "Add Product", icon: HiOutlinePlusCircle },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="shrink-0 border-b border-gray-200 bg-white dark:border-dark-200 dark:bg-dark-100 md:flex md:h-screen md:w-64 md:flex-col md:border-b-0 md:border-r">
      <div className="flex min-h-14 items-center justify-between gap-3 px-3 py-2 md:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandLogo size="sm" className="h-7 w-auto shrink-0" />
          <div className="min-w-0 border-l border-gray-200 pl-2.5 dark:border-dark-200">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {adminRole === "SUPER" ? "Super Admin" : "Admin"}
            </p>
            <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">
              {adminUsername}
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="admin-navigation"
          onClick={() => setOpenPath(menuOpen ? null : pathname)}
          className="flex min-h-10 shrink-0 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-700 dark:border-dark-200 dark:text-gray-200"
        >
          <HiOutlineMenu className="h-5 w-5" />
          Menu
        </button>
      </div>

      {menuOpen && (
        <button
          type="button"
          aria-label="Close admin menu"
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] md:hidden"
          onClick={() => setOpenPath(null)}
        />
      )}

      <div
        id="admin-navigation"
        className={`${menuOpen ? "flex" : "hidden"} fixed inset-y-0 left-0 z-50 w-[min(20rem,calc(100vw-3rem))] min-h-0 flex-col overflow-y-auto border-r border-gray-200 bg-white shadow-2xl dark:border-dark-200 dark:bg-dark-100 md:static md:flex md:w-full md:flex-1 md:shadow-none`}
      >
      {/* Admin header */}
      <div className="relative border-b border-gray-200 px-5 py-5 dark:border-dark-200">
        <button
          type="button"
          aria-label="Close admin menu"
          onClick={() => setOpenPath(null)}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-dark-200 md:hidden"
        >
          <HiX className="h-5 w-5" />
        </button>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 pr-9 md:pr-0">
            <BrandLogo size="sm" className="shrink-0" />
            <span
              className={`inline-flex shrink-0 flex-col items-center rounded-full px-2.5 py-1 text-center text-[10px] font-semibold leading-tight tracking-[0.16em] ${
                adminRole === "SUPER" ? "w-[4.75rem]" : ""
              } ${roleClasses}`}
            >
              {adminRole === "SUPER" ? (
                <>
                  <span>SUPER</span>
                  <span>ADMIN</span>
                </>
              ) : (
                <span>ADMIN</span>
              )}
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold leading-none text-gray-900 dark:text-white">
              Admin Panel
            </p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">
              {adminUsername}
            </p>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav aria-label="Admin navigation" className="flex-1 space-y-1 p-4">
        {links.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : link.href === "/admin/products"
                ? pathname === "/admin/products" ||
                  (pathname.startsWith("/admin/products/") &&
                    !pathname.startsWith("/admin/products/new"))
                : pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive ? "page" : undefined}
              onClick={() => setOpenPath(null)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-500/10 text-primary-500"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-200 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <link.icon className="w-5 h-5 shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="mt-auto border-t border-gray-200 p-4 dark:border-dark-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors w-full"
        >
          <HiOutlineLogout className="w-5 h-5" />
          Logout
        </button>
      </div>
      </div>
    </aside>
  );
}
