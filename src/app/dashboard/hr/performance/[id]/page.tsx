"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  PenLine,
  AlertTriangle,
  BarChart3,
  Gauge,
  CalendarClock,
  FileText,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface EmployeeDetail {
  employee: {
    id: string;
    name: string;
    email: string;
    image: string;
    department: string;
    role: string;
    status: string;
    createdAt: string;
  };
  stats: {
    totalTasks: number;
    completedTasks: number;
    activeTasks: number;
    reviewTasks: number;
    completionRate: number;
    reliabilityScore: number;
  };
  onTimeDelivery: {
    rate: number;
    onTime: number;
    late: number;
    noDeadline: number;
    total: number;
  };
  quality: {
    avgAiScore: number;
    avgFinalScore: number;
    totalAssessed: number;
  };
  verification: {
    total: number;
    approved: number;
    adjusted: number;
    rejected: number;
    approvalRate: number;
  };
  recentTasks: {
    id: string;
    title: string;
    status: string;
    priority: string;
    projectName: string;
    dueDate: string | null;
    completedDate: string | null;
    qualityScore: number | null;
    pmAdjustedScore: number | null;
    reviewDecision: string | null;
    isLate: boolean;
  }[];
  metricsHistory: {
    month: number;
    year: number;
    tasksCompleted: number;
    onTimeRate: number;
    reliabilityScore: number;
    workloadScore: number;
    aiInsight: string | null;
    calculatedAt: string;
  }[];
}

