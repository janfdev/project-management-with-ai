
import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { analyzeBatchTasksRisk } from "@/lib/ai/gemini";
import { eq, not } from "drizzle-orm";

export async function POST(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || (session.user.role !== 'pm' && session.user.role !== 'hr')) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 1. Get Unfinished Tasks
    const activeTasks = await db.select({
        id: tasks.id,
        title: tasks.title,
        dueDate: tasks.dueDate,
        status: tasks.status
    }).from(tasks).where(not(eq(tasks.status, "done")));

    if (activeTasks.length === 0) {
        return NextResponse.json({ message: "No active tasks to scan." });
    }

    // 2. Format Data for AI (Convert dates to string)
    const formattedTasks = activeTasks.map(t => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : "No Deadline",
        status: t.status || "todo"
    }));

    // 3. Analyze Risks
    const riskResults = await analyzeBatchTasksRisk(formattedTasks);

    // 4. Update Database
    let updatedCount = 0;
    for (const risk of riskResults) {
        await db.update(tasks).set({
            riskLevel: risk.riskLevel as "high" | "critical" | "medium" | "low", // Type casting simple
            aiRiskAnalysis: risk.reason
        }).where(eq(tasks.id, risk.taskId));
        updatedCount++;
    }

    return NextResponse.json({
        success: true,
        scanned: activeTasks.length,
        risksFound: updatedCount,
        details: riskResults
    });
}
