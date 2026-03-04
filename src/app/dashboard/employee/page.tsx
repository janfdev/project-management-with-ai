"use client";

// import { EmployeeKanban } from "@/components/dashboard/employee-kanban";
import { SectionCards } from "@/components/section-cards-employee";
import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive";
import { UpcomingDeadlines } from "@/components/upcoming-deadlines";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function EmployeeDashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Dashboard</h2>
          <p className="text-muted-foreground text-sm">
            Track your tasks, deadlines, and performance metrics.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Stats Cards - Already integrated with /api/dashboard/employee/stats */}
        <SectionCards key={`stats-${refreshKey}`} />

        {/* Chart & Deadlines Row */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
          <div className="col-span-4 lg:col-span-5">
            {/* Chart - Already integrated with /api/dashboard/employee/chart */}
            <ChartAreaInteractive key={`chart-${refreshKey}`} />
          </div>
          <div className="col-span-3 lg:col-span-2">
            {/* Deadlines - Already integrated with /api/tasks */}
            <UpcomingDeadlines key={`deadlines-${refreshKey}`} />
          </div>
        </div>

        {/* Kanban Board Section */}
        {/* <div className="flex-1">
          <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight">My Tasks</h2>
            <p className="text-muted-foreground">
              Manage your assigned tasks and submit evidence.
            </p>
          </div>
          <EmployeeKanban key={`kanban-${refreshKey}`} />
        </div> */}
      </div>
    </div>
  );
}
