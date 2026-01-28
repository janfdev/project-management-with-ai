
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || session.user.role !== 'hr') return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { id: userId } = await params;
  const body = await req.json();

  // Validasi: status harus valid, role harus valid
  if (!body.status && !body.role) {
      return NextResponse.json({ error: "No changes provided" }, { status: 400 });
  }

  try {
    const [updatedUser] = await db.update(user).set({
        status: body.status, // active, rejected
        role: body.role, // employee, pm, hr
        department: body.department
    }).where(eq(user.id, userId)).returning();

    return NextResponse.json(updatedUser);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
