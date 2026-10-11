import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { adminPasswordChangeSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Require JSON so a cross-site HTML form cannot submit this cookie-authenticated action.
    if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
      return NextResponse.json({ error: "Expected a JSON request." }, { status: 415 });
    }

    const body = await request.json().catch(() => null);
    const parsed = adminPasswordChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Account identity always comes from the authenticated session.
    const admin = await prisma.admin.findUnique({
      where: { id: session.id },
      select: { id: true, password: true },
    });
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = parsed.data;
    if (!(await compare(currentPassword, admin.password))) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    if (await compare(newPassword, admin.password)) {
      return NextResponse.json(
        { error: "Choose a new password different from your current password." },
        { status: 400 }
      );
    }

    const passwordHash = await hash(newPassword, 12);
    // Avoid overwriting a password changed by a concurrent request.
    const updated = await prisma.admin.updateMany({
      where: { id: admin.id, password: admin.password },
      data: { password: passwordHash },
    });
    if (updated.count !== 1) {
      return NextResponse.json(
        { error: "Your account changed while saving. Please try again with your current password." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    // Do not log request data or database errors that may include password values.
    console.error("Change admin password failed");
    return NextResponse.json({ error: "Unable to update your password. Please try again." }, { status: 500 });
  }
}
