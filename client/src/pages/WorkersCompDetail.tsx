import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  HardHat, ArrowLeft, CheckCircle2, Clock, CircleDot, XCircle,
  ExternalLink, Phone, Mail, Loader2, Plus, FileText, DollarSign,
  User, Building, Calendar, Stethoscope,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

// ── Deadline Stepper ──────────────────────────────────────────────

function DeadlineStepper({ claim }: { claim: any }) {
  const now = new Date();

  const steps = [
    { label: "Injury Reported", date: claim.employerNotifiedDate, done: !!claim.employerNotifiedDate },
    {
      label: "FROI Due", date: claim.froiDeadline,
      done: !!claim.froiFiledDate,
      completedDate: claim.froiFiledDate,
      doneLabel: "Filed",
    },
    { label: "Carrier Notified", date: claim.carrierNotifiedDate, done: !!claim.carrierNotifiedDate },
    {
      label: "Carrier Decision", date: claim.carrierResponseDeadline,
      done: !!claim.carrierDecisionDate,
      completedDate: claim.carrierDecisionDate,
      doneLabel: claim.carrierDecision || "Decided",
    },
    { label: "Return to Work", date: claim.returnToWorkDate, done: !!claim.returnToWorkDate },
    { label: "Closed", date: claim.claimClosedDate, done: claim.status === "closed" },
  ];

  return (
    <div className="flex items-start gap-0 overflow-x-auto py-2">
      {steps.map((step, i) => {
        const deadline = step.date ? new Date(step.date) : null;
        const isOverdue = !step.done && deadline && deadline < now;
        const isApproaching = !step.done && deadline && !isOverdue &&
          (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 3;

        const bgColor = step.done
          ? "bg-emerald-500/10 border-emerald-500/30"
          : isOverdue
            ? "bg-red-500/10 border-red-500/30"
            : isApproaching
              ? "bg-amber-500/10 border-amber-500/30"
              : "bg-muted/50 border-border";

        return (
          <div key={step.label} className="flex items-center">
            <div className={`flex flex-col items-center p-2.5 rounded-lg border ${bgColor} min-w-[110px]`}>
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : isOverdue ? (
                <XCircle className="h-4 w-4 text-red-500" />
              ) : isApproaching ? (
                <Clock className="h-4 w-4 text-amber-500" />
              ) : (
                <CircleDot className="h-4 w-4 text-muted-foreground" />
              )}
              <p className="text-[10px] font-semibold mt-1 text-center text-foreground">{step.label}</p>
              {deadline && (
                <p className="text-[9px] text-muted-foreground">
                  {deadline.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              )}
              {step.done && step.doneLabel && (
                <Badge className="mt-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[8px]">
                  {step.doneLabel}
                </Badge>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-3 h-0.5 ${step.done ? "bg-emerald-400" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────

export default function WorkersCompDetail() {
  // Extract ID from URL
  const pathParts = window.location.pathname.split("/");
  const claimId = Number(pathParts[pathParts.length - 1]);

  const { data: claim, isLoading } = trpc.claims.wc.getById.useQuery(
    { id: claimId },
    { enabled: !isNaN(claimId) }
  );

  const utils = trpc.useUtils();
  const updateMutation = trpc.claims.wc.update.useMutation({
    onSuccess: () => utils.claims.wc.getById.invalidate({ id: claimId }),
  });
  const addNoteMutation = trpc.claims.wc.addNote.useMutation({
    onSuccess: () => {
      utils.claims.wc.getById.invalidate({ id: claimId });
      setNoteContent("");
    },
  });

  const [noteType, setNoteType] = useState("status_update");
  const [noteContent, setNoteContent] = useState("");

  if (isLoading || !claim) {
    return (
      <AppShell title="Workers' Comp Claim">
        <div className="space-y-4 max-w-[1200px]">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </AppShell>
    );
  }

  const employeeName = claim.notes?.[0] ? "" : ""; // Notes are attached to claim
  const statusStyles: Record<string, string> = {
    reported: "bg-red-500/10 text-red-700 dark:text-red-400",
    froi_pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    froi_filed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
    carrier_reviewing: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
    accepted: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    denied: "bg-red-500/10 text-red-700 dark:text-red-400",
    closed: "bg-muted text-muted-foreground",
  };

  return (
    <AppShell
      title={`WC Claim: ${claim.carebaseClaimNumber || `#${claim.id}`}`}
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.location.href = "/compliance/claims"}>
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
          </Button>
          <Button size="sm" className="bg-orange-600 hover:bg-orange-700"
            onClick={() => window.open("https://www.wcais.pa.gov", "_blank")}>
            <ExternalLink className="h-4 w-4 mr-1.5" /> File FROI in WCAIS
          </Button>
        </div>
      }
    >
      <div className="space-y-4 max-w-[1200px]">
        {/* Header */}
        <Card className="bg-card shadow-sm p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <HardHat className="h-6 w-6 text-orange-500" />
                <h2 className="text-lg font-bold text-foreground">{claim.carebaseClaimNumber}</h2>
                <Badge className={`text-xs ${statusStyles[claim.status ?? ""] || "bg-muted"}`}>
                  {(claim.status ?? "").replace(/_/g, " ").toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                {claim.wcaisClaimNumber && <span>WCAIS: {claim.wcaisClaimNumber}</span>}
                {claim.carrierClaimNumber && <span>Carrier: {claim.carrierClaimNumber}</span>}
                <span>Injury: {claim.injuryDate ? new Date(claim.injuryDate).toLocaleDateString() : "—"}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Deadline Stepper */}
        <Card className="bg-card shadow-sm p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Claim Timeline</h3>
          <DeadlineStepper claim={claim} />
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="injury">Injury Details</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Injury Summary */}
              <Card className="bg-card p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Injury Summary</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground">Description:</span> <span className="font-medium">{claim.injuryDescription || "—"}</span></div>
                  <div><span className="text-muted-foreground">Body Part:</span> <span className="font-medium">{claim.bodyPartAffected || "—"}</span></div>
                  <div><span className="text-muted-foreground">Nature:</span> <span className="font-medium">{claim.natureOfInjury || "—"}</span></div>
                  <div><span className="text-muted-foreground">Cause:</span> <span className="font-medium">{claim.causeOfInjury || "—"}</span></div>
                  <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{claim.locationOfInjury || "—"}</span></div>
                </div>
              </Card>

              {/* Employment Context */}
              <Card className="bg-card p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Employment at Injury</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground">Job Title:</span> <span className="font-medium">{claim.jobTitleAtInjury || "—"}</span></div>
                  <div><span className="text-muted-foreground">Wage:</span> <span className="font-medium">{claim.wageAtInjury ? `$${Number(claim.wageAtInjury).toFixed(2)}/hr` : "—"}</span></div>
                  <div><span className="text-muted-foreground">Hours/Week:</span> <span className="font-medium">{claim.hoursPerWeek || "—"}</span></div>
                </div>
              </Card>

              {/* Carrier Info */}
              <Card className="bg-card p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Carrier / Adjuster</h4>
                <div className="space-y-2 text-sm">
                  <div><span className="text-muted-foreground">Adjuster:</span> <span className="font-medium">{claim.adjusterName || "—"}</span></div>
                  {claim.adjusterPhone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <a href={`tel:${claim.adjusterPhone}`} className="text-blue-600 dark:text-blue-400 underline text-xs">{claim.adjusterPhone}</a>
                    </div>
                  )}
                  {claim.adjusterEmail && (
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-muted-foreground" />
                      <a href={`mailto:${claim.adjusterEmail}`} className="text-blue-600 dark:text-blue-400 underline text-xs">{claim.adjusterEmail}</a>
                    </div>
                  )}
                  <div><span className="text-muted-foreground">Decision:</span> <span className="font-medium">{claim.carrierDecision ? claim.carrierDecision.replace(/_/g, " ") : "Pending"}</span></div>
                  {claim.noticeType && <div><span className="text-muted-foreground">Notice:</span> <span className="font-medium">{claim.noticeType}</span></div>}
                </div>
              </Card>
            </div>

            {/* Status Update */}
            <Card className="bg-card p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Update Claim</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">WCAIS Claim #</Label>
                  <Input defaultValue={claim.wcaisClaimNumber ?? ""} placeholder="PA WCAIS #" className="mt-1"
                    onBlur={(e) => { if (e.target.value !== (claim.wcaisClaimNumber ?? "")) updateMutation.mutate({ id: claimId, wcaisClaimNumber: e.target.value }); }} />
                </div>
                <div>
                  <Label className="text-xs">Carrier Claim #</Label>
                  <Input defaultValue={claim.carrierClaimNumber ?? ""} placeholder="Carrier #" className="mt-1"
                    onBlur={(e) => { if (e.target.value !== (claim.carrierClaimNumber ?? "")) updateMutation.mutate({ id: claimId, carrierClaimNumber: e.target.value }); }} />
                </div>
                <div>
                  <Label className="text-xs">Adjuster Name</Label>
                  <Input defaultValue={claim.adjusterName ?? ""} placeholder="Name" className="mt-1"
                    onBlur={(e) => { if (e.target.value !== (claim.adjusterName ?? "")) updateMutation.mutate({ id: claimId, adjusterName: e.target.value }); }} />
                </div>
                <div>
                  <Label className="text-xs">Adjuster Phone</Label>
                  <Input defaultValue={claim.adjusterPhone ?? ""} placeholder="Phone" className="mt-1"
                    onBlur={(e) => { if (e.target.value !== (claim.adjusterPhone ?? "")) updateMutation.mutate({ id: claimId, adjusterPhone: e.target.value }); }} />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-muted-foreground">Status:</span>
                {["froi_pending", "froi_filed", "carrier_reviewing", "accepted", "denied", "closed"].map((s) => (
                  <Button key={s} variant="outline" size="sm" className="text-[10px] h-6"
                    disabled={claim.status === s || updateMutation.isPending}
                    onClick={() => updateMutation.mutate({ id: claimId, status: s })}>
                    {s.replace(/_/g, " ")}
                  </Button>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="injury" className="space-y-4 mt-4">
            <Card className="bg-card p-5">
              <h4 className="text-sm font-semibold mb-3">Injury Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label className="text-xs">Body Part Affected</Label>
                  <Input defaultValue={claim.bodyPartAffected ?? ""} className="mt-1"
                    onBlur={(e) => updateMutation.mutate({ id: claimId, bodyPartAffected: e.target.value })} /></div>
                <div><Label className="text-xs">Nature of Injury</Label>
                  <Input defaultValue={claim.natureOfInjury ?? ""} className="mt-1"
                    onBlur={(e) => updateMutation.mutate({ id: claimId, natureOfInjury: e.target.value })} /></div>
                <div><Label className="text-xs">Cause of Injury</Label>
                  <Input defaultValue={claim.causeOfInjury ?? ""} className="mt-1"
                    onBlur={(e) => updateMutation.mutate({ id: claimId, causeOfInjury: e.target.value })} /></div>
                <div><Label className="text-xs">Location</Label>
                  <Input defaultValue={claim.locationOfInjury ?? ""} className="mt-1"
                    onBlur={(e) => updateMutation.mutate({ id: claimId, locationOfInjury: e.target.value })} /></div>
              </div>
              <div className="mt-4"><Label className="text-xs">Full Description</Label>
                <Textarea defaultValue={claim.injuryDescription ?? ""} className="mt-1 min-h-[100px]"
                  onBlur={(e) => updateMutation.mutate({ id: claimId, injuryDescription: e.target.value })} /></div>
            </Card>
          </TabsContent>

          <TabsContent value="medical" className="space-y-4 mt-4">
            <Card className="bg-card p-5">
              <h4 className="text-sm font-semibold mb-3">Medical Treatment</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label className="text-xs">Treating Physician</Label>
                  <Input defaultValue={claim.treatingPhysician ?? ""} className="mt-1"
                    onBlur={(e) => updateMutation.mutate({ id: claimId, treatingPhysician: e.target.value })} /></div>
                <div><Label className="text-xs">Treating Facility</Label>
                  <Input defaultValue={claim.treatingFacility ?? ""} className="mt-1"
                    onBlur={(e) => updateMutation.mutate({ id: claimId, treatingFacility: e.target.value })} /></div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Medical Paid</p>
                <p className="text-xl font-bold tabular-nums mt-1">{claim.totalMedicalPaid ? `$${Number(claim.totalMedicalPaid).toLocaleString()}` : "$0"}</p>
              </Card>
              <Card className="bg-card p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Indemnity Paid</p>
                <p className="text-xl font-bold tabular-nums mt-1">{claim.totalIndemnityPaid ? `$${Number(claim.totalIndemnityPaid).toLocaleString()}` : "$0"}</p>
              </Card>
              <Card className="bg-card p-4">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Reserve Amount</p>
                <p className="text-xl font-bold tabular-nums mt-1">{claim.reserveAmount ? `$${Number(claim.reserveAmount).toLocaleString()}` : "$0"}</p>
              </Card>
            </div>
            <Card className="bg-card p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Update Financials</h4>
              <div className="grid grid-cols-3 gap-3">
                <div><Label className="text-xs">Medical Paid</Label>
                  <Input type="number" step="0.01" defaultValue={claim.totalMedicalPaid ?? ""} className="mt-1"
                    onBlur={(e) => updateMutation.mutate({ id: claimId, totalMedicalPaid: e.target.value })} /></div>
                <div><Label className="text-xs">Indemnity Paid</Label>
                  <Input type="number" step="0.01" defaultValue={claim.totalIndemnityPaid ?? ""} className="mt-1"
                    onBlur={(e) => updateMutation.mutate({ id: claimId, totalIndemnityPaid: e.target.value })} /></div>
                <div><Label className="text-xs">Reserve Amount</Label>
                  <Input type="number" step="0.01" defaultValue={claim.reserveAmount ?? ""} className="mt-1"
                    onBlur={(e) => updateMutation.mutate({ id: claimId, reserveAmount: e.target.value })} /></div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4 mt-4">
            {/* Add Note */}
            <Card className="bg-card p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Add Note</h4>
              <div className="space-y-3">
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status_update">Status Update</SelectItem>
                    <SelectItem value="medical_update">Medical Update</SelectItem>
                    <SelectItem value="adjuster_contact">Adjuster Contact</SelectItem>
                    <SelectItem value="return_to_work">Return to Work</SelectItem>
                    <SelectItem value="internal_note">Internal Note</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Enter note..." className="min-h-[80px]" />
                <Button size="sm" disabled={!noteContent || addNoteMutation.isPending}
                  onClick={() => addNoteMutation.mutate({ claimId, noteType: noteType as any, content: noteContent })}>
                  {addNoteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                  Add Note
                </Button>
              </div>
            </Card>

            {/* Notes List */}
            {(claim.notes || []).length === 0 ? (
              <Card className="bg-card p-8 text-center">
                <p className="text-muted-foreground text-sm">No notes yet.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {(claim.notes || []).map((note: any) => (
                  <Card key={note.id} className="bg-card p-3">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="text-[9px]">
                        {(note.noteType ?? "").replace(/_/g, " ")}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {note.createdAt ? new Date(note.createdAt).toLocaleString() : ""}
                      </span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
