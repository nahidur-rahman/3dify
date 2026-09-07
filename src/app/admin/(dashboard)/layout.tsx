import { getCurrentAdmin } from "@/lib/adminSession";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { redirect } from "next/navigation";
import "./admin.css";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const currentAdmin = await getCurrentAdmin();

  if (!currentAdmin) {
    redirect("/admin/login");
  }

  const adminUsername = currentAdmin?.username || "Admin";
  const adminRole = currentAdmin?.role === "SUPER" ? "SUPER" : "ADMIN";

  return (
    <div className="admin-shell flex h-dvh flex-col overflow-hidden md:h-screen md:flex-row">
      <AdminSidebar adminUsername={adminUsername} adminRole={adminRole} />
      <main className="admin-content min-w-0 flex-1 min-h-0 overflow-y-auto p-3 sm:p-8">{children}</main>
    </div>
  );
}
