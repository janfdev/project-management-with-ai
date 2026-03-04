"use client";

import { PendingApprovals } from "@/components/dashboard/hr/pending-approvals";
import { EmployeeDistributionChart } from "@/components/dashboard/hr/employee-distribution-chart";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserCheck,
  Briefcase,
  ListTodo,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FolderKanban,
  BarChart3,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface HRStats {
  overview: {
    totalEmployees: number;
    employeeGrowth: number;
    pendingApprovals: number;
    activeProjects: number;
    projectGrowth: number;
    avgWorkload: number;
  };
  departmentDistribution: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  topDepartments?: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  userStatusBreakdown?: {
    approved: number;
    pending: number;
    total: number;
  };
  workloadStats?: {
    totalActiveTasks: number;
    avgTasksPerEmployee: number;
    overloadedUsers: number;
    maxWorkload: number;
    minWorkload: number;
  };
  pendingApprovalsList?: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
}

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  endDate?: string;
  createdAt?: string;
  startDate?: string;
}

interface AnalyticsData {
  overview: {
    totalTasks: number;
    completedTasks: number;
    completionRate: string | number;
  };
  workload: Array<{
    userId: string;
    name: string;
    activeTaskCount: number;
    status: string;
  }>;
}

export default function HRDashboardPage() {
  const [stats, setStats] = useState<HRStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      // Fetch all data in parallel
      const [statsRes, projectsRes, analyticsRes] = await Promise.all([
        fetch("/api/dashboard/hr/stats"),
        fetch("/api/projects"),
        fetch("/api/analytics"),
      ]);

      // Process HR Stats
      if (statsRes.ok) {
        const result = await statsRes.json();
        if (result.success) {
          setStats(result.data);
        }
      }

      // Process Projects
      if (projectsRes.ok) {
        const projectData = await projectsRes.json();
        // Sort by created date and take top 5
        const sorted = (projectData as Project[])
          .sort(
            (a, b) =>
              new Date(b.createdAt || b.startDate || 0).getTime() -
              new Date(a.createdAt || a.startDate || 0).getTime()
          )
          .slice(0, 5);
        setProjects(sorted);
      }

      // Process Analytics
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error("Failed to fetch HR data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-50 border-green-200";
      case "completed":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "on_hold":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "planning":
        return "text-purple-600 bg-purple-50 border-purple-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const generateAndDownloadPdf = () => {
    import("jspdf").then((jsPDFModule) => {
      import("jspdf-autotable").then((autoTableModule) => {
        const jsPDF = jsPDFModule.default;
        const autoTable = autoTableModule.default;

        const doc = new jsPDF();
        
        // Report Header
        doc.setFontSize(22);
        doc.setTextColor(33, 37, 41);
        doc.text("Human Resources Analytics Report", 14, 22);
        
        doc.setFontSize(10);
        doc.setTextColor(108, 117, 125);
        doc.text(`Generated on: ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}`, 14, 30);
        doc.text(`Classification: Internal / Confidential`, 14, 35);
        
        // Overview Section
        doc.setFontSize(14);
        doc.setTextColor(33, 37, 41);
        doc.text("1. Executive Summary", 14, 50);
        
        autoTable(doc, {
          startY: 55,
          head: [["Metric", "Value", "Remarks"]],
          body: [
            ["Total Employees", stats?.overview.totalEmployees?.toString() || "0", "Active headcount"],
            ["Employee Growth (Month)", `+${stats?.overview.employeeGrowth || 0}`, "New hires mapping"],
            ["Pending Approvals", stats?.overview.pendingApprovals?.toString() || "0", "Awaiting HR verification"],
            ["Active Projects", stats?.overview.activeProjects?.toString() || "0", "Ongoing cross-functional ops"],
            ["Avg Workload/Employee", `${stats?.overview.avgWorkload?.toString() || "0"} tasks`, "Company-wide average"],
          ],
          theme: "grid",
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          styles: { font: "helvetica", fontSize: 10 },
        });

        let finalY = (doc as any).lastAutoTable.finalY || 55;

        // Department Distribution
        if (stats?.departmentDistribution && stats.departmentDistribution.length > 0) {
          doc.setFontSize(14);
          doc.text("2. Department Distribution", 14, finalY + 15);
          
          autoTable(doc, {
            startY: finalY + 20,
            head: [["Department", "Headcount", "Percentage of Total"]],
            body: stats.departmentDistribution.map(d => [
              d.name,
              d.count.toString(),
              `${d.percentage}%`
            ]),
            theme: "grid",
            headStyles: { fillColor: [52, 73, 94], textColor: 255 },
            styles: { font: "helvetica", fontSize: 10 },
          });
          finalY = (doc as any).lastAutoTable.finalY || finalY + 20;
        }

        // Current Projects Section
        if (projects && projects.length > 0) {
          if (finalY > 220) {
            doc.addPage();
            finalY = 20;
          }
          
          doc.setFontSize(14);
          doc.text("3. Active Projects Overview", 14, finalY + 15);
          
          autoTable(doc, {
            startY: finalY + 20,
            head: [["Project Name", "Status", "Progress", "Target Completion"]],
            body: projects.map(p => [
              p.name,
              p.status.toUpperCase(),
              `${p.progress}%`,
              p.endDate ? new Date(p.endDate).toLocaleDateString() : "TBD"
            ]),
            theme: "grid",
            headStyles: { fillColor: [39, 174, 96], textColor: 255 },
            styles: { font: "helvetica", fontSize: 10 },
          });
        }
        
        // Footer pages
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: "center" });
          doc.text(`Generated by Ai-PM Management System`, 14, doc.internal.pageSize.height - 10);
        }

        doc.save(`HR_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      });
    });
  };

  const getWorkloadStatus = (status: string) => {
    if (status === "Overloaded") {
      return (
        <Badge variant="destructive" className="text-xs">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Overloaded
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-green-600 border-green-200 bg-green-50 text-xs"
      >
        <CheckCircle2 className="w-3 h-3 mr-1" />
        Optimal
      </Badge>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">HR Overview</h2>
          <p className="text-muted-foreground text-sm">
            Comprehensive view of your organization's workforce and projects.
          </p>
        </div>
        <Button onClick={generateAndDownloadPdf} className="flex items-center gap-2" variant="outline">
          <Download className="w-4 h-4" />
          Download PDF Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Employees */}
        {loading ? (
          <StatCardSkeleton />
        ) : (
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                Total Employees
              </h3>
            </div>
            <div className="text-2xl font-bold">
              {stats?.overview.totalEmployees || 0}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {stats?.overview.employeeGrowth !== undefined &&
              stats.overview.employeeGrowth >= 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-green-500">
                    +{stats.overview.employeeGrowth}
                  </span>{" "}
                  this month
                </>
              ) : (
                `${stats?.overview.employeeGrowth || 0} this month`
              )}
            </p>
          </div>
        )}

        {/* Card 2: Pending Approvals */}
        {loading ? (
          <StatCardSkeleton />
        ) : (
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-amber-500" />
                Pending Approvals
              </h3>
            </div>
            <div className="text-2xl font-bold">
              {stats?.overview.pendingApprovals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.overview.pendingApprovals &&
              stats.overview.pendingApprovals > 0 ? (
                <span className="text-amber-600 font-medium">
                  Action required
                </span>
              ) : (
                <span className="text-green-600">All caught up</span>
              )}
            </p>
          </div>
        )}

        {/* Card 3: Active Projects */}
        {loading ? (
          <StatCardSkeleton />
        ) : (
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-purple-500" />
                Active Projects
              </h3>
            </div>
            <div className="text-2xl font-bold">
              {stats?.overview.activeProjects || 0}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {stats?.overview.projectGrowth !== undefined &&
              stats.overview.projectGrowth >= 0 ? (
                <>
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-green-500">
                    +{stats.overview.projectGrowth}
                  </span>{" "}
                  new projects
                </>
              ) : (
                `${stats?.overview.projectGrowth || 0} projects`
              )}
            </p>
          </div>
        )}

        {/* Card 4: Average Workload */}
        {loading ? (
          <StatCardSkeleton />
        ) : (
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-green-500" />
                Avg Workload
              </h3>
            </div>
            <div className="text-2xl font-bold">
              {stats?.overview.avgWorkload || 0}
            </div>
            <p className="text-xs text-muted-foreground">tasks per employee</p>
          </div>
        )}
      </div>

      {/* Additional Stats Row */}
      {!loading && (stats?.workloadStats || analytics) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Active Tasks */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                Active Tasks
              </h3>
            </div>
            <div className="text-2xl font-bold">
              {stats?.workloadStats?.totalActiveTasks ||
                analytics?.overview?.totalTasks ||
                0}
            </div>
            <p className="text-xs text-muted-foreground">across all projects</p>
          </div>

          {/* Completed Tasks */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Completed Tasks
              </h3>
            </div>
            <div className="text-2xl font-bold">
              {analytics?.overview?.completedTasks || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics?.overview?.completionRate || 0}% completion rate
            </p>
          </div>

          {/* Overloaded Users */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Overloaded Users
              </h3>
            </div>
            <div className="text-2xl font-bold">
              {stats?.workloadStats?.overloadedUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.workloadStats?.overloadedUsers === 0 ? (
                <span className="text-green-600">Workload balanced</span>
              ) : (
                <span className="text-red-600">Needs attention</span>
              )}
            </p>
          </div>

          {/* User Status */}
          <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                Total Users
              </h3>
            </div>
            <div className="text-2xl font-bold">
              {stats?.userStatusBreakdown?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                {stats?.userStatusBreakdown?.approved || 0} approved
              </span>{" "}
              /{" "}
              <span className="text-amber-600">
                {stats?.userStatusBreakdown?.pending || 0} pending
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
        <div className="col-span-4 lg:col-span-4">
          <PendingApprovals />
        </div>
        <div className="col-span-3 lg:col-span-3">
          {loading ? (
            <ChartSkeleton />
          ) : (
            <EmployeeDistributionChart
              data={stats?.departmentDistribution || []}
            />
          )}
        </div>
      </div>

      {/* Bottom Section: Recent Projects & Workload Overview */}
      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-purple-500" />
              Recent Projects
            </CardTitle>
            <CardDescription>
              Latest projects across the organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No projects found.
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {project.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Progress
                          value={project.progress || 0}
                          className="h-1.5 w-24"
                        />
                        <span className="text-xs text-muted-foreground">
                          {project.progress || 0}%
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`capitalize ${getStatusColor(project.status)}`}
                    >
                      {project.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workload Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Employee Workload
            </CardTitle>
            <CardDescription>
              Current task distribution across employees.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : !analytics?.workload || analytics.workload.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No workload data available.
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.workload.slice(0, 5).map((employee) => (
                  <div
                    key={employee.userId}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {employee.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {employee.activeTaskCount} active tasks
                      </p>
                    </div>
                    {getWorkloadStatus(employee.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Workload Statistics Summary */}
      {!loading && stats?.workloadStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Workload Statistics
            </CardTitle>
            <CardDescription>
              Summary of task distribution and workload balance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Total Active Tasks</p>
                <p className="text-2xl font-bold">
                  {stats.workloadStats.totalActiveTasks}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Avg Tasks/Employee</p>
                <p className="text-2xl font-bold">
                  {stats.workloadStats.avgTasksPerEmployee}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Max Workload</p>
                <p className="text-2xl font-bold">
                  {stats.workloadStats.maxWorkload}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    tasks
                  </span>
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground">Min Workload</p>
                <p className="text-2xl font-bold">
                  {stats.workloadStats.minWorkload}{" "}
                  <span className="text-xs font-normal text-muted-foreground">
                    tasks
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Skeleton Components
function StatCardSkeleton() {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6">
      <Skeleton className="h-6 w-48 mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
