import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reviewTasks = await db.query.tasks.findMany({
      where: eq(tasks.status, "review"),
      with: {
        assignee: true,
      },
      orderBy: [desc(tasks.updatedAt)],
    });

    // Map to frontend expected format
    const formattedTasks = reviewTasks.map((t) => ({
      id: t.id,
      title: t.title,
      assignee: {
        name: t.assignee?.name || "Unknown",
        image: t.assignee?.image || "",
        role: t.assignee?.role || "employee",
      },
      submittedAt: t.updatedAt?.toISOString() || new Date().toISOString(),
      aiScore: t.qualityScore || 0,
      status: t.status,
      riskLevel: t.riskLevel || "Low",
      aiAnalysis: t.qualityAnalysis || "No analysis generated yet.",
      aiConfidenceLevel: t.aiConfidenceLevel || 0,
      reviewDecision: t.reviewDecision || "pending",
      pmAdjustedScore: t.pmAdjustedScore,
    }));

    return NextResponse.json(formattedTasks);
  } catch (error) {
    console.error("Fetch Audit tasks failed", error);
    return NextResponse.json(
      { error: "Failed to fetch audit queue" },
      { status: 500 },
    );
  }
}