export default function EmployeePerformanceDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [data, setData] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/dashboard/hr/performance/${id}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) setData(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (s >= 60) return "text-blue-600 dark:text-blue-400";
    if (s >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getProgressColor = (s: number) => {
    if (s >= 80) return "bg-emerald-500";
    if (s >= 60) return "bg-blue-500";
    if (s >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
            Done
          </Badge>
        );
      case "review":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 text-[10px]">
            Review
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            To Do
          </Badge>
        );
    }
  };

  const getReviewBadge = (decision: string | null) => {
    switch (decision) {
      case "approved":
        return (
          <span className="text-emerald-600 text-xs font-medium flex items-center gap-0.5">
            <ThumbsUp className="h-3 w-3" /> Approved
          </span>
        );
      case "adjusted":
        return (
          <span className="text-blue-600 text-xs font-medium flex items-center gap-0.5">
            <PenLine className="h-3 w-3" /> Adjusted
          </span>
        );
      case "rejected":
        return (
          <span className="text-red-600 text-xs font-medium flex items-center gap-0.5">
            <ThumbsDown className="h-3 w-3" /> Rejected
          </span>
        );
      default:
        return <span className="text-xs text-muted-foreground">—</span>;
    }
  };

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-4 pt-0">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center">
        <p className="text-muted-foreground text-lg">Employee not found</p>
        <Link href="/dashboard/hr/performance">
          <Button variant="outline" className="mt-4 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
      </div>
    );
  }

  const { employee, stats, onTimeDelivery, quality, verification, recentTasks, metricsHistory } =
    data;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      {/* Back Nav */}
      <Link href="/dashboard/hr/performance">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2 text-muted-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Performance Overview
        </Button>
      </Link>

      {/* Employee Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-indigo-200 dark:border-indigo-800">
          <AvatarImage src={employee.image} alt={employee.name} />
          <AvatarFallback className="text-lg">
            {employee.name
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {employee.name}
          </h2>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>{employee.email}</span>
            <span>·</span>
            <Badge variant="outline" className="text-xs capitalize">
              {employee.department}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Completion Rate */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Target className="w-4 h-4 text-blue-500" />
              Completion Rate
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${getScoreColor(stats.completionRate)}`}>
                {stats.completionRate}%
              </span>
            </div>
            <Progress
              value={stats.completionRate}
              className="h-1.5 mt-2"
              indicatorClassName={getProgressColor(stats.completionRate)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.completedTasks} of {stats.totalTasks} tasks completed
            </p>
          </CardContent>
        </Card>

        {/* On-Time Delivery */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              On-Time Delivery
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${getScoreColor(onTimeDelivery.rate)}`}>
                {onTimeDelivery.rate}%
              </span>
            </div>
            <Progress
              value={onTimeDelivery.rate}
              className="h-1.5 mt-2"
              indicatorClassName={getProgressColor(onTimeDelivery.rate)}
            />
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-emerald-600 flex items-center gap-0.5">
                <CheckCircle2 className="h-3 w-3" /> {onTimeDelivery.onTime} on-time
              </span>
              <span className="text-xs text-red-500 flex items-center gap-0.5">
                <XCircle className="h-3 w-3" /> {onTimeDelivery.late} late
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Quality Score */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              Quality Score
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${getScoreColor(quality.avgFinalScore)}`}>
                {quality.avgFinalScore || "—"}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <Progress
              value={quality.avgFinalScore}
              className="h-1.5 mt-2"
              indicatorClassName={getProgressColor(quality.avgFinalScore)}
            />
            <p className="text-xs text-muted-foreground mt-2">
              AI avg: {quality.avgAiScore} · Assessed: {quality.totalAssessed} tasks
            </p>
          </CardContent>
        </Card>

        {/* Reliability Score */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Gauge className="w-4 h-4 text-purple-500" />
              Reliability Score
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${getScoreColor(stats.reliabilityScore)}`}>
                {stats.reliabilityScore}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <Progress
              value={stats.reliabilityScore}
              className="h-1.5 mt-2"
              indicatorClassName={getProgressColor(stats.reliabilityScore)}
            />
            <p className="text-[10px] text-muted-foreground mt-2">
              Weighted: 40% quality + 30% on-time + 30% completion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* PM Verification + On-Time Breakdown Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* PM Verification Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-indigo-500" />
              PM Verification History
            </CardTitle>
            <CardDescription>
              How this employee&apos;s work was evaluated by Project Managers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {verification.total === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No PM verifications yet.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Reviews
                  </span>
                  <span className="text-lg font-bold">{verification.total}</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
                    <ThumbsUp className="h-5 w-5 text-emerald-600 mx-auto" />
                    <p className="text-xl font-bold text-emerald-600 mt-1">
                      {verification.approved}
                    </p>
                    <p className="text-[10px] text-emerald-600">Approved</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
                    <PenLine className="h-5 w-5 text-blue-600 mx-auto" />
                    <p className="text-xl font-bold text-blue-600 mt-1">
                      {verification.adjusted}
                    </p>
                    <p className="text-[10px] text-blue-600">Adjusted</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
                    <ThumbsDown className="h-5 w-5 text-red-600 mx-auto" />
                    <p className="text-xl font-bold text-red-600 mt-1">
                      {verification.rejected}
                    </p>
                    <p className="text-[10px] text-red-600">Rejected</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Approval Rate</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={verification.approvalRate}
                      className="h-2 w-24"
                      indicatorClassName={getProgressColor(
                        verification.approvalRate
                      )}
                    />
                    <span
                      className={`text-sm font-bold ${getScoreColor(verification.approvalRate)}`}
                    >
                      {verification.approvalRate}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* On-Time Delivery Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-emerald-500" />
              On-Time Delivery Breakdown
            </CardTitle>
            <CardDescription>
              Detailed timeline compliance for completed tasks.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {onTimeDelivery.total === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No completed tasks yet.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Tasks Completed
                  </span>
                  <span className="text-lg font-bold">
                    {onTimeDelivery.total}
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                      <span className="text-sm">On Time</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {onTimeDelivery.onTime}
                      </span>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {onTimeDelivery.total > 0
                          ? Math.round(
                              (onTimeDelivery.onTime / onTimeDelivery.total) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={
                      onTimeDelivery.total > 0
                        ? (onTimeDelivery.onTime / onTimeDelivery.total) * 100
                        : 0
                    }
                    className="h-2"
                    indicatorClassName="bg-emerald-500"
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-sm">Late</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {onTimeDelivery.late}
                      </span>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {onTimeDelivery.total > 0
                          ? Math.round(
                              (onTimeDelivery.late / onTimeDelivery.total) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                  <Progress
                    value={
                      onTimeDelivery.total > 0
                        ? (onTimeDelivery.late / onTimeDelivery.total) * 100
                        : 0
                    }
                    className="h-2"
                    indicatorClassName="bg-red-500"
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-gray-400" />
                      <span className="text-sm">No Deadline</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">
                        {onTimeDelivery.noDeadline}
                      </span>
                      <span className="text-xs text-muted-foreground w-12 text-right">
                        {onTimeDelivery.total > 0
                          ? Math.round(
                              (onTimeDelivery.noDeadline /
                                onTimeDelivery.total) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Metrics History */}
      {metricsHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              Monthly Metrics History
            </CardTitle>
            <CardDescription>
              Historical performance snapshots per month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Tasks Done</TableHead>
                  <TableHead>On-Time</TableHead>
                  <TableHead>Reliability</TableHead>
                  <TableHead>Workload</TableHead>
                  <TableHead>AI Insight</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metricsHistory.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      {monthNames[(m.month ?? 1) - 1]} {m.year}
                    </TableCell>
                    <TableCell>{m.tasksCompleted}</TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${getScoreColor(m.onTimeRate ?? 0)}`}
                      >
                        {m.onTimeRate}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${getScoreColor(m.reliabilityScore ?? 0)}`}
                      >
                        {m.reliabilityScore}/100
                      </span>
                    </TableCell>
                    <TableCell>
                      <Progress
                        value={m.workloadScore ?? 0}
                        className="h-1.5 w-16"
                        indicatorClassName={
                          (m.workloadScore ?? 0) >= 80
                            ? "bg-red-500"
                            : (m.workloadScore ?? 0) >= 50
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                        }
                      />
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="text-xs text-muted-foreground truncate">
                        {m.aiInsight || "—"}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-500" />
            Recent Tasks
          </CardTitle>
          <CardDescription>
            Last 10 tasks assigned to this employee.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>PM Decision</TableHead>
                <TableHead>Timeline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentTasks.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground py-8"
                  >
                    No tasks found.
                  </TableCell>
                </TableRow>
              ) : (
                recentTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <p className="text-sm font-medium truncate max-w-[200px]">
                        {task.title}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {task.projectName}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(task.status)}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {task.qualityScore !== null ? (
                        <span
                          className={`text-sm font-bold ${getScoreColor(task.pmAdjustedScore ?? task.qualityScore)}`}
                        >
                          {task.pmAdjustedScore ?? task.qualityScore}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getReviewBadge(task.reviewDecision)}
                    </TableCell>
                    <TableCell>
                      {task.isLate ? (
                        <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 text-[10px]">
                          <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                          Late
                        </Badge>
                      ) : task.completedDate ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
                          <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                          On Time
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
