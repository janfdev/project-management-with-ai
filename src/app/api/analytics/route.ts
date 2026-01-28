
import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, user, performanceMetrics } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, count, and } from "drizzle-orm";

export async function GET(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Basic Stats
    const totalTasks = await db.select({ count: count() }).from(tasks);
    const completedTasks = await db.select({ count: count() }).from(tasks).where(eq(tasks.status, "done"));
    
    // 2. Workload per Employee (Active Tasks)
    const allUsers = await db.select({
        id: user.id,
        name: user.name,
        role: user.role
    }).from(user);

    const workloadData = [];

    for (const u of allUsers) {
        if(u.role === 'employee') {
             // Hitung task aktif (todo/in_progress)
             const activeTasks = await db.select({ count: count() })
                .from(tasks)
                .where(and(eq(tasks.assigneeId, u.id), eq(tasks.status, "in_progress")));
             
             workloadData.push({
                userId: u.id,
                name: u.name,
                activeTaskCount: activeTasks[0].count,
                status: activeTasks[0].count > 5 ? "Overloaded" : "Optimal"
             });
        }
    }

    return NextResponse.json({
        overview: {
            totalTasks: totalTasks[0].count,
            completedTasks: completedTasks[0].count,
            completionRate: totalTasks[0].count > 0 ? (completedTasks[0].count / totalTasks[0].count * 100).toFixed(1) : 0
        },
        workload: workloadData,
        message: "Data real-time dari log eksekusi"
    });
}
