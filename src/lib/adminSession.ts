import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function getCurrentAdmin() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  return prisma.admin.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });
}