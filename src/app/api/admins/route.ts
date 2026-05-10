import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/adminSession";
import { adminCreateSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const currentAdmin = await getCurrentAdmin();
    if (!currentAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (currentAdmin.role !== "SUPER") {
      return NextResponse.json(
        { error: "Only SUPER admins can create admin accounts." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = adminCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const username = parsed.data.username.trim();
    const name = parsed.data.name.trim();
    const email = parsed.data.email.trim();

    const existingEmailAdmin = await prisma.admin.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingEmailAdmin) {
      return NextResponse.json(
        {
          error: "An admin with that email already exists.",
          details: {
            fieldErrors: {
              email: ["An admin with that email already exists."],
            },
          },
        },
        { status: 409 }
      );
    }

    const existingUsernameAdmin = await prisma.admin.findUnique({
      where: { username },
      select: { id: true },
    });

    if (existingUsernameAdmin) {
      return NextResponse.json(
        {
          error: "An admin with that username already exists.",
          details: {
            fieldErrors: {
              username: ["An admin with that username already exists."],
            },
          },
        },
        { status: 409 }
      );
    }

    const passwordHash = await hash(parsed.data.password, 12);

    const admin = await prisma.admin.create({
      data: {
        username,
        name,
        email,
        password: passwordHash,
        role: "ADMIN",
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, admin }, { status: 201 });
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}