import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, taskEvidences } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { analyzeTaskQuality } from "@/lib/ai/gemini";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || (session.user.role !== "pm" && session.user.role !== "hr")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { taskId } = await req.json();

  // 1. Get Task Data
  const taskResult = await db.select().from(tasks).where(eq(tasks.id, taskId));
  const task = taskResult[0];

  if (!task)
    return NextResponse.json({ error: "Task not found" }, { status: 404 });

  // 2. Get Evidence
  const evidences = await db
    .select()
    .from(taskEvidences)
    .where(eq(taskEvidences.taskId, taskId));

  if (evidences.length === 0) {
    return NextResponse.json(
      { error: "No evidence found. Cannot analyze quality." },
      { status: 400 },
    );
  }

  // 3. Prepare Data for AI
  const evidenceSummary = evidences
    .map((e) => `[${e.fileType}] ${e.description}`)
    .join("; ");

  const now = new Date();
  const dueDate = task.dueDate ? new Date(task.dueDate) : new Date();
  const completionDate = task.completedDate
    ? new Date(task.completedDate)
    : now;

  const isLate = completionDate > dueDate;
  const daysLate = isLate
    ? Math.ceil(
        (completionDate.getTime() - dueDate.getTime()) / (1000 * 3600 * 24),
      )
    : 0;

  // 4. Call AI (now returns enriched data)
  const result = await analyzeTaskQuality(
    task.title,
    task.description || "No description",
    evidenceSummary,
    isLate,
    daysLate,
  );

  // 5. Save to DB (including new enriched fields, reset review status)
  await db
    .update(tasks)
    .set({
      qualityScore: result.score,
      qualityAnalysis: result.analysis,
      aiConfidenceLevel: result.confidenceLevel,
      aiStrengths: result.strengths,
      aiWeaknesses: result.weaknesses,
      // Reset PM verification when AI re-analyzes
      reviewDecision: "pending",
      pmAdjustedScore: null,
      pmNotes: null,
      reviewedBy: null,
      reviewedAt: null,
    })
    .where(eq(tasks.id, taskId));

  return NextResponse.json({
    success: true,
    data: result,
  });
}
