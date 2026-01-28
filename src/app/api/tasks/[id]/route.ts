
import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;
  const body = await req.json();

  // Basic permission check: Owner or PM can update
  // For MVP, we allow assignee to update status, but only PM to update deadline/title
  
  const updateData: any = {};
  
  if (body.status) {
      updateData.status = body.status;
      if (body.status === 'done') {
          updateData.completedDate = new Date();
      }
  }
  
  if (body.riskLevel) updateData.riskLevel = body.riskLevel;
  if (body.actualHours) updateData.actualHours = body.actualHours;
  
  // Hanya PM yang boleh ganti Title/DueDate
  if (session.user.role === 'pm' || session.user.role === 'hr') {
      if (body.title) updateData.title = body.title;
      if (body.dueDate) updateData.dueDate = new Date(body.dueDate);
      if (body.assigneeId) updateData.assigneeId = body.assigneeId;
  }

  try {
    const [updatedTask] = await db.update(tasks)
        .set(updateData)
        .where(eq(tasks.id, taskId))
        .returning();

    return NextResponse.json(updatedTask);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
