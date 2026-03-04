"use client";

import { useEffect, useState } from "react";
import { AuditTaskHeader } from "@/components/dashboard/pm/audit/audit-task-header";
import { AIAnalysisCard } from "@/components/dashboard/pm/audit/ai-analysis-card";
import { DeliverablesPreview } from "@/components/dashboard/pm/audit/deliverables-preview";
import { ReviewActions } from "@/components/dashboard/pm/audit/review-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Bot, Loader2, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  assigneeId: string;
  creatorId: string;
  dueDate: string;
  priority: string;
  aiBreakdown: string;
  aiRiskAnalysis: string;
  qualityAnalysis?: string;
  qualityScore: number;
  riskLevel: "Low" | "Medium" | "High";
  aiConfidenceLevel?: number;
  aiStrengths?: string[];
  aiWeaknesses?: string[];
  reviewDecision?: "pending" | "approved" | "adjusted" | "rejected";
  pmAdjustedScore?: number | null;
  pmNotes?: string | null;
  reviewedAt?: string;
  assignee: {
    name: string;
    image?: string;
  };
  submittedAt: string;
  evidences: {
    id: string;
    fileUrl: string;
    fileType: string;
    description: string;
    submittedAt: string;
    createdAt: string;
    updatedAt: string;
    name?: string;
    path?: string;
  }[];
};

export default function AuditDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTask = async () => {
    if (!id) return;
    try {
      const decodedId = decodeURIComponent(id);
      const res = await fetch(`/api/tasks/${decodedId}`);
      if (res.ok) {
        const data = await res.json();
        setTask({
          ...data,
          riskLevel:
            data.riskLevel === "high" || data.riskLevel === "critical"
              ? "High"
              : data.riskLevel === "medium"
                ? "Medium"
                : "Low",
          qualityAnalysis: data.qualityAnalysis,
          aiConfidenceLevel: data.aiConfidenceLevel ?? 0,
          aiStrengths: data.aiStrengths ?? [],
          aiWeaknesses: data.aiWeaknesses ?? [],
          reviewDecision: data.reviewDecision ?? "pending",
          pmAdjustedScore: data.pmAdjustedScore,
          pmNotes: data.pmNotes,
          reviewedAt: data.reviewedAt,
          assignee: data.assignee || { name: "Unknown" },
          submittedAt: data.updatedAt,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTask();
  }, [id]);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    const toastId = toast.loading("Running AI quality analysis...");
    try {
      const res = await fetch("/api/ai/analyze-quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: id }),
      });
      if (res.ok) {
        toast.success("AI analysis complete. Review the results below.", {
          id: toastId,
        });
        await fetchTask();
      } else {
        const data = await res.json();
        toast.error(data.error || "Analysis failed", { id: toastId });
      }
    } catch (e) {
      toast.error("Error connecting to server", { id: toastId });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVerify = async (
    decision: "approved" | "adjusted" | "rejected",
    adjustedScore?: number,
    reason?: string
  ) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Processing verification...");
    try {
      const res = await fetch("/api/ai/verify-quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: id,
          decision,
          adjustedScore,
          reason,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (decision === "approved") {
          toast.success("Task approved! Score finalized.", { id: toastId });
        } else if (decision === "adjusted") {
          toast.success(`Score adjusted to ${adjustedScore}. Task approved.`, {
            id: toastId,
          });
        } else {
          toast.success("Task rejected. Sent back for revision.", {
            id: toastId,
          });
        }
        // Refresh data to show updated state
        await fetchTask();
      } else {
        const data = await res.json();
        toast.error(data.error || "Verification failed", { id: toastId });
      }
    } catch (e) {
      toast.error("Error connecting to server", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-8 p-6 max-w-7xl mx-auto w-full">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-96" />
          <Skeleton className="h-6 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96" />
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-lg font-medium text-muted-foreground">
            Task not found
          </p>
          <Link href="/dashboard/pm/audit">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Queue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const hasAIAnalysis = task.qualityScore > 0 || task.qualityAnalysis;

  return (
    <div className="flex flex-1 flex-col gap-8 p-6 max-w-7xl mx-auto w-full">
      {/* Back Nav */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/pm/audit">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 -ml-2 text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Queue
          </Button>
        </Link>

        {/* Run/Re-run AI Analysis */}
        <Button
          variant="secondary"
          size="sm"
          className="gap-2"
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : hasAIAnalysis ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
          {hasAIAnalysis ? "Re-run AI Analysis" : "Run AI Analysis"}
        </Button>
      </div>

      <AuditTaskHeader task={task} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: AI Analysis */}
        <div className="space-y-6">
          {hasAIAnalysis ? (
            <AIAnalysisCard
              score={task.qualityScore}
              riskLevel={task.riskLevel}
              analysis={
                task.qualityAnalysis ||
                task.aiRiskAnalysis ||
                "AI analysis pending..."
              }
              strengths={task.aiStrengths}
              weaknesses={task.aiWeaknesses}
              confidenceLevel={task.aiConfidenceLevel}
              reviewDecision={task.reviewDecision}
              pmAdjustedScore={task.pmAdjustedScore}
            />
          ) : (
            <div className="bg-card border rounded-lg p-8 text-center space-y-4">
              <Bot className="h-12 w-12 text-muted-foreground/30 mx-auto" />
              <div>
                <p className="font-medium text-foreground">No AI Analysis Yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Run the AI analysis to generate a quality score and detailed assessment.
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
                Run AI Analysis
              </Button>
            </div>
          )}

          {/* PM Notes if already reviewed */}
          {task.pmNotes && (
            <div className="bg-card border rounded-lg p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                PM Notes
              </p>
              <p className="text-sm text-foreground leading-relaxed">
                {task.pmNotes}
              </p>
              {task.reviewedAt && (
                <p className="text-[10px] text-muted-foreground">
                  Reviewed on{" "}
                  {new Date(task.reviewedAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Task Details + Deliverables + Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="prose dark:prose-invert max-w-none">
            <h3 className="text-lg font-semibold mb-2">Task Description</h3>
            <p className="text-muted-foreground leading-relaxed">
              {task.description}
            </p>
          </div>

          <DeliverablesPreview evidences={task.evidences || []} />

          {/* PM Verification Actions — only show if AI analysis exists */}
          {hasAIAnalysis && (
            <ReviewActions
              aiScore={task.qualityScore}
              reviewDecision={task.reviewDecision}
              onVerify={handleVerify}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}
