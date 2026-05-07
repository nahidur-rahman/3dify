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

  const adminName = currentAdmin?.name || "Admin";
  const adminRole = currentAdmin?.role === "SUPER" ? "SUPER" : "ADMIN";

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <AdminSidebar adminName={adminName} adminRole={adminRole} />
      <div className="flex-1 p-6 sm:p-8 overflow-auto">{children}</div>
    </div>
  );
}
