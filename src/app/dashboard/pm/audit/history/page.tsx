"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  FileWarning,
  ThumbsUp,
  ThumbsDown,
  PenLine,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface AuditHistory {
  id: string;
  taskId: string;
  taskTitle: string;
  projectName: string;
  assigneeName: string;
  decision: "approved" | "adjusted" | "rejected";
  aiScore: number;
  pmScore: number;
  reason: string | null;
  createdAt: string;
}

export default function AuditHistoryPage() {
  const [history, setHistory] = useState<AuditHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch("/api/audit/history");
        if (response.ok) {
          const data = await response.json();
          setHistory(data);
        }
      } catch (error) {
        console.error("Failed to load audit history", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case "approved":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">
            <ThumbsUp className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "adjusted":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
            <PenLine className="w-3 h-3 mr-1" />
            Adjusted
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive">
            <ThumbsDown className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{decision}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/pm/audit">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Audit History
          </h2>
          <p className="text-muted-foreground">
            A log of all task verification decisions you've made.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileWarning className="w-5 h-5 text-indigo-500" />
            My Review Log
          </CardTitle>
          <CardDescription>
            Historical records of quality verification decisions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              No audit history found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Task Details</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Scores (AI → PM)</TableHead>
                  <TableHead>Notes / Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm line-clamp-1 max-w-[200px]" title={log.taskTitle}>
                        {log.taskTitle}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Project: {log.projectName} • Assignee: {log.assigneeName}
                      </div>
                    </TableCell>
                    <TableCell>{getDecisionBadge(log.decision)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={getScoreColor(log.aiScore)}>
                          {Math.round(log.aiScore)}
                        </span>
                        {log.decision === "adjusted" && (
                          <>
                            <ArrowLeft className="w-3 h-3 text-muted-foreground rotate-180" />
                            <span className={getScoreColor(log.pmScore)}>
                              {Math.round(log.pmScore)}
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm italic text-muted-foreground line-clamp-2 max-w-[300px]">
                        {log.reason || "—"}
                      </p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
