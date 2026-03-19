import AppShell from "@/components/AppShell";
import StatCard from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Users,
  AlertCircle,
  FileWarning,
  FileSignature,
  ArrowRight,
  Clock,
  CheckCircle2,
  User,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

// ── Mock Data ────────────────────────────────────────────────────────

const PIPELINE_COLUMNS = [
  {
    name: "Intake",
    workers: [
      { id: 1, name: "Jasmine Carter", role: "PCA", serviceLine: "OLTL", daysInPhase: 2 },
      { id: 2, name: "David Kim", role: "DSP", serviceLine: "ODP", daysInPhase: 1 },
      { id: 3, name: "Rosa Martinez", role: "HHA", serviceLine: "OLTL", daysInPhase: 4 },
    ],
  },
  {
    name: "Documentation",
    workers: [
      { id: 4, name: "Marcus Johnson", role: "PCA", serviceLine: "OLTL", daysInPhase: 6 },
      { id: 5, name: "Aisha Patel", role: "LPN", serviceLine: "Skilled", daysInPhase: 9, stuck: true },
    ],
  },
  {
    name: "Clearances",
    workers: [
      { id: 6, name: "James Wilson", role: "DSP", serviceLine: "ODP", daysInPhase: 12, stuck: true },
      { id: 7, name: "Chen Wei", role: "PCA", serviceLine: "OLTL", daysInPhase: 5 },
      { id: 8, name: "Fatima Ali", role: "HHA", serviceLine: "OLTL", daysInPhase: 3 },
      { id: 9, name: "Andre Brooks", role: "DSP", serviceLine: "ODP", daysInPhase: 8, stuck: true },
    ],
  },
  {
    name: "Credentialing",
    workers: [
      { id: 10, name: "Sarah Thompson", role: "RN", serviceLine: "Skilled", daysInPhase: 4 },
      { id: 11, name: "Miguel Rodriguez", role: "PCA", serviceLine: "OLTL", daysInPhase: 2 },
    ],
  },
  {
    name: "Payroll/EVV",
    workers: [
      { id: 12, name: "Lisa Park", role: "HHA", serviceLine: "OLTL", daysInPhase: 1 },
    ],
  },
];

const ACTION_ITEMS = [
  { id: "a1", text: "Review application from Jasmine Carter", type: "review" as const, urgent: false, due: "Today" },
  { id: "a2", text: "Approve Gate 3 for Chen Wei — clearances received", type: "approve" as const, urgent: false, due: "Today" },
  { id: "a3", text: "James Wilson stuck 12 days — escalate or resolve", type: "escalate" as const, urgent: true, due: "Overdue" },
  { id: "a4", text: "Maria Santos CPR cert expires in 14 days", type: "reminder" as const, urgent: false, due: "Mar 31" },
  { id: "a5", text: "Andre Brooks has not signed employment agreement (8 days)", type: "reminder" as const, urgent: true, due: "Overdue" },
  { id: "a6", text: "Send DocuSign packet to David Kim", type: "send" as const, urgent: false, due: "Today" },
];

const ACTIVITY_LOG = [
  { id: "l1", text: "Gate 2 approved for Lisa Park", user: "Matt F.", time: "10 min ago" },
  { id: "l2", text: "FBI clearance uploaded for Fatima Ali", user: "System", time: "25 min ago" },
  { id: "l3", text: "DocuSign packet completed by Miguel Rodriguez", user: "DocuSign", time: "1 hour ago" },
  { id: "l4", text: "New application received: Rosa Martinez", user: "JotForm", time: "2 hours ago" },
  { id: "l5", text: "Gate 5 approved for Sarah Thompson", user: "Matt F.", time: "3 hours ago" },
];

const SERVICE_LINE_COLORS: Record<string, string> = {
  OLTL: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  ODP: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Skilled: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
};

const ACTION_BUTTONS: Record<string, { label: string; variant: "default" | "outline" }> = {
  review: { label: "Review", variant: "outline" },
  approve: { label: "Approve", variant: "default" },
  escalate: { label: "Escalate", variant: "default" },
  reminder: { label: "Send Reminder", variant: "outline" },
  send: { label: "Send", variant: "default" },
};

// ── Component ────────────────────────────────────────────────────────

