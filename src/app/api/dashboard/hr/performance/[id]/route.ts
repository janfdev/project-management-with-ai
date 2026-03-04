import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, tasks, qualityVerificationLogs, performanceMetrics } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, desc, and } from "drizzle-orm";

/**
 * GET /api/dashboard/hr/performance/[id]
 *
 * Returns detailed performance data for a specific employee.
 * HR only endpoint.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id: employeeId } = await params;

  try {
    // 1. Get employee info
    const employee = await db.query.user.findFirst({
      where: eq(user.id, employeeId),
    });

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    // 2. Get all tasks
    const allTasks = await db.query.tasks.findMany({
      where: eq(tasks.assigneeId, employeeId),
      with: {
        project: true,
      },
      orderBy: [desc(tasks.updatedAt)],
    });

    const completedTasks = allTasks.filter((t) => t.status === "done");
    const activeTasks = allTasks.filter(
      (t) => t.status === "todo" || t.status === "in_progress"
    );
    const reviewTasks = allTasks.filter((t) => t.status === "review");

    // 3. On-time delivery breakdown
    let onTimeCount = 0;
    let lateCount = 0;
    let noDeadlineCount = 0;

    for (const t of completedTasks) {
      if (t.dueDate && t.completedDate) {
        if (new Date(t.completedDate) <= new Date(t.dueDate)) {
          onTimeCount++;
        } else {
          lateCount++;
        }
      } else {
        noDeadlineCount++;
      }
    }

    const onTimeRate =
      completedTasks.length > 0
        ? Math.round((onTimeCount / completedTasks.length) * 100)
        : 0;

    // 4. Quality Score breakdown
    const tasksWithQuality = completedTasks.filter(
      (t) => t.qualityScore !== null
    );
    const avgQualityAI =
      tasksWithQuality.length > 0
        ? Math.round(
            tasksWithQuality.reduce(
              (sum, t) => sum + (t.qualityScore ?? 0),
              0
            ) / tasksWithQuality.length
          )
        : 0;
    const avgQualityFinal =
      tasksWithQuality.length > 0
        ? Math.round(
            tasksWithQuality.reduce(
              (sum, t) => sum + (t.pmAdjustedScore ?? t.qualityScore ?? 0),
              0
            ) / tasksWithQuality.length
          )
        : 0;

    // 5. PM Verification stats
    const taskIds = allTasks.map((t) => t.id);
    let verificationLogs: typeof qualityVerificationLogs.$inferSelect[] = [];

    if (taskIds.length > 0) {
      verificationLogs = await db
        .select()
        .from(qualityVerificationLogs)
        .where(
          eq(qualityVerificationLogs.taskId, taskIds[0]) // We'll get all then filter
        );

      // Actually fetch all logs and filter by taskIds client side for simplicity
      const allLogs = await db.select().from(qualityVerificationLogs);
      verificationLogs = allLogs.filter(
        (l) => l.taskId && taskIds.includes(l.taskId)
      );
    }

    const approved = verificationLogs.filter(
      (l) => l.decision === "approved"
    ).length;
    const adjusted = verificationLogs.filter(
      (l) => l.decision === "adjusted"
    ).length;
    const rejected = verificationLogs.filter(
      (l) => l.decision === "rejected"
    ).length;

    // 6. Performance metrics history (monthly)
    const metricsHistory = await db
      .select()
      .from(performanceMetrics)
      .where(eq(performanceMetrics.userId, employeeId))
      .orderBy(
        desc(performanceMetrics.periodYear),
        desc(performanceMetrics.periodMonth)
      );

    // 7. Recent tasks (last 10)
    const recentTasks = allTasks.slice(0, 10).map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      projectName: t.project?.name || "Unassigned",
      dueDate: t.dueDate?.toISOString() || null,
      completedDate: t.completedDate?.toISOString() || null,
      qualityScore: t.qualityScore,
      pmAdjustedScore: t.pmAdjustedScore,
      reviewDecision: t.reviewDecision,
      isLate:
        t.dueDate && t.completedDate
          ? new Date(t.completedDate) > new Date(t.dueDate)
          : false,
    }));

    // 8. Overall stats
    const completionRate =
      allTasks.length > 0
        ? Math.round((completedTasks.length / allTasks.length) * 100)
        : 0;

    // Reliability score
    const reliabilityScore = Math.round(
      avgQualityFinal * 0.4 + onTimeRate * 0.3 + completionRate * 0.3
    );

    return NextResponse.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          image: employee.image,
          department: employee.department || "General",
          role: employee.role,
          status: employee.status,
          createdAt: employee.createdAt,
        },
        stats: {
          totalTasks: allTasks.length,
          completedTasks: completedTasks.length,
          activeTasks: activeTasks.length,
          reviewTasks: reviewTasks.length,
          completionRate,
          reliabilityScore,
        },
        onTimeDelivery: {
          rate: onTimeRate,
          onTime: onTimeCount,
          late: lateCount,
          noDeadline: noDeadlineCount,
          total: completedTasks.length,
        },
        quality: {
          avgAiScore: avgQualityAI,
          avgFinalScore: avgQualityFinal,
          totalAssessed: tasksWithQuality.length,
        },
        verification: {
          total: verificationLogs.length,
          approved,
          adjusted,
          rejected,
          approvalRate:
            verificationLogs.length > 0
              ? Math.round(
                  ((approved + adjusted) / verificationLogs.length) * 100
                )
              : 0,
        },
        recentTasks,
        metricsHistory: metricsHistory.map((m) => ({
          month: m.periodMonth,
          year: m.periodYear,
          tasksCompleted: m.tasksCompleted,
          onTimeRate: m.onTimeRate,
          reliabilityScore: m.reliabilityScore,
          workloadScore: m.workloadScore,
          aiInsight: m.aiInsight,
          calculatedAt: m.calculatedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Employee detail performance error:", error);
    return NextResponse.json(
      { error: "Failed to fetch employee performance" },
      { status: 500 }
    );
  }
}
