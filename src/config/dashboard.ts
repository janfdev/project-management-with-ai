import React from "react";
import {
  IconChartBar,
  IconDashboard,
  IconListDetails,
  IconUsers,
  IconActivity,
  IconAlertTriangle,
} from "@tabler/icons-react";

export type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType;
  isActive?: boolean;
};

export const dashboardConfig = {
  employee: [
    {
      title: "Dashboard",
      url: "/dashboard/employee",
      icon: IconDashboard,
    },
    {
      title: "Tasks",
      url: "/dashboard/employee/tasks",
      icon: IconListDetails,
    },
    {
      title: "Performance",
      url: "/dashboard/employee/performance",
      icon: IconChartBar,
    },
  ],
  pm: [
    {
      title: "Overview",
      url: "/dashboard/pm",
      icon: IconActivity,
    },
    {
      title: "Projects",
      url: "/dashboard/pm/projects",
      icon: IconListDetails,
    },
    {
      title: "Audit Queue",
      url: "/dashboard/pm/audit",
      icon: IconAlertTriangle,
    },
  ],
  hr: [
    {
      title: "Overview",
      url: "/dashboard/hr",
      icon: IconDashboard,
    },
    {
      title: "Talent Intelligence",
      url: "/dashboard/hr/talent-intelligence",
      icon: IconChartBar,
    },
    {
      title: "Performance",
      url: "/dashboard/hr/performance",
      icon: IconActivity,
    },
    {
      title: "Manage Users",
      url: "/dashboard/hr/users-management",
      icon: IconUsers,
    },
  ],
};
