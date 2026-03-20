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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertTriangle, Plus, Eye, Clock, CheckCircle2, XCircle, Search,
  ArrowLeft, Loader2, Download, FileText, Shield, Calendar,
  CircleDot, User, HardHat, AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

// ── Constants ─────────────────────────────────────────────────────

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  major: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
  minor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-red-500/10 text-red-700 dark:text-red-400",
  investigating: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  pending_resolution: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  resolved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  closed: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  investigating: "Investigating",
  pending_resolution: "Pending Resolution",
  resolved: "Resolved",
  closed: "Closed",
};

const CATEGORY_LABELS: Record<string, string> = {
  abuse_physical: "Physical Abuse",
  abuse_psychological: "Psychological Abuse",
  abuse_sexual: "Sexual Abuse",
  abuse_verbal: "Verbal Abuse",
  neglect: "Neglect",
  exploitation: "Exploitation",
  abandonment: "Abandonment",
  death: "Death",
  serious_injury: "Serious Injury",
  medication_error: "Medication Error",
  service_interruption: "Service Interruption",
  rights_violation: "Rights Violation",
  elopement: "Elopement",
  restraint_use: "Restraint Use",
  er_visit: "ER Visit",
  hospitalization: "Hospitalization",
  other: "Other",
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>;

// ── PA Deadline Helpers ───────────────────────────────────────────

function addBusinessHours(start: Date, hours: number): Date {
  const result = new Date(start);
  let remaining = hours;
  while (remaining > 0) {
    result.setHours(result.getHours() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) remaining--;
  }
  return result;
}

function getMilestones(inc: any) {
  const now = new Date();
  const incDate = inc.incidentDate ? new Date(inc.incidentDate) : now;

  const milestones = [
    {
      key: "scNotifiedAt",
      label: "SC Notified",
      shortLabel: "SC",
      deadline: new Date(incDate.getTime() + 24 * 60 * 60 * 1000),
      completedAt: inc.scNotifiedAt ? new Date(inc.scNotifiedAt) : null,
    },
    {
      key: "eimEnteredAt",
      label: "EIM Entered",
      shortLabel: "EIM",
      deadline: addBusinessHours(incDate, 48),
      completedAt: inc.eimEnteredAt ? new Date(inc.eimEnteredAt) : null,
    },
    {
      key: "investigationStartedAt",
      label: "Investigation Started",
      shortLabel: "Inv",
      deadline: new Date(incDate.getTime() + 24 * 60 * 60 * 1000),
      completedAt: inc.investigationStartedAt ? new Date(inc.investigationStartedAt) : null,
    },
    {
      key: "participantNotifiedAt",
      label: "Participant Notified",
      shortLabel: "Part",
      deadline: new Date(incDate.getTime() + 24 * 60 * 60 * 1000),
      completedAt: inc.participantNotifiedAt ? new Date(inc.participantNotifiedAt) : null,
    },
    {
      key: "investigationCompletedAt",
      label: "Investigation Complete",
      shortLabel: "Done",
      deadline: new Date(incDate.getTime() + 30 * 24 * 60 * 60 * 1000),
      completedAt: inc.investigationCompletedAt ? new Date(inc.investigationCompletedAt) : null,
    },
  ];

  const nextDeadline = milestones
    .filter((m) => !m.completedAt)
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())[0] || null;

  const overdueCount = milestones.filter((m) => !m.completedAt && m.deadline < now).length;

  return { milestones, nextDeadline, overdueCount };
}

