"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BsPrinter } from "react-icons/bs";
import {
  HiOutlineHome,
  HiOutlineCube,
  HiOutlinePlusCircle,
  HiOutlineLogout,
  HiOutlineUsers,
} from "react-icons/hi";
import type { AdminRole } from "@/lib/types";

interface AdminSidebarProps {
  adminName: string;
  adminRole: AdminRole;
}

export default function AdminSidebar({ adminName, adminRole }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/admin", label: "Dashboard", icon: HiOutlineHome },
    { href: "/admin/products", label: "Products", icon: HiOutlineCube },
    { href: "/admin/admins", label: "Admins", icon: HiOutlineUsers },
    { href: "/admin/products/new", label: "Add Product", icon: HiOutlinePlusCircle },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <aside className="w-64 bg-white dark:bg-dark-100 border-r border-gray-200 dark:border-dark-200 hidden md:flex flex-col">
      {/* Admin header */}
      <div className="p-6 border-b border-gray-200 dark:border-dark-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
            <BsPrinter className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white">
              Admin Panel
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{adminName}</p>
            <span
              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] ${
                adminRole === "SUPER"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-300"
                  : "bg-slate-500/10 text-slate-600 dark:text-slate-300"
              }`}
            >
              {adminRole === "SUPER" ? "SUPER ADMIN" : "ADMIN"}
            </span>
          </div>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const isActive =
            link.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary-500/10 text-primary-500"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-200 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <link.icon className="w-5 h-5" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-dark-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors w-full"
        >
          <HiOutlineLogout className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
