import AppShell from "@/components/AppShell";
import StatCard from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield, AlertTriangle, Clock, Plus, Eye, Search,
  HardHat, Briefcase, Calendar, ArrowRight, Download,
  Loader2, FileText, ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

// ── Style Constants ───────────────────────────────────────────────

const WC_STATUS_STYLES: Record<string, string> = {
  reported: "bg-red-500/10 text-red-700 dark:text-red-400",
  froi_pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  froi_filed: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  carrier_reviewing: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  accepted: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  denied: "bg-red-500/10 text-red-700 dark:text-red-400",
  appealed: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  modified: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  suspended: "bg-muted text-muted-foreground",
  closed: "bg-muted text-muted-foreground",
};

const UC_STATUS_STYLES: Record<string, string> = {
  new: "bg-red-500/10 text-red-700 dark:text-red-400",
  response_pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  responded: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  determination_pending: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  determined: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  appealed: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  hearing_scheduled: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
  closed: "bg-muted text-muted-foreground",
};

function formatStatus(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function daysUntil(dateStr: string | Date | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ── Create WC Claim Sheet ─────────────────────────────────────────

function CreateWCClaimSheet({ open, onOpenChange }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const { data: employees } = trpc.employees.list.useQuery();

  const createMutation = trpc.claims.wc.create.useMutation({
    onSuccess: () => {
      utils.claims.wc.list.invalidate();
      utils.claims.dashboard.getStats.invalidate();
      onOpenChange(false);
    },
  });

  const [form, setForm] = useState({
    employeeId: "",
    injuryDate: new Date().toISOString().slice(0, 16),
    injuryDescription: "",
    bodyPartAffected: "",
    causeOfInjury: "",
    locationOfInjury: "",
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HardHat className="h-5 w-5 text-orange-500" />
            New Workers' Comp Claim
          </SheetTitle>
          <SheetDescription>
            FROI deadline will be auto-calculated (injury date + 3 business days).
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div>
            <Label className="text-xs font-medium">Employee *</Label>
            <Select value={form.employeeId} onValueChange={(v) => setForm({ ...form, employeeId: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select employee..." /></SelectTrigger>
              <SelectContent>
                {(employees || []).map((e: any) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.legalFirstName} {e.legalLastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium">Injury Date & Time *</Label>
            <Input type="datetime-local" value={form.injuryDate}
              onChange={(e) => setForm({ ...form, injuryDate: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-medium">Injury Description</Label>
            <Textarea value={form.injuryDescription}
              onChange={(e) => setForm({ ...form, injuryDescription: e.target.value })}
              placeholder="Describe the injury..." className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-medium">Body Part Affected</Label>
            <Input value={form.bodyPartAffected}
              onChange={(e) => setForm({ ...form, bodyPartAffected: e.target.value })}
              placeholder="e.g., Lower back, right shoulder" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-medium">Cause of Injury</Label>
            <Input value={form.causeOfInjury}
              onChange={(e) => setForm({ ...form, causeOfInjury: e.target.value })}
              placeholder="e.g., Lifting patient, slip and fall" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-medium">Location of Injury</Label>
            <Input value={form.locationOfInjury}
              onChange={(e) => setForm({ ...form, locationOfInjury: e.target.value })}
              placeholder="e.g., Client's home, office" className="mt-1" />
          </div>
          <Button className="w-full bg-orange-600 hover:bg-orange-700" disabled={!form.employeeId || createMutation.isPending}
            onClick={() => createMutation.mutate({
              employeeId: Number(form.employeeId),
              injuryDate: new Date(form.injuryDate).toISOString(),
              injuryDescription: form.injuryDescription || undefined,
              bodyPartAffected: form.bodyPartAffected || undefined,
              causeOfInjury: form.causeOfInjury || undefined,
              locationOfInjury: form.locationOfInjury || undefined,
            })}>
            {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
            Create WC Claim
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Create UC Claim Sheet ─────────────────────────────────────────

function CreateUCClaimSheet({ open, onOpenChange }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const createMutation = trpc.claims.uc.create.useMutation({
    onSuccess: () => {
      utils.claims.uc.list.invalidate();
      utils.claims.dashboard.getStats.invalidate();
      onOpenChange(false);
    },
  });

  const [form, setForm] = useState({
    claimantName: "",
    claimNumber: "",
    sidesRequestId: "",
    claimantSSNLast4: "",
    requestReceivedDate: new Date().toISOString().slice(0, 10),
    separationReason: "",
    separationDetails: "",
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-purple-500" />
            New Unemployment Claim
          </SheetTitle>
          <SheetDescription>
            Response deadline auto-calculated (received + 10 calendar days).
            Employee records will be auto-matched by name.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div>
            <Label className="text-xs font-medium">Claimant Name *</Label>
            <Input value={form.claimantName}
              onChange={(e) => setForm({ ...form, claimantName: e.target.value })}
              placeholder="Full name from SIDES request" className="mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Claim Number</Label>
              <Input value={form.claimNumber}
                onChange={(e) => setForm({ ...form, claimNumber: e.target.value })}
                placeholder="UC claim #" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs font-medium">SSN Last 4</Label>
              <Input value={form.claimantSSNLast4} maxLength={4}
                onChange={(e) => setForm({ ...form, claimantSSNLast4: e.target.value })}
                placeholder="XXXX" className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium">Request Received Date *</Label>
            <Input type="date" value={form.requestReceivedDate}
              onChange={(e) => setForm({ ...form, requestReceivedDate: e.target.value })} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs font-medium">Separation Reason</Label>
            <Select value={form.separationReason} onValueChange={(v) => setForm({ ...form, separationReason: v })}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select reason..." /></SelectTrigger>
              <SelectContent>
                {["voluntary_quit", "involuntary_termination", "layoff", "reduction_in_force",
                  "mutual_agreement", "end_of_assignment", "abandonment", "misconduct",
                  "poor_performance", "attendance", "policy_violation", "other"].map((r) => (
                    <SelectItem key={r} value={r}>{formatStatus(r)}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs font-medium">Separation Details</Label>
            <Textarea value={form.separationDetails}
              onChange={(e) => setForm({ ...form, separationDetails: e.target.value })}
              placeholder="Details of the separation..." className="mt-1" />
          </div>
          <Button className="w-full bg-purple-600 hover:bg-purple-700" disabled={!form.claimantName || createMutation.isPending}
            onClick={() => createMutation.mutate({
              claimantName: form.claimantName,
              claimNumber: form.claimNumber || undefined,
              sidesRequestId: form.sidesRequestId || undefined,
              claimantSSNLast4: form.claimantSSNLast4 || undefined,
              requestReceivedDate: form.requestReceivedDate,
              separationReason: form.separationReason || undefined,
              separationDetails: form.separationDetails || undefined,
            })}>
            {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Plus className="h-4 w-4 mr-1.5" />}
            Create UC Claim
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────

export default function ClaimsDashboard() {
  const [claimTab, setClaimTab] = useState("all");
  const [search, setSearch] = useState("");
  const [createWCOpen, setCreateWCOpen] = useState(false);
  const [createUCOpen, setCreateUCOpen] = useState(false);

  const { data: stats, isLoading: loadingStats } = trpc.claims.dashboard.getStats.useQuery();
  const { data: deadlines } = trpc.claims.dashboard.getDeadlines.useQuery();
  const { data: wcClaims, isLoading: loadingWC } = trpc.claims.wc.list.useQuery();
  const { data: ucClaims, isLoading: loadingUC } = trpc.claims.uc.list.useQuery();

  const isLoading = loadingStats || loadingWC || loadingUC;

  // Combined claims list
  const allClaims = [
    ...(wcClaims || []).map((c: any) => ({
      ...c, type: "wc" as const,
      claimNumber: c.carebaseClaimNumber,
      employeeName: `${c.employeeFirstName || ""} ${c.employeeLastName || ""}`.trim() || "—",
      filedDate: c.createdAt,
      nextDeadline: c.froiDeadline && !c.froiFiledDate ? c.froiDeadline : c.carrierResponseDeadline,
      estCost: c.reserveAmount,
    })),
    ...(ucClaims || []).map((c: any) => ({
      ...c, type: "uc" as const,
      claimNumber: c.claimNumber || `UC-${c.id}`,
      employeeName: c.claimantName || `${c.employeeFirstName || ""} ${c.employeeLastName || ""}`.trim() || "—",
      filedDate: c.createdAt,
      nextDeadline: !c.responseSubmittedDate ? c.responseDeadline : c.appealDeadline,
      estCost: c.estimatedCostToEmployer,
    })),
  ];

  const filteredClaims = allClaims
    .filter((c) => {
      if (claimTab === "wc" && c.type !== "wc") return false;
      if (claimTab === "uc" && c.type !== "uc") return false;
      if (search) {
        const q = search.toLowerCase();
        if (!c.employeeName.toLowerCase().includes(q) && !c.claimNumber?.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Sort by next deadline ascending (urgent first)
      const aNext = a.nextDeadline ? new Date(a.nextDeadline).getTime() : Infinity;
      const bNext = b.nextDeadline ? new Date(b.nextDeadline).getTime() : Infinity;
      return aNext - bNext;
    });

  return (
    <AppShell
      title="Claims Center"
      actions={
        <div className="flex gap-2">
          <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={() => setCreateWCOpen(true)}>
            <HardHat className="h-4 w-4 mr-1.5" /> New WC Claim
          </Button>
          <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => setCreateUCOpen(true)}>
            <Briefcase className="h-4 w-4 mr-1.5" /> New UC Claim
          </Button>
        </div>
      }
    >
      <div className="space-y-4 max-w-[1440px]">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-5 bg-card"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-16" /></Card>
            ))
          ) : (
            <>
              <StatCard title="Open WC Claims" value={stats?.openWC ?? 0} icon={HardHat} accentColor="amber" />
              <StatCard title="Open UC Claims" value={stats?.openUC ?? 0} icon={Briefcase} accentColor="blue" />
              <Card className={`p-5 bg-card shadow-sm border-l-4 ${(stats?.overdueCount ?? 0) > 0 ? "border-l-red-500 bg-red-500/5" : "border-l-emerald-500"}`}>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">Overdue Responses</p>
                <p className={`text-2xl font-bold tabular-nums ${(stats?.overdueCount ?? 0) > 0 ? "text-red-600 dark:text-red-400" : "text-foreground"}`}>
                  {stats?.overdueCount ?? 0}
                </p>
              </Card>
              <StatCard title="Deadlines This Week" value={stats?.deadlinesThisWeek ?? 0} icon={Calendar} accentColor="blue" />
            </>
          )}
        </div>

        {/* Upcoming Deadlines */}
        {(deadlines || []).length > 0 && (
          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                Upcoming Deadlines (Next 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {(deadlines || []).slice(0, 8).map((d: any, i: number) => {
                  const isOverdue = d.daysRemaining < 0;
                  const isUrgent = d.daysRemaining <= 3 && d.daysRemaining >= 0;
                  return (
                    <div key={`${d.type}-${d.claimId}-${i}`}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isOverdue ? "bg-red-500/5 border-red-500/20" : isUrgent ? "bg-amber-500/5 border-amber-500/20" : "bg-card"
                      }`}>
                      <div className="flex items-center gap-3">
                        <Badge className={`text-[10px] ${d.type === "wc" ? "bg-orange-500/10 text-orange-700 dark:text-orange-400" : "bg-purple-500/10 text-purple-700 dark:text-purple-400"}`}>
                          {d.type === "wc" ? "WC" : "UC"}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{d.employeeName}</p>
                          <p className="text-xs text-muted-foreground">{d.label}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold tabular-nums ${
                          isOverdue ? "text-red-600 dark:text-red-400" : isUrgent ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                        }`}>
                          {isOverdue ? `${Math.abs(d.daysRemaining)}d overdue` : `${d.daysRemaining}d`}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(d.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search + Filter */}
        <Card className="bg-card shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by employee name or claim #..." value={search}
                onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
          </div>
        </Card>

        {/* Claims Table with Tabs */}
        <Card className="bg-card shadow-sm overflow-hidden">
          <Tabs value={claimTab} onValueChange={setClaimTab}>
            <div className="px-4 pt-3">
              <TabsList>
                <TabsTrigger value="all">All Claims</TabsTrigger>
                <TabsTrigger value="wc">Workers' Comp</TabsTrigger>
                <TabsTrigger value="uc">Unemployment</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={claimTab} className="mt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Filed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Deadline</TableHead>
                    <TableHead className="text-right">Days Until</TableHead>
                    <TableHead className="text-right">Est. Cost</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [1, 2, 3, 4].map((i) => (
                      <TableRow key={i}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredClaims.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        {search ? "No claims match your search" : "No claims found. Create one using the buttons above."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClaims.map((claim: any) => {
                      const days = daysUntil(claim.nextDeadline);
                      const statusStyles = claim.type === "wc" ? WC_STATUS_STYLES : UC_STATUS_STYLES;

                      return (
                        <TableRow key={`${claim.type}-${claim.id}`}
                          className={days !== null && days < 0 ? "bg-red-500/[0.04]" : days !== null && days <= 3 ? "bg-amber-500/[0.04]" : ""}>
                          <TableCell className="font-mono text-xs">{claim.claimNumber || "—"}</TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${claim.type === "wc" ? "bg-orange-500/10 text-orange-700 dark:text-orange-400" : "bg-purple-500/10 text-purple-700 dark:text-purple-400"}`}>
                              {claim.type === "wc" ? "WC" : "UC"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium text-sm">{claim.employeeName}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {claim.filedDate ? new Date(claim.filedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${statusStyles[claim.status ?? ""] || "bg-muted text-muted-foreground"}`}>
                              {formatStatus(claim.status ?? "unknown")}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {claim.nextDeadline ? new Date(claim.nextDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {days !== null ? (
                              <span className={days < 0 ? "text-red-600 dark:text-red-400" : days <= 3 ? "text-amber-600 dark:text-amber-400" : ""}>
                                {days < 0 ? `${Math.abs(days)}d over` : `${days}d`}
                              </span>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {claim.estCost ? `$${Number(claim.estCost).toLocaleString()}` : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => window.location.href = claim.type === "wc" ? `/compliance/claims/wc/${claim.id}` : `/compliance/claims/uc/${claim.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-orange-500/5 dark:bg-orange-500/10 border-orange-500/20 p-5">
            <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">
              <HardHat className="h-4 w-4" /> Workers' Comp Quick Reference
            </h3>
            <div className="text-xs text-orange-700 dark:text-orange-400 space-y-1">
              <p><strong>FROI deadline:</strong> 3 business days from injury date</p>
              <p><strong>Carrier response:</strong> 21 days to accept/deny</p>
              <p><strong>File FROI:</strong> <a href="https://www.wcais.pa.gov" target="_blank" rel="noopener" className="underline">wcais.pa.gov ↗</a></p>
            </div>
          </Card>
          <Card className="bg-purple-500/5 dark:bg-purple-500/10 border-purple-500/20 p-5">
            <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300 mb-2 flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Unemployment Quick Reference
            </h3>
            <div className="text-xs text-purple-700 dark:text-purple-400 space-y-1">
              <p><strong>SIDES response:</strong> 10 calendar days from request</p>
              <p><strong>Appeal deadline:</strong> 21 days from determination</p>
              <p><strong>Respond in SIDES:</strong> <a href="https://sides.pa.gov" target="_blank" rel="noopener" className="underline">sides.pa.gov ↗</a></p>
            </div>
          </Card>
        </div>
      </div>

      <CreateWCClaimSheet open={createWCOpen} onOpenChange={setCreateWCOpen} />
      <CreateUCClaimSheet open={createUCOpen} onOpenChange={setCreateUCOpen} />
    </AppShell>
  );
}