function formatDeadlineCountdown(deadline: Date): string {
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  if (diffHours < 0) return `${Math.abs(diffHours)}h overdue`;
  if (diffHours < 24) return `${diffHours}h remaining`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d remaining`;
}

function daysOpen(incidentDate: string | Date | null): number {
  if (!incidentDate) return 0;
  return Math.max(0, Math.ceil((Date.now() - new Date(incidentDate).getTime()) / (1000 * 60 * 60 * 24)));
}

// ── Milestone Status Component ────────────────────────────────────

function MilestoneIcon({ completedAt, deadline }: { completedAt: Date | null; deadline: Date }) {
  const now = new Date();
  if (completedAt) return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
  if (deadline < now) return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursLeft <= 4) return <Clock className="h-3.5 w-3.5 text-amber-500" />;
  return <CircleDot className="h-3.5 w-3.5 text-muted-foreground" />;
}

// ── PA Deadline Timeline (Detail View) ────────────────────────────

function DeadlineTimeline({ incident, onMarkComplete }: {
  incident: any;
  onMarkComplete: (key: string) => void;
}) {
  const { milestones } = getMilestones(incident);
  const now = new Date();

  return (
    <Card className="bg-card shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-600" />
          PA Deadline Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-0 overflow-x-auto">
          {milestones.map((m, i) => {
            const isComplete = !!m.completedAt;
            const isOverdue = !isComplete && m.deadline < now;
            const isApproaching = !isComplete && !isOverdue && (m.deadline.getTime() - now.getTime()) / (1000 * 60 * 60) <= 4;
            const bgColor = isComplete
              ? "bg-emerald-500/10 border-emerald-500/30"
              : isOverdue
                ? "bg-red-500/10 border-red-500/30"
                : isApproaching
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-muted/50 border-border";

            return (
              <div key={m.key} className="flex items-start">
                <div className={`flex flex-col items-center p-3 rounded-lg border ${bgColor} min-w-[140px]`}>
                  <MilestoneIcon completedAt={m.completedAt} deadline={m.deadline} />
                  <p className="text-xs font-semibold mt-1.5 text-foreground text-center">{m.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {m.deadline.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </p>
                  {isComplete ? (
                    <Badge className="mt-1.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px]">
                      ✓ {m.completedAt!.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </Badge>
                  ) : isOverdue ? (
                    <Badge className="mt-1.5 bg-red-500/10 text-red-700 dark:text-red-400 text-[9px]">
                      ⚠ {formatDeadlineCountdown(m.deadline)}
                    </Badge>
                  ) : (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDeadlineCountdown(m.deadline)}
                    </p>
                  )}
                  {!isComplete && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-6 text-[10px]"
                      onClick={() => onMarkComplete(m.key)}
                    >
                      Mark Complete
                    </Button>
                  )}
                </div>
                {i < milestones.length - 1 && (
                  <div className="flex items-center h-full pt-6 px-1">
                    <div className={`w-4 h-0.5 ${isComplete ? "bg-emerald-400" : "bg-border"}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Create/Edit Slide-Over ────────────────────────────────────────

function CreateIncidentSheet({ open, onOpenChange }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const { data: clientsList } = trpc.clients.list.useQuery();
  const { data: employeesList } = trpc.employees.list.useQuery();

  const createMutation = trpc.incidents.create.useMutation({
    onSuccess: () => {
      utils.incidents.list.invalidate();
      utils.incidents.getStats.invalidate();
      onOpenChange(false);
      resetForm();
    },
  });

  const [form, setForm] = useState({
    clientId: "",
    caregiverId: "",
    category: "",
    severity: "major" as "critical" | "major" | "minor",
    incidentDate: new Date().toISOString().slice(0, 16),
    description: "",
    immediateActions: "",
    isWorkplaceInjury: false,
  });

  function resetForm() {
    setForm({
      clientId: "", caregiverId: "", category: "", severity: "major",
      incidentDate: new Date().toISOString().slice(0, 16),
      description: "", immediateActions: "", isWorkplaceInjury: false,
    });
  }

  function handleSubmit() {
    if (!form.category) return;
    createMutation.mutate({
      clientId: form.clientId ? Number(form.clientId) : undefined,
      caregiverId: form.caregiverId ? Number(form.caregiverId) : undefined,
      category: form.category as any,
      severity: form.severity,
      incidentDate: new Date(form.incidentDate).toISOString(),
      description: form.description || undefined,
      immediateActions: form.immediateActions || undefined,
      isWorkplaceInjury: form.isWorkplaceInjury,
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Report New Incident
          </SheetTitle>
          <SheetDescription>
            PA deadlines will be auto-calculated from the incident date.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Incident Date */}
          <div>
            <Label className="text-xs font-medium">Incident Date & Time *</Label>
            <Input
              type="datetime-local"
              value={form.incidentDate}
              onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
              className="mt-1"
            />
          </div>

          {/* Client Selector */}
          <div>
            <Label className="text-xs font-medium">Client</Label>
            <Select value={form.clientId} onValueChange={(v) => setForm({ ...form, clientId: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select client..." />
              </SelectTrigger>
              <SelectContent>
                {(clientsList || []).map((c: any) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.firstName} {c.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Caregiver Selector */}
          <div>
            <Label className="text-xs font-medium">Caregiver Involved</Label>
            <Select value={form.caregiverId} onValueChange={(v) => setForm({ ...form, caregiverId: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select caregiver..." />
              </SelectTrigger>
              <SelectContent>
                {(employeesList || [])
                  .filter((e: any) => e.currentPhase === "Active" || e.currentPhase === "Ready to Schedule")
                  .map((e: any) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.legalFirstName} {e.legalLastName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div>
            <Label className="text-xs font-medium">Category *</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severity */}
          <div>
            <Label className="text-xs font-medium">Severity *</Label>
            <div className="flex gap-2 mt-1.5">
              {(["critical", "major", "minor"] as const).map((sev) => (
                <button
                  key={sev}
                  onClick={() => setForm({ ...form, severity: sev })}
                  className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold capitalize transition-all ${
                    form.severity === sev
                      ? SEVERITY_STYLES[sev] + " ring-1 ring-current"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label className="text-xs font-medium">Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe what happened..."
              className="mt-1 min-h-[100px]"
            />
          </div>

          {/* Immediate Actions */}
          <div>
            <Label className="text-xs font-medium">Immediate Actions Taken</Label>
            <Textarea
              value={form.immediateActions}
              onChange={(e) => setForm({ ...form, immediateActions: e.target.value })}
              placeholder="What actions were taken immediately?"
              className="mt-1 min-h-[80px]"
            />
          </div>

          {/* Workplace Injury Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-xs font-medium">Workplace Injury?</Label>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                If yes, a Workers' Comp claim can be created after submission.
              </p>
            </div>
            <Switch
              checked={form.isWorkplaceInjury}
              onCheckedChange={(checked) => setForm({ ...form, isWorkplaceInjury: checked })}
            />
          </div>

          {form.isWorkplaceInjury && (
            <Card className="bg-amber-500/10 border-amber-500/30 p-3">
              <div className="flex items-start gap-2">
                <HardHat className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  A Workers' Compensation claim workflow will be available after this incident is saved.
                  FROI must be filed within 3 business days.
                </p>
              </div>
            </Card>
          )}

          {/* Submit */}
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSubmit}
            disabled={!form.category || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Saving...</>
            ) : (
              <><Plus className="h-4 w-4 mr-1.5" /> Report Incident</>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Incident Detail Dialog ────────────────────────────────────────

function IncidentDetailDialog({ incidentId, open, onOpenChange }: {
  incidentId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const { data: incident, isLoading } = trpc.incidents.getById.useQuery(
    { id: incidentId! },
    { enabled: !!incidentId && open }
  );

  const updateMutation = trpc.incidents.update.useMutation({
    onSuccess: () => {
      utils.incidents.getById.invalidate({ id: incidentId! });
      utils.incidents.list.invalidate();
      utils.incidents.getStats.invalidate();
    },
  });

  const [resolution, setResolution] = useState("");
  const [correctiveActions, setCorrectiveActions] = useState("");
  const [investigatorName, setInvestigatorName] = useState("");

  // Sync local state when incident loads
  if (incident && resolution === "" && incident.resolution) setResolution(incident.resolution);
  if (incident && correctiveActions === "" && incident.correctiveActions) setCorrectiveActions(incident.correctiveActions);
  if (incident && investigatorName === "" && incident.investigatorName) setInvestigatorName(incident.investigatorName);

  function handleMarkComplete(key: string) {
    if (!incidentId) return;
    updateMutation.mutate({ id: incidentId, [key]: new Date().toISOString() });
  }

  function handleStatusChange(status: string) {
    if (!incidentId) return;
    updateMutation.mutate({ id: incidentId, status: status as any });
  }

  function handleSaveResolution() {
    if (!incidentId) return;
    updateMutation.mutate({
      id: incidentId,
      resolution: resolution || undefined,
      correctiveActions: correctiveActions || undefined,
      investigatorName: investigatorName || undefined,
    });
  }

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        {isLoading || !incident ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Incident #{incident.id}
                <Badge variant="outline" className={`text-[10px] ${SEVERITY_STYLES[incident.severity]}`}>
                  {incident.severity}
                </Badge>
                <Badge className={`text-[10px] ${STATUS_STYLES[incident.status ?? "open"]}`}>
                  {STATUS_LABELS[incident.status ?? "open"]}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                {CATEGORY_LABELS[incident.category] || incident.category} — Reported{" "}
                {incident.incidentDate
                  ? new Date(incident.incidentDate).toLocaleDateString("en-US", {
                      month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
                    })
                  : "N/A"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              {/* Info Cards Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="bg-card p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Client</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {incident.clientFirstName && incident.clientLastName
                      ? `${incident.clientFirstName} ${incident.clientLastName}`
                      : "—"}
                  </p>
                </Card>
                <Card className="bg-card p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Caregiver</p>
                  <p className="text-sm font-semibold mt-0.5">
                    {incident.caregiverFirstName && incident.caregiverLastName
                      ? `${incident.caregiverFirstName} ${incident.caregiverLastName}`
                      : "—"}
                  </p>
                </Card>
                <Card className="bg-card p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Days Open</p>
                  <p className="text-sm font-semibold mt-0.5 tabular-nums">
                    {daysOpen(incident.incidentDate)}
                  </p>
                </Card>
              </div>

              {/* PA Deadline Timeline */}
              <DeadlineTimeline
                incident={incident}
                onMarkComplete={handleMarkComplete}
              />

              {/* Description */}
              {incident.description && (
                <Card className="bg-card p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{incident.description}</p>
                </Card>
              )}

              {/* Immediate Actions */}
              {incident.immediateActions && (
                <Card className="bg-card p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Immediate Actions Taken</h4>
                  <p className="text-sm text-foreground whitespace-pre-wrap">{incident.immediateActions}</p>
                </Card>
              )}

              {/* Workplace Injury Notice */}
              {incident.isWorkplaceInjury && (
                <Card className="bg-amber-500/10 border-amber-500/30 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardHat className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                        Workplace Injury — Workers' Comp Required
                      </span>
                    </div>
                    {!incident.workersCompClaimId ? (
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-700 text-xs"
                        onClick={() => {
                          onOpenChange(false);
                          navigate(`/compliance/claims?createWC=1&employeeId=${incident.caregiverId || ""}&incidentId=${incident.id}`);
                        }}
                      >
                        Create WC Claim
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs text-emerald-700 dark:text-emerald-400"
                        onClick={() => {
                          onOpenChange(false);
                          navigate(`/compliance/claims/wc/${incident.workersCompClaimId}`);
                        }}
                      >
                        WC Claim #{incident.workersCompClaimId} →
                      </Button>
                    )}
                  </div>
                </Card>
              )}

              {/* Resolution & Investigation */}
              <Card className="bg-card p-4 space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Investigation & Resolution
                </h4>
                <div>
                  <Label className="text-xs">Investigator Name</Label>
                  <Input
                    value={investigatorName}
                    onChange={(e) => setInvestigatorName(e.target.value)}
                    placeholder="Name of assigned investigator"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Resolution</Label>
                  <Textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Describe how the incident was resolved..."
                    className="mt-1 min-h-[80px]"
                  />
                </div>
                <div>
                  <Label className="text-xs">Corrective Actions</Label>
                  <Textarea
                    value={correctiveActions}
                    onChange={(e) => setCorrectiveActions(e.target.value)}
                    placeholder="What corrective actions were implemented?"
                    className="mt-1 min-h-[80px]"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveResolution}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Save Investigation Notes
                </Button>
              </Card>

              {/* Status Actions */}
              <div className="flex items-center gap-2 pt-2">
                <span className="text-xs text-muted-foreground">Update Status:</span>
                {["investigating", "pending_resolution", "resolved", "closed"].map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    disabled={incident.status === s || updateMutation.isPending}
                    onClick={() => handleStatusChange(s)}
                  >
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────

export default function IncidentReporting() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const { data: incidents, isLoading } = trpc.incidents.list.useQuery();
  const { data: stats } = trpc.incidents.getStats.useQuery();

  // Filter incidents
  const filtered = (incidents || []).filter((inc: any) => {
    if (statusFilter !== "all" && inc.status !== statusFilter) return false;
    if (categoryFilter !== "all" && inc.category !== categoryFilter) return false;
    if (severityFilter !== "all" && inc.severity !== severityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const clientName = `${inc.clientFirstName || ""} ${inc.clientLastName || ""}`.toLowerCase();
      const caregiverName = `${inc.caregiverFirstName || ""} ${inc.caregiverLastName || ""}`.toLowerCase();
      if (!clientName.includes(q) && !caregiverName.includes(q) && !String(inc.id).includes(q)) return false;
    }
    return true;
  });

  // Sort: overdue first, then by next deadline
  const sorted = [...filtered].sort((a: any, b: any) => {
    const aInfo = getMilestones(a);
    const bInfo = getMilestones(b);
    if (aInfo.overdueCount > 0 && bInfo.overdueCount === 0) return -1;
    if (aInfo.overdueCount === 0 && bInfo.overdueCount > 0) return 1;
    const aNext = aInfo.nextDeadline?.deadline?.getTime() ?? Infinity;
    const bNext = bInfo.nextDeadline?.deadline?.getTime() ?? Infinity;
    return aNext - bNext;
  });

  return (
    <AppShell
      title="Incident Reports"
      actions={
        <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Incident
        </Button>
      }
    >
      <div className="space-y-4 max-w-[1440px]">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {isLoading ? (
            [1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="p-4 bg-card">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-7 w-10" />
              </Card>
            ))
          ) : (
            <>
              <Card className="p-4 border-l-4 border-l-red-500 bg-card shadow-sm">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Open</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">{stats?.byStatus?.open ?? 0}</p>
              </Card>
              <Card className="p-4 border-l-4 border-l-blue-500 bg-card shadow-sm">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Investigating</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">{stats?.byStatus?.investigating ?? 0}</p>
              </Card>
              <Card className="p-4 border-l-4 border-l-purple-500 bg-card shadow-sm">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Pending Resolution</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">{stats?.byStatus?.pending_resolution ?? 0}</p>
              </Card>
              <Card className="p-4 border-l-4 border-l-emerald-500 bg-card shadow-sm">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Resolved</p>
                <p className="text-2xl font-bold text-foreground tabular-nums">{stats?.byStatus?.resolved ?? 0}</p>
              </Card>
              {(stats?.overdueCount ?? 0) > 0 ? (
                <Card className="p-4 border-l-4 border-l-red-600 bg-red-500/5 shadow-sm">
                  <p className="text-[10px] text-red-600 dark:text-red-400 font-medium uppercase tracking-wide">⚠ Overdue</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 tabular-nums">{stats?.overdueCount ?? 0}</p>
                </Card>
              ) : (
                <Card className="p-4 border-l-4 border-l-muted bg-card shadow-sm">
                  <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Closed</p>
                  <p className="text-2xl font-bold text-foreground tabular-nums">{stats?.byStatus?.closed ?? 0}</p>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Filter Bar */}
        <Card className="bg-card shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client, caregiver, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="investigating">Investigating</SelectItem>
                <SelectItem value="pending_resolution">Pending Resolution</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {ALL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{CATEGORY_LABELS[cat]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
          </div>
        </Card>

        {/* Incidents Table */}
        <Card className="bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Caregiver</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Days Open</TableHead>
                <TableHead className="text-center" title="SC | EIM | Investigation | Participant | Complete">
                  PA Timeline
                </TableHead>
                <TableHead>Next Deadline</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                    {search || statusFilter !== "all" || categoryFilter !== "all"
                      ? "No incidents match your filters"
                      : "No incidents reported. Click \"New Incident\" to log one."}
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((inc: any) => {
                  const { milestones, nextDeadline, overdueCount } = getMilestones(inc);
                  const rowBg = overdueCount > 0
                    ? "bg-red-500/[0.04]"
                    : nextDeadline && (nextDeadline.deadline.getTime() - Date.now()) / (1000 * 60 * 60) <= 4
                      ? "bg-amber-500/[0.04]"
                      : "";

                  return (
                    <TableRow
                      key={inc.id}
                      className={`${rowBg} cursor-pointer hover:bg-muted/50 transition-colors`}
                      onClick={() => setDetailId(inc.id)}
                    >
                      <TableCell className="font-mono text-xs">INC-{String(inc.id).padStart(3, "0")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inc.incidentDate
                          ? new Date(inc.incidentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                          : "—"}
                      </TableCell>
                      <TableCell className="font-medium text-sm">
                        {inc.clientFirstName && inc.clientLastName
                          ? `${inc.clientFirstName} ${inc.clientLastName}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inc.caregiverFirstName && inc.caregiverLastName
                          ? `${inc.caregiverFirstName} ${inc.caregiverLastName}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[inc.category] || inc.category}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${SEVERITY_STYLES[inc.severity]}`}>
                          {inc.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${STATUS_STYLES[inc.status ?? "open"]}`}>
                          {STATUS_LABELS[inc.status ?? "open"]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {daysOpen(inc.incidentDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {milestones.map((m) => (
                            <div key={m.key} title={`${m.label}: ${m.completedAt ? "Done" : formatDeadlineCountdown(m.deadline)}`}>
                              <MilestoneIcon completedAt={m.completedAt} deadline={m.deadline} />
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {nextDeadline ? (
                          <span className={
                            overdueCount > 0
                              ? "text-red-600 dark:text-red-400 font-semibold"
                              : (nextDeadline.deadline.getTime() - Date.now()) / (1000 * 60 * 60) <= 4
                                ? "text-amber-600 dark:text-amber-400 font-medium"
                                : "text-muted-foreground"
                          }>
                            {nextDeadline.label}: {formatDeadlineCountdown(nextDeadline.deadline)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 text-xs">All complete</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailId(inc.id);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {/* PA Reporting Info Card */}
        <Card className="bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20 p-5">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">PA Incident Reporting Deadlines</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-700 dark:text-blue-400">
            <div>
              <p className="font-semibold mb-1">OLTL (24-hour)</p>
              <p>Abuse, neglect, exploitation, abandonment, death, serious injury, medication errors (ER), service interruption, rights violations</p>
            </div>
            <div>
              <p className="font-semibold mb-1">ODP (24/72-hour)</p>
              <p>24hr: Abuse, neglect, deaths, serious injuries, sexual abuse, rights violations, elopements. 72hr: Medication errors, restraint use, ER visits, hospitalizations</p>
            </div>
            <div>
              <p className="font-semibold mb-1">All Programs</p>
              <p>SC notification: 24hr. EIM entry: 48hr (business days). Investigation start: 24hr. Investigation complete: 30 calendar days.</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Slide-over & Detail */}
      <CreateIncidentSheet open={createOpen} onOpenChange={setCreateOpen} />
      <IncidentDetailDialog
        incidentId={detailId}
        open={!!detailId}
        onOpenChange={(open) => { if (!open) setDetailId(null); }}
      />
    </AppShell>
  );
}
