import { getCurrentAdmin } from "@/lib/adminSession";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { redirect } from "next/navigation";

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
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar adminUsername={adminUsername} adminRole={adminRole} />
      <div className="flex-1 min-h-0 overflow-y-auto p-6 sm:p-8">{children}</div>
    </div>
  );
}
