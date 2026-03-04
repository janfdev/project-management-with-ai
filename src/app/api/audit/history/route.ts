import { NextResponse } from "next/server";
import { db } from "@/db";
import { qualityVerificationLogs, tasks } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/audit/history
 *
 * Retrieves the verification history for the currently logged in PM.
 */
export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "pm") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const logs = await db.query.qualityVerificationLogs.findMany({
      where: eq(qualityVerificationLogs.reviewerId, session.user.id),
      with: {
        task: {
          with: {
            assignee: true,
            project: true,
          },
        },
      },
      orderBy: [desc(qualityVerificationLogs.createdAt)],
    });

    const mappedLogs = logs.map(log => ({
      id: log.id,
      taskId: log.taskId,
      taskTitle: log.task?.title || "Unknown Task",
      projectName: log.task?.project?.name || "Unknown Project",
      assigneeName: log.task?.assignee?.name || "Unassigned",
      decision: log.decision,
      aiScore: log.aiScore,
      pmScore: log.pmScore,
      reason: log.reason,
      createdAt: log.createdAt,
    }));

    return NextResponse.json(mappedLogs);
  } catch (error) {
    console.error("Failed to fetch audit history:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
