"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bot,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Activity,
  ThumbsUp,
  AlertCircle,
  Gauge,
  Info,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIAnalysisCardProps {
  score: number;
  riskLevel: "Low" | "Medium" | "High";
  analysis: string;
  strengths?: string[];
  weaknesses?: string[];
  confidenceLevel?: number;
  reviewDecision?: "pending" | "approved" | "adjusted" | "rejected";
  pmAdjustedScore?: number | null;
}

export function AIAnalysisCard({
  score,
  riskLevel,
  analysis,
  strengths = [],
  weaknesses = [],
  confidenceLevel = 0,
  reviewDecision = "pending",
  pmAdjustedScore,
}: AIAnalysisCardProps) {
  const getScoreColor = (s: number) => {
    if (s >= 90) return "text-emerald-600 dark:text-emerald-400";
    if (s >= 70) return "text-blue-600 dark:text-blue-400";
    if (s >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreProgressColor = (s: number) => {
    if (s >= 90) return "bg-emerald-500";
    if (s >= 70) return "bg-blue-500";
    if (s >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  const getRiskColor = (r: string) => {
    if (r === "High")
      return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    if (r === "Medium")
      return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
    return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
  };

  const getConfidenceColor = (c: number) => {
    if (c >= 80) return "bg-emerald-500";
    if (c >= 60) return "bg-blue-500";
    if (c >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  const getConfidenceLabel = (c: number) => {
    if (c >= 80) return "High";
    if (c >= 60) return "Moderate";
    if (c >= 40) return "Low";
    return "Very Low";
  };

  const getDecisionBadge = () => {
    switch (reviewDecision) {
      case "approved":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case "adjusted":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 text-xs">
            <Activity className="h-3 w-3 mr-1" />
            Adjusted → {pmAdjustedScore}
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 text-xs">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400">
            <Gauge className="h-3 w-3 mr-1" />
            Awaiting PM Review
          </Badge>
        );
    }
  };

  const finalScore = reviewDecision === "adjusted" && pmAdjustedScore != null ? pmAdjustedScore : score;

  return (
    <Card className="h-full shadow-sm border overflow-hidden">
      <CardHeader className="bg-muted/30 border-b pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Bot className="h-4 w-4 text-indigo-500" />
            AI Quality Assessment
          </CardTitle>
          <div className="flex items-center gap-2">
            {getDecisionBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        {/* Score & Risk Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Quality Score
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <p className="text-xs">
                      This is an AI-generated indicator score. The final decision is made by the PM.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${getScoreColor(finalScore)}`}>
                {finalScore}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <Progress
              value={finalScore}
              className="h-1.5 mt-2"
              indicatorClassName={getScoreProgressColor(finalScore)}
            />
            {reviewDecision === "adjusted" && pmAdjustedScore != null && (
              <p className="text-[10px] text-muted-foreground mt-1">
                AI original: <span className="font-medium">{score}</span> → PM adjusted: <span className="font-semibold">{pmAdjustedScore}</span>
              </p>
            )}
          </div>
          <div className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Risk Level
            </span>
            <div className="flex items-center h-9">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-2 ${getRiskColor(riskLevel)}`}
              >
                {riskLevel === "High" ? (
                  <AlertTriangle className="h-3.5 w-3.5" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5" />
                )}
                {riskLevel} Risk
              </div>
            </div>
          </div>
        </div>

        {/* AI Confidence Level */}
        <div className="bg-muted/20 rounded-lg p-3 border space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gauge className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                AI Confidence Level
              </span>
            </div>
            <span className="text-xs font-semibold text-foreground">
              {confidenceLevel}% — {getConfidenceLabel(confidenceLevel)}
            </span>
          </div>
          <Progress
            value={confidenceLevel}
            className="h-1.5"
            indicatorClassName={getConfidenceColor(confidenceLevel)}
          />
          <p className="text-[10px] text-muted-foreground/80">
            Indicates how confident the AI model is in this assessment based on the evidence provided.
          </p>
        </div>

        {/* Analysis Summary */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Activity className="h-4 w-4 text-indigo-500" />
            <span>Analysis Summary</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed pl-6 border-l-2 border-muted ml-2">
            {analysis}
          </p>
        </div>

        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <ThumbsUp className="h-4 w-4" />
              <span>Key Strengths</span>
            </div>
            <ul className="space-y-1.5 pl-6">
              {strengths.map((s, i) => (
                <li
                  key={i}
                  className="text-sm text-foreground/80 flex items-start gap-2"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses / Gaps */}
        {weaknesses.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span>Gaps / Areas for Improvement</span>
            </div>
            <ul className="space-y-1.5 pl-6">
              {weaknesses.map((w, i) => (
                <li
                  key={i}
                  className="text-sm text-foreground/80 flex items-start gap-2"
                >
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3">
          <p className="text-[11px] text-blue-700 dark:text-blue-400 flex items-start gap-2">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              This score is an <strong>AI-generated indicator</strong>, not a final decision.
              The Project Manager must verify and approve before it becomes official.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
