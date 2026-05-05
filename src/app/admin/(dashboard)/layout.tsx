import { headers } from "next/headers";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = headers();
  const adminName = requestHeaders.get("x-admin-name") || "Admin";

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <AdminSidebar adminName={adminName} />
      <div className="flex-1 p-6 sm:p-8 overflow-auto">{children}</div>
    </div>
  );
}
