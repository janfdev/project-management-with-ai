
import { NextResponse } from "next/server";
import { db } from "@/db";
import { taskEvidences, tasks } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;
  const body = await req.json();

  if (!body.fileUrl) {
    return NextResponse.json({ error: "File URL is required" }, { status: 400 });
  }

  try {
    // 1. Save Evidence
    const [evidence] = await db.insert(taskEvidences).values({
      taskId: taskId,
      userId: session.user.id,
      fileUrl: body.fileUrl,
      publicId: body.publicId,
      fileType: body.fileType,
      description: body.description,
    }).returning();

    // 2. Update Task Status (optional logic)
    // If evidence is submitted, maybe move to 'review' or update actual hours
    await db.update(tasks).set({
        status: 'review', // Move to review automatically
    }).where(eq(tasks.id, taskId));

    return NextResponse.json(evidence);
  } catch (error) {
    return NextResponse.json({ error: "Failed to submit evidence" }, { status: 500 });
  }
}
