import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/adminSession";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentAdmin = await getCurrentAdmin();

    if (!currentAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentAdmin.role !== "SUPER") {
      return NextResponse.json(
        { error: "Only SUPER admins can delete admin accounts." },
        { status: 403 }
      );
    }

    if (currentAdmin.id === params.id) {
      return NextResponse.json(
        { error: "You cannot delete your own admin account." },
        { status: 400 }
      );
    }

    const targetAdmin = await prisma.admin.findUnique({
      where: { id: params.id },
      select: { id: true },
    });

    if (!targetAdmin) {
      return NextResponse.json({ error: "Admin not found." }, { status: 404 });
    }

    await prisma.admin.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}