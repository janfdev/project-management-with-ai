import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, tasks, performanceMetrics, qualityVerificationLogs } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, desc } from "drizzle-orm";
import { calculateAllPerformanceMetrics, getVerificationStats } from "@/lib/performance";

/**
 * GET /api/dashboard/hr/performance
 *
 * Returns performance data for all employees.
 * HR only endpoint.
 */
export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // 1. Get all employees
    const employees = await db
      .select()
      .from(user)
      .where(eq(user.role, "employee"));

    // 2. Get all tasks for metrics computation
    const allTasks = await db.select().from(tasks);

    // 3. Get latest performanceMetrics for each employee
    const allMetrics = await db
      .select()
      .from(performanceMetrics)
      .orderBy(desc(performanceMetrics.calculatedAt));

    // 4. Get all verification logs
    const allVerificationLogs = await db.select().from(qualityVerificationLogs);

    // 5. Build per-employee response
    const employeePerformance = employees.map((emp) => {
      const empTasks = allTasks.filter((t) => t.assigneeId === emp.id);
      const completedTasks = empTasks.filter((t) => t.status === "done");
      const totalTasks = empTasks.length;
      const activeTasks = empTasks.filter(
        (t) => t.status === "todo" || t.status === "in_progress"
      );
      const reviewTasks = empTasks.filter((t) => t.status === "review");

      // On-time delivery
      let onTimeCount = 0;
      for (const t of completedTasks) {
        if (t.dueDate && t.completedDate) {
          if (new Date(t.completedDate) <= new Date(t.dueDate)) {
            onTimeCount++;
          }
        } else if (t.completedDate) {
          onTimeCount++;
        }
      }
      const onTimeRate =
        completedTasks.length > 0
          ? Math.round((onTimeCount / completedTasks.length) * 100)
          : 0;

      // Quality score average (use PM adjusted if available)
      const tasksWithQuality = completedTasks.filter(
        (t) => t.qualityScore !== null
      );
      const avgQuality =
        tasksWithQuality.length > 0
          ? Math.round(
              tasksWithQuality.reduce(
                (sum, t) => sum + (t.pmAdjustedScore ?? t.qualityScore ?? 0),
                0
              ) / tasksWithQuality.length
            )
          : 0;

      // Completion rate
      const completionRate =
        totalTasks > 0
          ? Math.round((completedTasks.length / totalTasks) * 100)
          : 0;

      // Verification stats from logs
      const empTaskIds = empTasks.map((t) => t.id);
      const empLogs = allVerificationLogs.filter(
        (l) => l.taskId && empTaskIds.includes(l.taskId)
      );
      const approved = empLogs.filter((l) => l.decision === "approved").length;
      const adjusted = empLogs.filter((l) => l.decision === "adjusted").length;
      const rejected = empLogs.filter((l) => l.decision === "rejected").length;

      // Latest metrics
      const latestMetric = allMetrics.find((m) => m.userId === emp.id);

      return {
        id: emp.id,
        name: emp.name,
        email: emp.email,
        image: emp.image,
        department: emp.department || "General",
        status: emp.status,
        stats: {
          totalTasks,
          completedTasks: completedTasks.length,
          activeTasks: activeTasks.length,
          reviewTasks: reviewTasks.length,
          completionRate,
          onTimeRate,
          avgQualityScore: avgQuality,
          reliabilityScore: latestMetric?.reliabilityScore ?? 0,
          workloadScore: latestMetric?.workloadScore ?? 0,
          aiInsight: latestMetric?.aiInsight ?? null,
        },
        verification: {
          total: empLogs.length,
          approved,
          adjusted,
          rejected,
          approvalRate:
            empLogs.length > 0
              ? Math.round(((approved + adjusted) / empLogs.length) * 100)
              : 0,
        },
      };
    });

    // Sort by reliability score descending
    employeePerformance.sort(
      (a, b) => b.stats.reliabilityScore - a.stats.reliabilityScore
    );

    // Overall org stats
    const totalEmployees = employees.length;
    const avgCompletionRate =
      employeePerformance.length > 0
        ? Math.round(
            employeePerformance.reduce(
              (sum, e) => sum + e.stats.completionRate,
              0
            ) / employeePerformance.length
          )
        : 0;
    const avgOnTimeRate =
      employeePerformance.length > 0
        ? Math.round(
            employeePerformance.reduce(
              (sum, e) => sum + e.stats.onTimeRate,
              0
            ) / employeePerformance.length
          )
        : 0;
    const avgQualityScore =
      employeePerformance.length > 0
        ? Math.round(
            employeePerformance.reduce(
              (sum, e) => sum + e.stats.avgQualityScore,
              0
            ) / employeePerformance.length
          )
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalEmployees,
          avgCompletionRate,
          avgOnTimeRate,
          avgQualityScore,
        },
        employees: employeePerformance,
      },
    });
  } catch (error) {
    console.error("HR Performance API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch performance data" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/hr/performance
 *
 * Triggers batch recalculation of performance metrics for all employees.
 */
export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || session.user.role !== "hr") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const results = await calculateAllPerformanceMetrics();
    return NextResponse.json({
      success: true,
      message: `Performance metrics recalculated for ${results.length} employees.`,
      data: results,
    });
  } catch (error) {
    console.error("Batch performance recalculation error:", error);
    return NextResponse.json(
      { error: "Failed to recalculate metrics" },
      { status: 500 }
    );
  }
}
