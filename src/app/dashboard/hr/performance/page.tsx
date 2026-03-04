"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  TrendingUp,
  Clock,
  CheckCircle2,
  Target,
  RefreshCw,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  PenLine,
  ShieldCheck,
  BarChart3,
  Eye,
  Gauge,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface EmployeePerformance {
  id: string;
  name: string;
  email: string;
  image: string;
  department: string;
  status: string;
  stats: {
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    reviewTasks: number;
    completionRate: number;
    onTimeRate: number;
    avgQualityScore: number;
    reliabilityScore: number;
    workloadScore: number;
    aiInsight: string | null;
  };
  verification: {
    total: number;
    approved: number;
    adjusted: number;
    rejected: number;
    approvalRate: number;
  };
}

interface OverviewStats {
  totalEmployees: number;
  avgCompletionRate: number;
  avgOnTimeRate: number;
  avgQualityScore: number;
}

export default function PerformanceOverviewPage() {
  const [employees, setEmployees] = useState<EmployeePerformance[]>([]);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/hr/performance");
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setEmployees(json.data.employees);
          setOverview(json.data.overview);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    const toastId = toast.loading("Recalculating performance metrics...");
    try {
      const res = await fetch("/api/dashboard/hr/performance", {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Performance metrics recalculated successfully!", {
          id: toastId,
        });
        await fetchData();
      } else {
        toast.error("Failed to recalculate metrics", { id: toastId });
      }
    } catch (e) {
      toast.error("Error connecting to server", { id: toastId });
    } finally {
      setRecalculating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreProgressColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-blue-500";
    if (score >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getReliabilityBadge = (score: number) => {
    if (score >= 80) {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
          <TrendingUp className="h-2.5 w-2.5 mr-1" />
          High
        </Badge>
      );
    }
    if (score >= 60) {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 text-[10px]">
          <Gauge className="h-2.5 w-2.5 mr-1" />
          Moderate
        </Badge>
      );
    }
    if (score >= 40) {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">
          <AlertTriangle className="h-2.5 w-2.5 mr-1" />
          Needs Improvement
        </Badge>
      );
    }
    return (
      <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 text-[10px]">
        <AlertTriangle className="h-2.5 w-2.5 mr-1" />
        At Risk
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4 pt-0">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Employee Performance
          </h2>
          <p className="text-muted-foreground">
            Organization-wide performance metrics with PM verification data.
          </p>
        </div>
        <Button
          variant="secondary"
          className="gap-2"
          onClick={handleRecalculate}
          disabled={recalculating}
        >
          {recalculating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Recalculate Metrics
        </Button>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-blue-100 dark:border-blue-900">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Target className="w-4 h-4 text-blue-500" />
                Avg Completion Rate
              </div>
              <p className="text-3xl font-bold mt-1">
                {overview.avgCompletionRate}%
              </p>
              <Progress
                value={overview.avgCompletionRate}
                className="h-1.5 mt-2"
                indicatorClassName="bg-blue-500"
              />
            </CardContent>
          </Card>
          <Card className="border-emerald-100 dark:border-emerald-900">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-emerald-500" />
                Avg On-Time Rate
              </div>
              <p className="text-3xl font-bold mt-1">
                {overview.avgOnTimeRate}%
              </p>
              <Progress
                value={overview.avgOnTimeRate}
                className="h-1.5 mt-2"
                indicatorClassName="bg-emerald-500"
              />
            </CardContent>
          </Card>
          <Card className="border-indigo-100 dark:border-indigo-900">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                Avg Quality Score
              </div>
              <p className="text-3xl font-bold mt-1">
                {overview.avgQualityScore}/100
              </p>
              <Progress
                value={overview.avgQualityScore}
                className="h-1.5 mt-2"
                indicatorClassName="bg-indigo-500"
              />
            </CardContent>
          </Card>
          <Card className="border-purple-100 dark:border-purple-900">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="w-4 h-4 text-purple-500" />
                Total Employees
              </div>
              <p className="text-3xl font-bold mt-1">
                {overview.totalEmployees}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Tracked across all departments
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-500" />
            Individual Performance
          </CardTitle>
          <CardDescription>
            Click on an employee to view detailed performance breakdown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>On-Time</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>PM Verification</TableHead>
                <TableHead>Reliability</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-muted-foreground py-10"
                  >
                    No employee data available. Employees must complete tasks to appear here.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((emp) => (
                  <TableRow key={emp.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={emp.image} alt={emp.name} />
                          <AvatarFallback>
                            {emp.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {emp.department}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">
                          {emp.stats.completedTasks}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / {emp.stats.totalTasks}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={emp.stats.completionRate}
                          className="h-1.5 w-16"
                          indicatorClassName={getScoreProgressColor(
                            emp.stats.completionRate
                          )}
                        />
                        <span
                          className={`text-xs font-medium ${getScoreColor(emp.stats.completionRate)}`}
                        >
                          {emp.stats.completionRate}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span
                          className={`text-sm font-medium ${getScoreColor(emp.stats.onTimeRate)}`}
                        >
                          {emp.stats.onTimeRate}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm font-bold ${getScoreColor(emp.stats.avgQualityScore)}`}
                      >
                        {emp.stats.avgQualityScore || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {emp.verification.total > 0 ? (
                        <div className="flex items-center gap-1">
                          <span className="text-emerald-600 text-xs font-medium flex items-center">
                            <ThumbsUp className="h-3 w-3 mr-0.5" />
                            {emp.verification.approved}
                          </span>
                          <span className="text-blue-600 text-xs font-medium flex items-center">
                            <PenLine className="h-3 w-3 mr-0.5" />
                            {emp.verification.adjusted}
                          </span>
                          <span className="text-red-600 text-xs font-medium flex items-center">
                            <ThumbsDown className="h-3 w-3 mr-0.5" />
                            {emp.verification.rejected}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          No reviews
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getReliabilityBadge(emp.stats.reliabilityScore)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/hr/performance/${emp.id}`}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 bg-primary text-primary-foreground hover:bg-primary/90 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Detail
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
