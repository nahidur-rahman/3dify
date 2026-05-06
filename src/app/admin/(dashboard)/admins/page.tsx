import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminForm from "@/components/AdminForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

async function getAdmins() {
  return prisma.admin.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function AdminsPage() {
  const session = await getSession();
  const adminName = session?.name || "Admin";
  const admins = await getAdmins();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admins
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Create and review administrator accounts.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/20 bg-primary-500/5 px-4 py-2 text-sm text-primary-500">
          Signed in as {adminName}
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminForm />

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
                      <th className="px-4 py-3 font-medium">Created</th>
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
                        <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {admin.createdAt.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </td>
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