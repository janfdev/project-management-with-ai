"use client";

import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, ArrowLeft, Clock, Plus, Pencil } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Task = {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  startDate: string;
  dueDate: string;
  estimatedHours: number;
  assigneeId: string | null;
  assigneeName?: string; // Optional helper from backend if available
};

type ProjectDetails = {
  id: string;
  title: string;
  description: string;
  status: string;
  startDate: Date;
  dueDate: Date;
  tasks: Task[];
};

type User = {
  id: string;
  name: string;
  image: string;
  role: string;
};

export default function ProjectDetailsPage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [employees, setEmployees] = useState<User[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Project Details
        const projectRes = await fetch(`/api/projects/${params.id}`);
        // 2. Fetch Employees (for assignment dropdown)
        const usersRes = await fetch("/api/users");

        if (projectRes.ok && usersRes.ok) {
          const projectData = await projectRes.json();
          const usersData: User[] = await usersRes.json();

          setProject(projectData);
          setEmployees(usersData.filter((u) => u.role === "employee"));
        } else {
          console.error("Failed to fetch data");
        }
      } catch (error) {
        console.error("Failed to load project", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      setProject((prev) => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Project status changed to ${newStatus.replace("_", " ")}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleAssignTask = async (taskId: string, userId: string) => {
    try {
      // Optimistic Update
      const user = employees.find((e) => e.id === userId);
      setProject((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === taskId
              ? { ...t, assigneeId: userId, assigneeName: user?.name }
              : t,
          ),
        };
      });

      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeId: userId }),
      });

      if (!res.ok) throw new Error("Failed to assign task");
      toast.success("Task assigned successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to assign task");
      // Revert optimistic update if needed (simplified here)
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading project details...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8 text-center text-red-500">Project not found</div>
    );
  }

  const taskList = project.tasks || [];

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/pm/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              {project.title}
            </h2>
            <p className="text-muted-foreground">Project Details & Tasks</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={project.status || "active"} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
            </SelectContent>
          </Select>
          <Link href={`/dashboard/pm/projects/${params.id}/edit`}>
            <Button variant="outline" size="sm" className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Project Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Basic information about the project.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            <div className="grid gap-2">
              <Label>Project Name</Label>
              <div className="p-2 border rounded-md bg-muted/20">
                {project.title}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <div className="p-2 border rounded-md bg-muted/20 min-h-[80px]">
                {project.description || "No description provided."}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <div className="flex items-center p-2 border rounded-md bg-muted/20 text-sm">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {project.startDate
                    ? format(new Date(project.startDate), "PPP")
                    : "Not set"}
                </div>
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <div className="flex items-center p-2 border rounded-md bg-muted/20 text-sm">
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {project.dueDate
                    ? format(new Date(project.dueDate), "PPP")
                    : "Not set"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tasks</CardTitle>
              <CardDescription>Tasks defined for this project.</CardDescription>
            </div>
            <Link href={`/dashboard/pm/projects/${params.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Task
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {taskList.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  No tasks assigned to this project yet.
                </div>
              )}
              {taskList.map((task: Task) => (
                <div
                  key={task.id}
                  className="grid grid-cols-12 gap-4 p-4 border rounded-lg bg-card/50 relative group items-center"
                >
                  <div className="col-span-12 md:col-span-4 grid gap-2">
                    <Label className="text-xs text-muted-foreground">
                      Task Title
                    </Label>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">
                      {task.description || "-"}
                    </div>
                  </div>

                  <div className="col-span-6 md:col-span-2 grid gap-2">
                    <Label className="text-xs text-muted-foreground">
                      Priority
                    </Label>
                    <div>
                      <Badge
                        variant={
                          task.priority === "critical"
                            ? "destructive"
                            : "secondary"
                        }
                        className="uppercase text-[10px]"
                      >
                        {task.priority || "Normal"}
                      </Badge>
                    </div>
                  </div>
                  <div className="col-span-6 md:col-span-2 grid gap-2">
                    <Label className="text-xs text-muted-foreground">
                      Est. Hours
                    </Label>
                    <div className="flex items-center text-sm">
                      <Clock className="mr-1 h-3 w-3" />
                      {task.estimatedHours || 0}h
                    </div>
                  </div>

                  <div className="col-span-12 md:col-span-4 grid gap-2">
                    <Label className="text-xs text-muted-foreground">
                      Assignee
                    </Label>
                    <Select
                      value={task.assigneeId || "unassigned"}
                      onValueChange={(val) => handleAssignTask(task.id, val)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Unassigned" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.id}>
                            {emp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
