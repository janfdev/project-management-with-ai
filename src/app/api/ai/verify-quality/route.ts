import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, qualityVerificationLogs } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { calculatePerformanceMetrics } from "@/lib/performance";

/**
 * POST /api/ai/verify-quality
 *
 * PM Verification endpoint for AI quality scores.
 * Allows PM to: approve, adjust (with reason), or reject.
 * All decisions are logged in the audit trail.
 */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  // Only PM can verify quality scores
  if (!session || session.user.role !== "pm") {
    return NextResponse.json({ error: "Unauthorized. Only Project Managers can verify quality scores." }, { status: 403 });
  }

  const body = await req.json();
  const { taskId, decision, adjustedScore, reason } = body as {
    taskId: string;
    decision: "approved" | "adjusted" | "rejected";
    adjustedScore?: number;
    reason?: string;
  };

  // Validation
  if (!taskId || !decision) {
    return NextResponse.json(
      { error: "taskId and decision are required." },
      { status: 400 }
    );
  }

  if (!["approved", "adjusted", "rejected"].includes(decision)) {
    return NextResponse.json(
      { error: "Invalid decision. Use: approved, adjusted, or rejected." },
      { status: 400 }
    );
  }

  if (decision === "adjusted") {
    if (adjustedScore === undefined || adjustedScore < 0 || adjustedScore > 100) {
      return NextResponse.json(
        { error: "Adjusted score must be between 0 and 100." },
        { status: 400 }
      );
    }
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "A written reason is required when adjusting the score." },
        { status: 400 }
      );
    }
  }

  if (decision === "rejected") {
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "A written reason is required when rejecting." },
        { status: 400 }
      );
    }
  }

  try {
    // 1. Fetch the task
    const taskResult = await db.select().from(tasks).where(eq(tasks.id, taskId));
    const task = taskResult[0];

    if (!task) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const now = new Date();

    // 2. Determine task update data based on decision
    const updateData: Record<string, unknown> = {
      reviewDecision: decision,
      pmNotes: reason || null,
      reviewedBy: session.user.id,
      reviewedAt: now,
      updatedAt: now,
    };

    if (decision === "approved") {
      // Score remains as AI score, mark task as done
      updateData.status = "done";
      updateData.completedDate = now;
    } else if (decision === "adjusted") {
      // PM adjusts the score, mark task as done with adjusted score
      updateData.pmAdjustedScore = adjustedScore!;
      updateData.status = "done";
      updateData.completedDate = now;
    } else if (decision === "rejected") {
      // Reject: send back to in_progress for revision
      updateData.status = "in_progress";
      // Reset quality scores so employee knows they need to redo
      updateData.pmAdjustedScore = null;
    }

    // 3. Update the task
    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId))
      .returning();

    // 4. Write to audit log
    await db.insert(qualityVerificationLogs).values({
      taskId,
      reviewerId: session.user.id,
      decision,
      aiScore: task.qualityScore,
      pmScore: decision === "adjusted" ? adjustedScore! : task.qualityScore,
      reason: reason || null,
      aiConfidence: task.aiConfidenceLevel,
      metadata: {
        taskTitle: task.title,
        previousStatus: task.status,
        newStatus: updatedTask.status,
        reviewerName: session.user.name,
        timestamp: now.toISOString(),
      },
    });

    // 5. Recalculate performance metrics for the employee if task completed
    if ((decision === "approved" || decision === "adjusted") && task.assigneeId) {
      // Fire and forget — don't block the response
      calculatePerformanceMetrics(task.assigneeId).catch((err) =>
        console.error("Performance metrics calculation failed:", err)
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        taskId,
        decision,
        aiScore: task.qualityScore,
        finalScore: decision === "adjusted" ? adjustedScore : task.qualityScore,
        newStatus: updatedTask.status,
        reviewedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error("Quality verification error:", error);
    return NextResponse.json(
      { error: "Failed to process verification." },
      { status: 500 }
    );
  }
}
