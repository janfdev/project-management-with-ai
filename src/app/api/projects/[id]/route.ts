import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects, tasks, projectMembers } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, and, inArray } from "drizzle-orm";
import { breakdownTaskDescription } from "@/lib/ai/gemini";
import { subtasks } from "@/db/schema";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, id),
      with: {
        members: {
          with: {
            user: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Fetch Tasks for this Project
    const projectTasks = await db.query.tasks.findMany({
      where: eq(tasks.projectId, id),
      with: {
        assignee: true,
      },
    });

    // Construct response object matching frontend expectation
    const responseData = {
      id: project.id,
      title: project.name,
      description: project.description,
      status: project.status, // "active" vs "Active" casing might need handling
      startDate: project.startDate,
      dueDate: project.endDate,
      progress:
        projectTasks.length > 0
          ? Math.round(
              (projectTasks.filter((t) => t.status === "done").length /
                projectTasks.length) *
                100,
            )
          : 0,
      team: project.members.map((m: any) => ({
        id: m.user.id,
        name: m.user.name,
        role: m.user.role,
        image: m.user.image,
      })),
      tasks: projectTasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        assigneeId: t.assigneeId,
        assigneeName: t.assignee?.name || undefined,
        status: t.status, // "todo"
        priority: t.priority,
        dueDate: t.dueDate,
        estimatedHours: t.estimatedHours,
      })),
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Fetch Project Detail Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();

    const [updatedProject] = await db
      .update(projects)
      .set({
        name: body.name,
        description: body.description,
        status: body.status,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();

    if (!updatedProject) {
      return NextResponse.json(
        { error: "Project not found or update failed" },
        { status: 404 },
      );
    }

    // 2. Handle Task Updates if provided
    if (body.tasks && Array.isArray(body.tasks)) {
      // Fetch existing tasks to determine deletions
      const currentTasks = await db.query.tasks.findMany({
        where: eq(tasks.projectId, id),
        columns: { id: true },
      });
      const currentTaskIds = currentTasks.map((t) => t.id);

      const incomingTaskIds = body.tasks
        .filter((t: any) => typeof t.id === "string" && t.id.length > 10) // Basic uuid check
        .map((t: any) => t.id);

      // A. Delete tasks missing from the incoming list
      const tasksToDelete = currentTaskIds.filter(
        (tid) => !incomingTaskIds.includes(tid),
      );
      if (tasksToDelete.length > 0) {
        // Import inArray at top level if needed, or use dynamic import if not available
        // Using a loop for delete if inArray not imported, but better to import it later.
        // For now, let's just use loop for safety or add import.
        // Assuming we will add `inArray` to imports.
        await Promise.all(
          tasksToDelete.map((tid) => db.delete(tasks).where(eq(tasks.id, tid))),
        );
      }

      // B. Update existing & Insert new
      for (const taskData of body.tasks) {
        const isNew =
          typeof taskData.id === "number" ||
          (typeof taskData.id === "string" && taskData.id.length < 10);

        if (isNew) {
          let aiResult = null;
          if (taskData.description) {
            try {
              aiResult = await breakdownTaskDescription(
                taskData.description,
                taskData.title,
              );
            } catch (e) {
              console.error("AI Breakdown Failed inside Project Update", e);
            }
          }

          const [newTask] = await db
            .insert(tasks)
            .values({
              projectId: id,
              title: taskData.title,
              description: taskData.description,
              priority: taskData.priority || "medium",
              estimatedHours:
                aiResult?.estimatedTotalHours || taskData.estimatedHours || 0,
              status: "todo",
              creatorId: session.user.id,
              assigneeId: taskData.assigneeId || null,
              aiBreakdown: aiResult,
              aiRiskAnalysis: aiResult?.riskAnalysis,
            })
            .returning();

          if (aiResult?.subtasks && aiResult.subtasks.length > 0) {
            await db.insert(subtasks).values(
              aiResult.subtasks.map((st: any) => ({
                taskId: newTask.id,
                title: st.title,
              })),
            );
          }
        } else {
          await db
            .update(tasks)
            .set({
              title: taskData.title,
              description: taskData.description,
              priority: taskData.priority,
              estimatedHours: taskData.estimatedHours,
              assigneeId: taskData.assigneeId,
              updatedAt: new Date(),
            })
            .where(eq(tasks.id, taskData.id));
        }
      }
    }

    // 3. Handle Member Updates
    if (body.memberIds && Array.isArray(body.memberIds)) {
      // We need 'and' from drizzle-orm. I will assume it is imported or add it.
      // Since I can't easily add import in this block without breaking top of file,
      // I will do it carefully.

      // Strategy: Get current IDs.
      const currentMembers = await db
        .select()
        .from(projectMembers)
        .where(eq(projectMembers.projectId, id));

      const currentIds = currentMembers.map((m) => m.userId);
      const newIds = body.memberIds;

      // Delete removed
      const toRemove = currentIds.filter((cid) => !newIds.includes(cid));
      // Insert added
      const toAdd = newIds.filter((nid: string) => !currentIds.includes(nid));

      if (toRemove.length > 0) {
        await db
          .delete(projectMembers)
          .where(
            and(
              eq(projectMembers.projectId, id),
              inArray(projectMembers.userId, toRemove),
            ),
          );
      }

      if (toAdd.length > 0) {
        await db.insert(projectMembers).values(
          toAdd.map((uid: string) => ({
            projectId: id,
            userId: uid,
          })),
        );
      }
    }

    return NextResponse.json(updatedProject);
  } catch (error) {
    console.error("Update Project Error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // 1. Delete associated tasks first
    await db.delete(tasks).where(eq(tasks.projectId, id));

    // 2. Delete the project
    const [deletedProject] = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning();

    if (!deletedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete Project Error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}
