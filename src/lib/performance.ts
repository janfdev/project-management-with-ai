import { db } from "@/db";
import { tasks, performanceMetrics, qualityVerificationLogs, user } from "@/db/schema";
import { eq, and, sql, count } from "drizzle-orm";

/**
 * Calculate and upsert performance metrics for a specific user
 * for the current month/year.
 *
 * This should be called:
 * - When a task is completed (approved/adjusted by PM)
 * - On demand via API (for batch recalculation)
 */
export async function calculatePerformanceMetrics(userId: string) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();

  // 1. Get all completed tasks for this user (all time, for overall stats)
  const allUserTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.assigneeId, userId));

  const completedTasks = allUserTasks.filter((t) => t.status === "done");
  const totalTasks = allUserTasks.length;
  const tasksCompletedCount = completedTasks.length;

  // 2. Calculate On-Time Delivery Rate
  let onTimeCount = 0;
  let lateCount = 0;

  for (const task of completedTasks) {
    if (task.dueDate && task.completedDate) {
      if (new Date(task.completedDate) <= new Date(task.dueDate)) {
        onTimeCount++;
      } else {
        lateCount++;
      }
    } else if (task.completedDate) {
      // No due date = treat as on-time
      onTimeCount++;
    }
  }

  const onTimeRate =
    tasksCompletedCount > 0
      ? Math.round((onTimeCount / tasksCompletedCount) * 100)
      : 0;

  // 3. Calculate Quality/Reliability Score
  // Weighted: 40% quality score + 30% on-time rate + 30% completion rate
  const tasksWithQuality = completedTasks.filter(
    (t) => t.qualityScore !== null && t.qualityScore !== undefined
  );
  const avgQualityScore =
    tasksWithQuality.length > 0
      ? tasksWithQuality.reduce((sum, t) => sum + (t.pmAdjustedScore ?? t.qualityScore ?? 0), 0) /
        tasksWithQuality.length
      : 50; // Default average

  const completionRate =
    totalTasks > 0 ? Math.round((tasksCompletedCount / totalTasks) * 100) : 0;

  const reliabilityScore = Math.round(
    avgQualityScore * 0.4 + onTimeRate * 0.3 + completionRate * 0.3
  );

  // 4. Calculate Workload Score (current active tasks load indicator)
  const activeTasks = allUserTasks.filter(
    (t) => t.status === "todo" || t.status === "in_progress"
  );
  // 0-100: 0 = no load, 100 = very high load
  // Threshold: 5 tasks = 50, 10 tasks = 100
  const workloadScore = Math.min(100, Math.round((activeTasks.length / 10) * 100));

  // 5. Generate AI Insight text (simple rule-based for now)
  let aiInsight = "";
  if (reliabilityScore >= 80) {
    aiInsight = `High performer. Completed ${tasksCompletedCount} tasks with ${onTimeRate}% on-time delivery. Quality average: ${Math.round(avgQualityScore)}/100.`;
  } else if (reliabilityScore >= 60) {
    aiInsight = `Moderate performer. ${tasksCompletedCount} tasks completed, ${onTimeRate}% on-time. Quality: ${Math.round(avgQualityScore)}/100. Suggest reviewing late tasks for improvement.`;
  } else if (tasksCompletedCount === 0) {
    aiInsight = `No completed tasks yet. ${activeTasks.length} tasks currently in progress.`;
  } else {
    aiInsight = `Needs attention. ${tasksCompletedCount} tasks completed, only ${onTimeRate}% on-time. Quality: ${Math.round(avgQualityScore)}/100. Consider workload redistribution.`;
  }

  // 6. Upsert into performanceMetrics
  // Check if record exists for this user + month + year
  const existing = await db
    .select()
    .from(performanceMetrics)
    .where(
      and(
        eq(performanceMetrics.userId, userId),
        eq(performanceMetrics.periodMonth, currentMonth),
        eq(performanceMetrics.periodYear, currentYear)
      )
    );

  if (existing.length > 0) {
    // Update
    await db
      .update(performanceMetrics)
      .set({
        tasksCompleted: tasksCompletedCount,
        onTimeRate,
        reliabilityScore,
        workloadScore,
        aiInsight,
        calculatedAt: now,
      })
      .where(eq(performanceMetrics.id, existing[0].id));
  } else {
    // Insert
    await db.insert(performanceMetrics).values({
      userId,
      periodMonth: currentMonth,
      periodYear: currentYear,
      tasksCompleted: tasksCompletedCount,
      onTimeRate,
      reliabilityScore,
      workloadScore,
      aiInsight,
      calculatedAt: now,
    });
  }

  return {
    userId,
    tasksCompleted: tasksCompletedCount,
    onTimeRate,
    reliabilityScore,
    workloadScore,
    avgQualityScore: Math.round(avgQualityScore),
    completionRate,
    aiInsight,
  };
}

/**
 * Calculate performance metrics for ALL employees
 */
export async function calculateAllPerformanceMetrics() {
  const employees = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.role, "employee"));

  const results = [];
  for (const emp of employees) {
    const result = await calculatePerformanceMetrics(emp.id);
    results.push(result);
  }

  return results;
}

/**
 * Get PM verification stats for a specific employee
 */
export async function getVerificationStats(userId: string) {
  // Get all verification logs for tasks assigned to this user
  const userTasks = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.assigneeId, userId));

  const taskIds = userTasks.map((t) => t.id);

  if (taskIds.length === 0) {
    return {
      total: 0,
      approved: 0,
      adjusted: 0,
      rejected: 0,
      approvalRate: 0,
    };
  }

  const logs = await db
    .select()
    .from(qualityVerificationLogs)
    .where(sql`${qualityVerificationLogs.taskId} = ANY(${taskIds})`);

  const approved = logs.filter((l) => l.decision === "approved").length;
  const adjusted = logs.filter((l) => l.decision === "adjusted").length;
  const rejected = logs.filter((l) => l.decision === "rejected").length;
  const total = logs.length;

  return {
    total,
    approved,
    adjusted,
    rejected,
    approvalRate: total > 0 ? Math.round(((approved + adjusted) / total) * 100) : 0,
  };
}
