import { getSession } from "@/lib/auth";
import AdminSidebar from "@/components/layout/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const adminName = session?.name || "Admin";

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <AdminSidebar adminName={adminName} />
      <div className="flex-1 p-6 sm:p-8 overflow-auto">{children}</div>
    </div>
  );
}
