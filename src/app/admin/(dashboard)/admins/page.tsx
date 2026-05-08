import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/adminSession";
import AdminForm from "@/components/AdminForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import DeleteAdminButton from "./DeleteAdminButton";

async function getAdmins() {
  return prisma.admin.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function AdminsPage() {
  const [currentAdmin, admins] = await Promise.all([getCurrentAdmin(), getAdmins()]);

  const adminName = currentAdmin?.name || "Admin";
  const adminRole = currentAdmin?.role === "SUPER" ? "SUPER" : "ADMIN";
  const canCreateAdmins = adminRole === "SUPER";
  const canDeleteAdmins = adminRole === "SUPER";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admins
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Review administrator accounts. Only SUPER admins can create or delete admin accounts.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/5 px-4 py-2 text-sm text-primary-500">
          Signed in as {adminName}
          <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold tracking-[0.18em] text-primary-500 dark:bg-dark-100/80 dark:text-primary-300">
            {adminRole === "SUPER" ? "SUPER ADMIN" : "ADMIN"}
          </span>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        {canCreateAdmins ? (
          <AdminForm />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Admin Creation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                Only SUPER admins can create new admin accounts. Request access from a SUPER admin when a new ADMIN is needed.
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Current Admins</CardTitle>
          </CardHeader>
          <CardContent>
            {admins.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 dark:border-dark-200 px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No admins found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-dark-200 text-left text-sm text-gray-500 dark:text-gray-400">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Created</th>
                      {canDeleteAdmins && (
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((admin) => (
                      <tr
                        key={admin.id}
                        className="border-b border-gray-100 dark:border-dark-200 last:border-0"
                      >
                        <td className="px-4 py-4">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {admin.name}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {admin.email}
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold tracking-[0.16em] ${
                              admin.role === "SUPER"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-300"
                                : "bg-slate-500/10 text-slate-600 dark:text-slate-300"
                            }`}
                          >
                            {admin.role}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {admin.createdAt.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
                        {canDeleteAdmins && (
                          <td className="px-4 py-4 text-right">
                            {admin.id === currentAdmin?.id ? (
                              <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 dark:bg-dark-200 dark:text-gray-300">
                                Current
                              </span>
                            ) : (
                              <DeleteAdminButton adminId={admin.id} adminName={admin.name} />
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}