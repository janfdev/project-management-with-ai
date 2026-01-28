
import { NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allProjects = await db.select().from(projects);
    return NextResponse.json(allProjects);
}

export async function POST(req: Request) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session || session.user.role === 'employee') {
        // Only PM and HR can create projects
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    
    // Basic validation
    if (!body.name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    try {
        const [newProject] = await db.insert(projects).values({
            name: body.name,
            description: body.description,
            managerId: session.user.id,
            startDate: body.startDate ? new Date(body.startDate) : undefined,
            endDate: body.endDate ? new Date(body.endDate) : undefined,
        }).returning();

        return NextResponse.json(newProject);
    } catch (error) {
         return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
    }
}
