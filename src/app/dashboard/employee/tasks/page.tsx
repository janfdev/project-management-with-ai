"use client";

import { useState } from "react";
import { EmployeeKanban } from "@/components/dashboard/employee-kanban";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutList, KanbanSquare } from "lucide-react";
import { DataTable } from "@/components/dashboard/data-table";

// Reuse data from parent or fetch it
import data from "../data.json";

export default function TasksPage() {
  const [view, setView] = useState<"list" | "board">("board");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Tasks</h2>
          <p className="text-muted-foreground">
            Manage your daily tasks and track progress.
          </p>
        </div>
        <Tabs
          value={view}
          onValueChange={(v) => setView(v as "list" | "board")}
        >
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <LayoutList className="w-4 h-4" />
              List
            </TabsTrigger>
            <TabsTrigger value="board" className="flex items-center gap-2">
              <KanbanSquare className="w-4 h-4" />
              Board
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          {view === "list" ? (
            <DataTable data={data} />
          ) : (
            <EmployeeKanban initialData={data} />
          )}
        </div>
      </div>
    </div>
  );
}
