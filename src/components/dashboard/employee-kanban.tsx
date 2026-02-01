"use client";

import { useState, useMemo } from "react";
import {
  KanbanBoard,
  KanbanBoardCard,
  KanbanBoardCardDescription,
  KanbanBoardCardTitle,
  KanbanBoardColumn,
  KanbanBoardColumnHeader,
  KanbanBoardColumnTitle,
  KanbanBoardColumnList,
  KanbanBoardColumnListItem,
  KanbanBoardProvider,
  KanbanColorCircle,
  KanbanBoardCircleColor,
  useDndMonitor,
} from "@/components/kanban"; // Adjust import path if needed
import { Badge } from "@/components/ui/badge";

// Tipe data sesuai data.json
type Task = {
  id: number;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
};

interface EmployeeKanbanProps {
  initialData: Task[];
}

const COLUMNS = [
  { id: "Todo", title: "Todo", color: "gray" as KanbanBoardCircleColor },
  {
    id: "In Process",
    title: "In Progress",
    color: "blue" as KanbanBoardCircleColor,
  },
  {
    id: "Review",
    title: "In Review",
    color: "yellow" as KanbanBoardCircleColor,
  },
  { id: "Done", title: "Done", color: "green" as KanbanBoardCircleColor },
];

function KanbanContent({
  tasks,
  setTasks,
}: {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}) {
  useDndMonitor({
    onDragEnd: (activeId, overId) => {
      if (!overId) return;

      const activeTask = tasks.find((t) => t.id.toString() === activeId);
      if (!activeTask) return;

      let newStatus = overId;

      // Check if dropped on another card -> Find that card's column/status
      const overTask = tasks.find((t) => t.id.toString() === overId);
      if (overTask) {
        newStatus = overTask.status;
      }

      // If dropped on a column (columnId matches status)
      const column = COLUMNS.find((c) => c.id === overId);
      if (column) {
        newStatus = column.id;
      }

      // Special check: If dropped on a card, newStatus is correct.
      // Ensure mapped status matches one of our expected statuses.
      // (For this dummy data, "In Process" matches a column ID exactly).

      if (activeTask.status !== newStatus) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === activeTask.id ? { ...t, status: newStatus } : t,
          ),
        );
      }
    },
  });

  const columnsData = useMemo(() => {
    const cols = COLUMNS.map((col) => ({
      ...col,
      tasks: tasks.filter((t) => {
        if (t.status === col.id) return true;
        // Fallback logic specific to our dummy data naming
        // If a task's status doesn't match any explicit column ID,
        // and the column is "Todo", assign it to "Todo".
        if (col.id === "Todo" && !COLUMNS.some((c) => c.id === t.status))
          return true;
        return false;
      }),
    }));
    return cols;
  }, [tasks]);

  return (
    <KanbanBoard className="h-full">
      {columnsData.map((col) => (
        <KanbanBoardColumn key={col.id} columnId={col.id}>
          <KanbanBoardColumnHeader>
            <div className="flex items-center gap-2">
              <KanbanColorCircle color={col.color} />
              <KanbanBoardColumnTitle columnId={col.id}>
                {col.title}
              </KanbanBoardColumnTitle>
              <Badge variant="secondary" className="ml-auto">
                {col.tasks.length}
              </Badge>
            </div>
          </KanbanBoardColumnHeader>

          <KanbanBoardColumnList>
            {col.tasks.map((task) => (
              <KanbanBoardColumnListItem
                key={task.id}
                cardId={task.id.toString()}
              >
                <KanbanBoardCard
                  data={{ id: task.id.toString() }}
                  className="flex flex-col gap-2"
                >
                  <div className="flex justify-between items-start">
                    <KanbanBoardCardTitle>{task.header}</KanbanBoardCardTitle>
                  </div>

                  <KanbanBoardCardDescription>
                    {task.type}
                  </KanbanBoardCardDescription>

                  <div className="flex items-center justify-between mt-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1 py-0 h-5"
                    >
                      Reviewer: {task.reviewer.split(" ")[0]}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      Limit: {task.limit}
                    </span>
                  </div>
                </KanbanBoardCard>
              </KanbanBoardColumnListItem>
            ))}
          </KanbanBoardColumnList>
        </KanbanBoardColumn>
      ))}
      {/* Empty state filler logic if needed */}
    </KanbanBoard>
  );
}

export function EmployeeKanban({ initialData }: EmployeeKanbanProps) {
  const [tasks, setTasks] = useState<Task[]>(initialData);

  // Fungsi untuk menangani pemindahan kartu
  // Note: Karena kanban.tsx menggunakan native drag-drop, kita harus handle logic update state
  // Namun, komponen kanban.tsx yang Anda miliki tampaknya abstraksi UI.
  // Kita perlu memastikan logic onDropOverColumn atau onDropOverListItem mentrigger update state.

  // Sederhananya untuk MVP ini, kita akan memfilter data berdasarkan status untuk di-render.
  // Implementasi Drag & Drop sesungguhnya memerlukan penanganan event onDragEnd dari Provider,
  // tapi mari kita render visualnya dulu agar sesuai struktur.

  return (
    <div className="h-[calc(100vh-250px)] w-full">
      {/* 
         Height calculated to fit within dashboard without double scrollbar nicely. 
         KanbanBoardProvider wraps logic.
       */}
      <KanbanBoardProvider>
        <KanbanContent tasks={tasks} setTasks={setTasks} />
      </KanbanBoardProvider>
    </div>
  );
}
