"use client";
import { toast } from "sonner";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Bot,
  AlertTriangle,
  Eye,
  ShieldCheck,
  Gauge,
  CheckCircle2,
  Clock,
  History,
} from "lucide-react";
import Link from "next/link";

type Task = {
  id: string;
  title: string;
  assignee: { name: string; image?: string; role?: string };
  submittedAt: string;
  aiScore: number;
  status: string;
  riskLevel: string;
  aiAnalysis: string;
  aiConfidenceLevel?: number;
  reviewDecision?: string;
  pmAdjustedScore?: number | null;
};

export default function AuditPage() {
  const [auditQueue, setAuditQueue] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const scanRisk = async () => {
    const toastId = toast.loading("Scanning for risks...");
    try {
      const res = await fetch("/api/audit/scan", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Scan complete. Found ${data.risksFound} risks.`);
        window.location.reload();
      } else {
        toast.error("Scan failed");
      }
    } catch (e) {
      toast.error("Error connecting to server");
    } finally {
      toast.dismiss(toastId);
    }
  };

  useEffect(() => {
    const fetchAuditTasks = async () => {
      try {
        const res = await fetch("/api/audit");
        if (res.ok) {
          const data = await res.json();
          setAuditQueue(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchAuditTasks();
  }, []);

  const highRiskTasks = auditQueue.filter((t) => t.riskLevel === "High");

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 70) return "text-blue-600 dark:text-blue-400";
    if (score >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getReviewBadge = (task: Task) => {
    if (!task.aiScore || task.aiScore === 0) {
      return (
        <Badge
          variant="outline"
          className="text-[10px] text-muted-foreground border-muted"
        >
          No AI Score
        </Badge>
      );
    }
    switch (task.reviewDecision) {
      case "approved":
        return (
          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">
            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
            Verified
          </Badge>
        );
      case "adjusted":
        return (
          <Badge className="text-[10px] bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
            <ShieldCheck className="h-2.5 w-2.5 mr-1" />
            Adjusted
          </Badge>
        );
      default:
        return (
          <Badge className="text-[10px] bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Clock className="h-2.5 w-2.5 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (loading)
    return <div className="p-8 text-center">Loading audit queue...</div>;

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Audit Queue
          </h2>
          <p className="text-muted-foreground">
            AI-assisted quality control with PM verification.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/pm/audit/history">
            <Button variant="outline" className="gap-2">
              <History className="h-4 w-4" />
              Review History
            </Button>
          </Link>
          <Button
            variant="secondary"
            className="gap-2"
            onClick={() => scanRisk()}
          >
            <Bot className="h-4 w-4" />
            Scan for Risks
          </Button>
        </div>
      </div>

      {/* Disclaimer Banner */}
      <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900">
        <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-700 dark:text-blue-400">
          Human-in-the-Loop Verification
        </AlertTitle>
        <AlertDescription className="text-blue-600 dark:text-blue-300">
          AI scores are initial indicators only. Every score must be reviewed
          and verified by a Project Manager before finalization.
          All decisions are permanently logged in the audit trail.
        </AlertDescription>
      </Alert>

      {highRiskTasks.length > 0 && (
        <Alert
          variant="destructive"
          className="bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900"
        >
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertTitle className="text-red-700 dark:text-red-400">
            High Risk Tasks Detected
          </AlertTitle>
          <AlertDescription className="text-red-600 dark:text-red-300">
            The AI Auditor found {highRiskTasks.length} tasks with potential
            quality issues. These require immediate PM attention.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
          <CardDescription>
            Tasks waiting for PM verification. Click &quot;Review&quot; to examine AI
            analysis and make your decision.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>AI Score</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>PM Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditQueue.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground pt-8 pb-8"
                  >
                    No tasks pending review.
                  </TableCell>
                </TableRow>
              ) : (
                auditQueue.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{task.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {task.id.slice(0, 8)}...
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={task.assignee?.image} />
                          <AvatarFallback>
                            {task.assignee?.name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          {task.assignee?.name || "Unassigned"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {task.submittedAt
                        ? new Date(task.submittedAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-lg font-bold ${getScoreColor(task.aiScore || 0)}`}
                        >
                          {task.aiScore || 0}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          / 100
                        </span>
                        {task.riskLevel === "High" && (
                          <Badge
                            variant="destructive"
                            className="ml-1 text-[10px] h-5"
                          >
                            High
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.aiConfidenceLevel ? (
                        <div className="flex items-center gap-1.5">
                          <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {task.aiConfidenceLevel}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>{getReviewBadge(task)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/pm/audit/${encodeURIComponent(task.id)}`}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 px-3 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Review
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0"
                          onClick={async () => {
                            const toastId = toast.loading("Re-analyzing...");
                            try {
                              const res = await fetch(
                                "/api/ai/analyze-quality",
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ taskId: task.id }),
                                }
                              );
                              if (res.ok) {
                                toast.success("Analysis updated", {
                                  id: toastId,
                                });
                                window.location.reload();
                              } else {
                                toast.error("Analysis failed", { id: toastId });
                              }
                            } catch (e) {
                              toast.error("Error", { id: toastId });
                            }
                          }}
                        >
                          <Bot className="h-4 w-4" />
                        </Button>
                      </div>
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
