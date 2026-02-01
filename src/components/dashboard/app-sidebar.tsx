"use client";

import * as React from "react";
import { IconInnerShadowTop } from "@tabler/icons-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { dashboardConfig } from "@/config/dashboard";

// Mock user data - in a real app this would come from props or a store
const userMock = {
  name: "Dev User",
  email: "dev@quavity.com",
  avatar: "/avatars/shadcn.jpg",
  role: "Employee",
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  role?: "employee" | "pm" | "hr";
}

export function AppSidebar({ role = "employee", ...props }: AppSidebarProps) {
  // Select navigation items based on role
  // Default to employee if role not found or any type mismatch
  const navItems = dashboardConfig[role] || dashboardConfig.employee;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">
                  Quavity Dashboard
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userMock} />
      </SidebarFooter>
    </Sidebar>
  );
}
