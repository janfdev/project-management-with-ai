"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  X,
  PenLine,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DecisionType = "approved" | "adjusted" | "rejected";

interface ReviewActionsProps {
  aiScore: number;
  reviewDecision?: "pending" | "approved" | "adjusted" | "rejected";
  onVerify: (decision: DecisionType, adjustedScore?: number, reason?: string) => Promise<void>;
  isSubmitting?: boolean;
}

export function ReviewActions({
  aiScore,
  reviewDecision = "pending",
  onVerify,
  isSubmitting = false,
}: ReviewActionsProps) {
  const [comment, setComment] = useState("");
  const [adjustedScore, setAdjustedScore] = useState(aiScore);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  // If already reviewed
  if (reviewDecision !== "pending") {
    return (
      <div className="w-full bg-card p-6 rounded-lg border shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          {reviewDecision === "approved" && (
            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Check className="h-3 w-3 mr-1" />
              Approved
            </Badge>
          )}
          {reviewDecision === "adjusted" && (
            <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
              <PenLine className="h-3 w-3 mr-1" />
              Score Adjusted
            </Badge>
          )}
          {reviewDecision === "rejected" && (
            <Badge className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400">
              <X className="h-3 w-3 mr-1" />
              Rejected — Revision Requested
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          This task has already been reviewed. The decision is final and recorded in the audit log.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5 w-full bg-card p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            PM Verification Decision
          </h3>
          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400">
            Awaiting Decision
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground">
          Review the AI analysis above, then choose one of the following actions.
          All decisions are permanently recorded in the audit log.
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Approve */}
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-auto py-4 flex-col gap-1"
            onClick={() => onVerify("approved")}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Check className="h-5 w-5" />
            )}
            <span className="font-semibold text-sm">Approve</span>
            <span className="text-[10px] opacity-80 font-normal">
              Accept AI score as-is
            </span>
          </Button>

          {/* Adjust Score */}
          <Button
            variant="outline"
            className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950 h-auto py-4 flex-col gap-1"
            onClick={() => {
              setAdjustedScore(aiScore);
              setAdjustReason("");
              setShowAdjustDialog(true);
            }}
            disabled={isSubmitting}
          >
            <PenLine className="h-5 w-5" />
            <span className="font-semibold text-sm">Adjust Score</span>
            <span className="text-[10px] opacity-80 font-normal">
              Modify score + reason
            </span>
          </Button>

          {/* Reject */}
          <Button
            variant="outline"
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950 h-auto py-4 flex-col gap-1"
            onClick={() => {
              setRejectReason("");
              setShowRejectDialog(true);
            }}
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
            <span className="font-semibold text-sm">Reject & Revise</span>
            <span className="text-[10px] opacity-80 font-normal">
              Request changes
            </span>
          </Button>
        </div>

        {/* Disclaimer */}
        <p className="text-[11px] text-muted-foreground/70 text-center">
          Your decision is final and will be permanently logged. 
          The AI score serves only as an initial indicator.
        </p>
      </div>

      {/* Adjust Score Dialog */}
      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5 text-blue-500" />
              Adjust Quality Score
            </DialogTitle>
            <DialogDescription>
              Modify the AI-generated score and provide a written justification.
              All changes are recorded in the audit log.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Score Comparison */}
            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">AI Score</p>
                <p className="text-2xl font-bold text-muted-foreground">{aiScore}</p>
              </div>
              <div className="text-muted-foreground">→</div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Your Score</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{adjustedScore}</p>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Set New Score (0–100)
              </label>
              <Slider
                value={[adjustedScore]}
                onValueChange={(value) => setAdjustedScore(value[0])}
                min={0}
                max={100}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 — Poor</span>
                <span>50 — Average</span>
                <span>100 — Excellent</span>
              </div>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                Reason for Adjustment <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Explain why you're adjusting the AI score..."
                className="min-h-[100px] resize-none"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAdjustDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!adjustReason.trim() || isSubmitting}
              onClick={async () => {
                await onVerify("adjusted", adjustedScore, adjustReason);
                setShowAdjustDialog(false);
              }}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PenLine className="h-4 w-4 mr-2" />
              )}
              Confirm Adjustment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Reject & Request Revision
            </DialogTitle>
            <DialogDescription>
              This will send the task back to the employee for revision.
              Provide clear feedback explaining what needs to be improved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Describe what needs to be improved or revised..."
                className="min-h-[120px] resize-none"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>

            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-md p-3">
              <p className="text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  This action will move the task back to <strong>In Progress</strong> and notify the employee.
                  The rejection reason will be visible to the employee.
                </span>
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || isSubmitting}
              onClick={async () => {
                await onVerify("rejected", undefined, rejectReason);
                setShowRejectDialog(false);
              }}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
