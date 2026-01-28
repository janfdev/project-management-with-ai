
import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, subtasks } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { breakdownTaskDescription } from "@/lib/ai/gemini";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const projectId = url.searchParams.get("projectId");

    let query = db.select().from(tasks);
    
    if (projectId) {
        // @ts-ignore - simple where, ignore type complexity for now
        query = db.select().from(tasks).where(eq(tasks.projectId, projectId));
    } else if (session.user.role === 'employee') {
        // Employee only sees their tasks if no project specified
        // @ts-ignore
        query = db.select().from(tasks).where(eq(tasks.assigneeId, session.user.id));
    }

    const data = await query;
    return NextResponse.json(data);
}

export async function POST(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    if (!body.title || !body.projectId) {
        return NextResponse.json({ error: "Title and Project ID are required" }, { status: 400 });
    }

    try {
        // 1. Initial Task Creation
        const [newTask] = await db.insert(tasks).values({
            title: body.title,
            description: body.description,
            projectId: body.projectId,
            assigneeId: body.assigneeId,
            creatorId: session.user.id,
            dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
            priority: body.priority || "medium",
            status: "todo",
        }).returning();

        // 2. Trigger AI Breakdown (Asynchronous/Background compatible)
        // In real world, use a queue like Redis/BullMQ. Here we await it for simplicity or fire-and-forget logic carefully.
        // We will await it to give immediate feedback for MVP.
        
        let aiResult = null;
        if (body.description) {
            aiResult = await breakdownTaskDescription(body.description, body.title);
            
            // Update Task with AI insights
            await db.update(tasks).set({
                aiBreakdown: aiResult,
                estimatedHours: aiResult.estimatedTotalHours,
                aiRiskAnalysis: aiResult.riskAnalysis
            }).where(eq(tasks.id, newTask.id));

            // Create Subtasks
            if (aiResult.subtasks && aiResult.subtasks.length > 0) {
                 await db.insert(subtasks).values(
                    aiResult.subtasks.map((st: any) => ({
                        taskId: newTask.id,
                        title: st.title
                    }))
                );
            }
        }

        return NextResponse.json({ ...newTask, aiBreakdown: aiResult });

    } catch (error) {
        console.error("Create task error", error);
        return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
    }
}
