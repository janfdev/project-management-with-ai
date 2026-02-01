"use client";

import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive";
import { DataTable } from "@/components/dashboard/data-table";
import { SectionCards } from "@/components/section-cards";
import data from "./data.json";

export default function EmployeeDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6">
        <SectionCards />
        <div className="w-full">
          <ChartAreaInteractive />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Recent Tasks</h2>
        </div>
        <DataTable data={data} />
      </div>
    </div>
  );
}
