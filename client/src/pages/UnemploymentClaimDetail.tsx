import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Briefcase, ArrowLeft, ExternalLink, Copy, CheckCircle2, Clock,
  AlertTriangle, Loader2, FileText, Download, Calendar, Gavel,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

function daysUntil(dateStr: string | Date | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatSeparation(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── Deadline Banner ───────────────────────────────────────────────

function DeadlineBanner({ claim }: { claim: any }) {
  if (claim.responseSubmittedDate) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            Response submitted {new Date(claim.responseSubmittedDate).toLocaleDateString()}.
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500">Determination pending.</p>
        </div>
      </div>
    );
  }

  const days = daysUntil(claim.responseDeadline);
  if (days === null) return null;

  const isOverdue = days < 0;
  const isUrgent = days <= 3;
  const isSoon = days <= 5;

  const bgColor = isOverdue
    ? "bg-red-500/10 border-red-500/30 animate-pulse"
    : isUrgent
      ? "bg-red-500/10 border-red-500/30"
      : isSoon
        ? "bg-amber-500/10 border-amber-500/30"
        : "bg-emerald-500/10 border-emerald-500/30";

  const textColor = isOverdue || isUrgent
    ? "text-red-700 dark:text-red-400"
    : isSoon
      ? "text-amber-700 dark:text-amber-400"
      : "text-emerald-700 dark:text-emerald-400";

  return (
    <div className={`border rounded-lg p-4 flex items-center justify-between ${bgColor}`}>
      <div className="flex items-center gap-3">
        <AlertTriangle className={`h-5 w-5 ${textColor} flex-shrink-0`} />
        <div>
          <p className={`text-sm font-bold ${textColor}`}>
            ⚠️ SIDES Response Due: {new Date(claim.responseDeadline).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </p>
          <p className={`text-xs ${textColor}`}>
            {isOverdue ? `${Math.abs(days)} days overdue!` : `${days} days remaining`}
          </p>
        </div>
      </div>
      <Button size="sm" className="bg-purple-600 hover:bg-purple-700"
        onClick={() => window.open("https://sides.pa.gov", "_blank")}>
        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
        Respond in SIDES
      </Button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────

export default function UnemploymentClaimDetail() {
  const pathParts = window.location.pathname.split("/");
  const claimId = Number(pathParts[pathParts.length - 1]);

  const { data: claim, isLoading } = trpc.claims.uc.getById.useQuery(
    { id: claimId },
    { enabled: !isNaN(claimId) }
  );
  const { data: responseData } = trpc.claims.uc.prepareResponse.useQuery(
    { id: claimId },
    { enabled: !isNaN(claimId) }
  );

  const utils = trpc.useUtils();
  const updateMutation = trpc.claims.uc.update.useMutation({
    onSuccess: () => utils.claims.uc.getById.invalidate({ id: claimId }),
  });

  const [contestClaim, setContestClaim] = useState<boolean | undefined>(undefined);
  const [contestReason, setContestReason] = useState("");
  const [copied, setCopied] = useState(false);

  // Initialize contest state from claim data
  if (claim && contestClaim === undefined && claim.contestClaim !== null) {
    setContestClaim(claim.contestClaim ?? false);
  }

  function handleCopyResponse() {
    if (!responseData) return;
    const text = [
      `SIDES E-Response — ${claim?.claimNumber || ""}`,
      ``,
      `CLAIMANT INFORMATION`,
      `Name: ${responseData.claimantName || ""}`,
      `SSN Last 4: ${responseData.claimantSSNLast4 || ""}`,
      `Hire Date: ${responseData.hireDate || ""}`,
      `Separation Date: ${responseData.separationDate || ""}`,
      `Last Day Worked: ${responseData.lastDayWorked || ""}`,
      `Job Title: ${responseData.jobTitle || ""}`,
      ``,
      `SEPARATION INFORMATION`,
      `Reason: ${responseData.separationReason ? formatSeparation(responseData.separationReason) : ""}`,
      `Details: ${responseData.separationDetails || ""}`,
      ``,
      `WAGE INFORMATION`,
      `Final Wage Rate: ${responseData.finalWageRate ? `$${responseData.finalWageRate}` : ""}`,
      `Average Weekly Wage: ${responseData.averageWeeklyWage ? `$${responseData.averageWeeklyWage}` : ""}`,
      ``,
      `CONTEST DECISION`,
      `Contest: ${contestClaim ? "YES" : "NO"}`,
      contestReason ? `Reason: ${contestReason}` : "",
    ].filter(Boolean).join("\n");

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isLoading || !claim) {
    return (
      <AppShell title="Unemployment Claim">
        <div className="space-y-4 max-w-[1200px]">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AppShell>
    );
  }

  const statusStyles: Record<string, string> = {
    new: "bg-red-500/10 text-red-700 dark:text-red-400",
    response_pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    responded: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    determination_pending: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    determined: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    appealed: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    hearing_scheduled: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    closed: "bg-muted text-muted-foreground",
  };

  return (
    <AppShell
      title={`UC Claim: ${claim.claimNumber || `#${claim.id}`}`}
      actions={
        <Button variant="outline" size="sm" onClick={() => window.location.href = "/compliance/claims"}>
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
        </Button>
      }
    >
      <div className="space-y-4 max-w-[1200px]">
        {/* Header */}
        <Card className="bg-card shadow-sm p-5">
          <div className="flex items-center gap-3">
            <Briefcase className="h-6 w-6 text-purple-500" />
            <h2 className="text-lg font-bold">{claim.claimantName || "Unknown Claimant"}</h2>
            <Badge className={`text-xs ${statusStyles[claim.status ?? ""] || "bg-muted"}`}>
              {(claim.status ?? "").replace(/_/g, " ").toUpperCase()}
            </Badge>
          </div>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            {claim.claimNumber && <span>Claim #: {claim.claimNumber}</span>}
            {claim.sidesRequestId && <span>SIDES ID: {claim.sidesRequestId}</span>}
            {claim.separationDate && <span>Separated: {String(claim.separationDate)}</span>}
          </div>
        </Card>

        {/* Deadline Banner */}
        <DeadlineBanner claim={claim} />

        {/* Tabs */}
        <Tabs defaultValue="response">
          <TabsList>
            <TabsTrigger value="response">Response Prep</TabsTrigger>
            <TabsTrigger value="separation">Separation Details</TabsTrigger>
            <TabsTrigger value="determination">Determination & Appeal</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Response Prep Tab */}
          <TabsContent value="response" className="space-y-4 mt-4">
            {/* Claimant Info (Read-Only) */}
            <Card className="bg-card p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Claimant Information (from Employee Record)
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">Name:</span><p className="font-medium">{responseData?.claimantName || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">SSN Last 4:</span><p className="font-medium">{responseData?.claimantSSNLast4 || "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Hire Date:</span><p className="font-medium">{responseData?.hireDate ? String(responseData.hireDate) : "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Separation Date:</span><p className="font-medium">{responseData?.separationDate ? String(responseData.separationDate) : "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Last Day Worked:</span><p className="font-medium">{responseData?.lastDayWorked ? String(responseData.lastDayWorked) : "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Job Title:</span><p className="font-medium">{responseData?.jobTitle || "—"}</p></div>
              </div>
            </Card>

            {/* Wage Info */}
            <Card className="bg-card p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Wage Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground text-xs">Final Wage Rate:</span>
                  <p className="font-medium">{responseData?.finalWageRate ? `$${Number(responseData.finalWageRate).toFixed(2)}/hr` : "—"}</p></div>
                <div><span className="text-muted-foreground text-xs">Average Weekly Wage:</span>
                  <p className="font-medium">{responseData?.averageWeeklyWage ? `$${Number(responseData.averageWeeklyWage).toFixed(2)}` : "—"}</p></div>
              </div>
            </Card>

            {/* Contest Decision */}
            <Card className="bg-card p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Contest Decision</h4>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Switch checked={contestClaim ?? false} onCheckedChange={setContestClaim} />
                  <Label className="text-sm font-semibold">{contestClaim ? "Contest Claim" : "Don't Contest"}</Label>
                </div>
                {claim.separationReason && (
                  <p className="text-xs text-muted-foreground">
                    Separation reason: <strong>{formatSeparation(claim.separationReason)}</strong>
                    {["misconduct", "policy_violation", "attendance", "abandonment"].includes(claim.separationReason)
                      ? " — Generally contestable"
                      : ["voluntary_quit"].includes(claim.separationReason)
                        ? " — Usually contestable"
                        : " — May not be contestable"}
                  </p>
                )}
              </div>
              {contestClaim && (
                <Textarea value={contestReason} onChange={(e) => setContestReason(e.target.value)}
                  placeholder="Reason for contesting (e.g., employee was terminated for documented misconduct)..."
                  className="min-h-[80px]" />
              )}
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleCopyResponse} className="flex-1">
                {copied ? <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-500" /> : <Copy className="h-4 w-4 mr-1.5" />}
                {copied ? "Copied!" : "Copy Response to Clipboard"}
              </Button>
              <Button className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={() => window.open("https://sides.pa.gov", "_blank")}>
                <ExternalLink className="h-4 w-4 mr-1.5" />
                Respond in SIDES
              </Button>
            </div>

            {/* Mark as Submitted */}
            {!claim.responseSubmittedDate && (
              <Button variant="outline" className="w-full border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                onClick={() => updateMutation.mutate({
                  id: claimId,
                  responseSubmittedDate: new Date().toISOString().split("T")[0],
                  status: "responded",
                  contestClaim: contestClaim ?? false,
                  contestReason: contestReason || undefined,
                })}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Mark Response as Submitted
              </Button>
            )}
          </TabsContent>

          {/* Separation Details Tab */}
          <TabsContent value="separation" className="space-y-4 mt-4">
            <Card className="bg-card p-5">
              <div className="space-y-4">
                <div>
                  <Label className="text-xs">Separation Reason</Label>
                  <Select value={claim.separationReason ?? ""} onValueChange={(v) => updateMutation.mutate({ id: claimId, separationReason: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      {["voluntary_quit", "involuntary_termination", "layoff", "reduction_in_force",
                        "mutual_agreement", "end_of_assignment", "abandonment", "misconduct",
                        "poor_performance", "attendance", "policy_violation", "other"].map((r) => (
                          <SelectItem key={r} value={r}>{formatSeparation(r)}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Detailed Explanation</Label>
                  <Textarea defaultValue={claim.separationDetails ?? ""} className="mt-1 min-h-[120px]"
                    placeholder="Provide detailed explanation for the separation..."
                    onBlur={(e) => updateMutation.mutate({ id: claimId, separationDetails: e.target.value })} />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Determination & Appeal Tab */}
          <TabsContent value="determination" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Determination</h4>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Outcome</Label>
                    <Select value={claim.determination ?? ""} onValueChange={(v) => updateMutation.mutate({ id: claimId, determination: v, status: "determined" })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="denied">Denied</SelectItem>
                        <SelectItem value="partially_approved">Partially Approved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Weekly Benefit Amount</Label>
                    <Input type="number" step="0.01" defaultValue={claim.weeklyBenefitAmount ?? ""}
                      className="mt-1" placeholder="$0.00"
                      onBlur={(e) => updateMutation.mutate({ id: claimId, weeklyBenefitAmount: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Estimated Cost to Employer</Label>
                    <Input type="number" step="0.01" defaultValue={claim.estimatedCostToEmployer ?? ""}
                      className="mt-1" placeholder="$0.00"
                      onBlur={(e) => updateMutation.mutate({ id: claimId, estimatedCostToEmployer: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={claim.chargedToAccount ?? false}
                      onCheckedChange={(v) => updateMutation.mutate({ id: claimId, chargedToAccount: v })} />
                    <Label className="text-xs">Charged to Account</Label>
                  </div>
                </div>
              </Card>

              <Card className="bg-card p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Appeal</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={claim.appealFiled ?? false}
                      onCheckedChange={(v) => updateMutation.mutate({ id: claimId, appealFiled: v, status: v ? "appealed" : (claim.status ?? undefined) })} />
                    <Label className="text-xs font-medium">Appeal Filed</Label>
                  </div>
                  {claim.appealFiled && (
                    <>
                      <div>
                        <Label className="text-xs">Appeal Deadline</Label>
                        <Input type="date" defaultValue={claim.appealDeadline ? String(claim.appealDeadline) : ""} className="mt-1"
                          onBlur={(e) => updateMutation.mutate({ id: claimId, appealDeadline: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Hearing Date</Label>
                        <Input type="datetime-local" defaultValue={claim.hearingDate ? new Date(claim.hearingDate).toISOString().slice(0, 16) : ""} className="mt-1"
                          onBlur={(e) => updateMutation.mutate({ id: claimId, hearingDate: e.target.value, status: "hearing_scheduled" })} />
                      </div>
                      <div>
                        <Label className="text-xs">Appeal Outcome</Label>
                        <Select value={claim.appealOutcome ?? ""} onValueChange={(v) => updateMutation.mutate({ id: claimId, appealOutcome: v })}>
                          <SelectTrigger className="mt-1"><SelectValue placeholder="Pending..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="upheld">Upheld</SelectItem>
                            <SelectItem value="reversed">Reversed</SelectItem>
                            <SelectItem value="modified">Modified</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-4 mt-4">
            <Card className="bg-card p-5">
              {(claim.documents || []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {(claim.documents || []).map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{doc.fileName}</p>
                          <Badge variant="outline" className="text-[9px]">
                            {(doc.documentType ?? "").replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