export default function HRDashboard() {
  const { user } = useAuth();
  const { data: hrStats } = trpc.dashboardStats.hr.useQuery();
  const { data: expiringDocs } = trpc.dashboard.expiringDocumentsSummary.useQuery();

  const pipelineCount = hrStats?.pipelineCount ?? 0;
  const stuckCount = hrStats?.stuckCount ?? 0;
  const expiringCount = expiringDocs ? expiringDocs.expired + expiringDocs.expiring7Days + expiringDocs.expiring14Days + expiringDocs.expiring30Days : 0;
  const firstName = user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <AppShell title="HR Dashboard">
      <div className="space-y-6 max-w-[1440px]">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">{greeting}, {firstName}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Here's your onboarding pipeline at a glance.</p>
        </div>

        {/* Row 1: Stat Cards — REAL DATA */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Workers in Pipeline"
            value={pipelineCount}
            subtitle={`${Object.keys(hrStats?.byPhase || {}).filter(k => (hrStats?.byPhase as any)?.[k]?.length > 0).length} active phases`}
            icon={Users}
            accentColor="blue"
          />
          <StatCard
            title="Stuck > 7 Days"
            value={stuckCount}
            icon={AlertCircle}
            accentColor={stuckCount > 0 ? "red" : "emerald"}
          />
          <StatCard
            title="Expiring Documents"
            value={expiringCount}
            subtitle="within 30 days"
            icon={FileWarning}
            accentColor={expiringCount > 3 ? "red" : expiringCount > 0 ? "amber" : "emerald"}
          />
          <StatCard
            title="Pending DocuSign"
            value="—"
            subtitle="awaiting signatures"
            icon={FileSignature}
            accentColor="slate"
          />
        </div>

        {/* Row 2: Mini-Kanban + Action Items */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Mini Kanban (60%) */}
          <Card className="lg:col-span-3 bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Worker Pipeline
              </h3>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-emerald-600">
                View Full Board
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-0 min-w-max">
                {PIPELINE_COLUMNS.map((col) => (
                  <div
                    key={col.name}
                    className="w-[200px] shrink-0 border-r last:border-r-0"
                  >
                    <div className="px-3 py-2 bg-muted border-b flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        {col.name}
                      </span>
                      <Badge variant="secondary" className="h-5 text-[10px] bg-card">
                        {col.workers.length}
                      </Badge>
                    </div>
                    <div className="p-2 space-y-2 min-h-[200px]">
                      {col.workers.map((w) => (
                        <div
                          key={w.id}
                          className={`p-2.5 rounded-lg border bg-card hover:shadow-sm transition-shadow cursor-pointer ${
                            w.stuck
                              ? "border-l-4 border-l-red-400 border-t-slate-200 border-r-slate-200 border-b-slate-200"
                              : "border-border"
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                              <User className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <span className="text-[12px] font-medium text-foreground truncate">
                              {w.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={`text-[9px] h-4 px-1.5 ${
                                SERVICE_LINE_COLORS[w.serviceLine] || ""
                              }`}
                            >
                              {w.serviceLine}
                            </Badge>
                            <span
                              className={`text-[10px] ${
                                w.daysInPhase > 7
                                  ? "text-red-500 font-semibold"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {w.daysInPhase}d
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>

          {/* Action Items (40%) */}
          <Card className="lg:col-span-2 bg-card shadow-sm">
            <div className="px-5 py-3.5 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Action Items
              </h3>
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px] h-5">
                {ACTION_ITEMS.filter((a) => a.urgent).length} urgent
              </Badge>
            </div>
            <ScrollArea className="max-h-[360px]">
              <div className="divide-y divide-border">
                {ACTION_ITEMS.map((item) => {
                  const btn = ACTION_BUTTONS[item.type];
                  return (
                    <div
                      key={item.id}
                      className="px-5 py-3 flex items-start gap-3 hover:bg-muted/50"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-foreground leading-snug">
                          {item.text}
                        </p>
                        <p
                          className={`text-[11px] mt-1 ${
                            item.due === "Overdue"
                              ? "text-red-500 font-medium"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.due === "Overdue" ? "⚠ Overdue" : `Due: ${item.due}`}
                        </p>
                      </div>
                      <Button
                        variant={btn.variant}
                        size="sm"
                        className={`h-7 text-xs shrink-0 ${
                          btn.variant === "default"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : ""
                        }`}
                      >
                        {btn.label}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Row 3: Activity Log */}
        <Card className="bg-card shadow-sm">
          <div className="px-5 py-3.5 border-b">
            <h3 className="text-sm font-semibold text-foreground">
              Recent Activity
            </h3>
          </div>
          <div className="divide-y divide-border">
            {ACTIVITY_LOG.map((entry) => (
              <div
                key={entry.id}
                className="px-5 py-2.5 flex items-center gap-3"
              >
                <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <p className="text-[13px] text-muted-foreground flex-1">
                  {entry.text}
                </p>
                <span className="text-[11px] text-muted-foreground shrink-0">
                  {entry.user}
                </span>
                <span className="text-[11px] text-muted-foreground shrink-0 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {entry.time}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
