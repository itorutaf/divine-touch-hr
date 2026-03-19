import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Plus, Eye, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";

const MOCK_INCIDENTS = [
  { id: "INC-001", date: "2026-03-15", client: "Patricia Moore", category: "medication_error", severity: "major" as const, status: "investigating" as const, daysOpen: 3, scNotified: true, eimEntered: true, investigationStarted: true, investigationCompleted: false, deadline: "2026-04-14" },
  { id: "INC-002", date: "2026-03-10", client: "Robert Chen", category: "service_interruption", severity: "minor" as const, status: "resolved" as const, daysOpen: 8, scNotified: true, eimEntered: true, investigationStarted: true, investigationCompleted: true, deadline: "2026-04-09" },
  { id: "INC-003", date: "2026-03-17", client: "Helen Washington", category: "neglect", severity: "critical" as const, status: "open" as const, daysOpen: 1, scNotified: false, eimEntered: false, investigationStarted: false, investigationCompleted: false, deadline: "2026-04-16" },
  { id: "INC-004", date: "2026-02-28", client: "James Rodriguez", category: "rights_violation", severity: "minor" as const, status: "closed" as const, daysOpen: 18, scNotified: true, eimEntered: true, investigationStarted: true, investigationCompleted: true, deadline: "2026-03-30" },
];

const SEVERITY_STYLES = {
  critical: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  major: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200",
  minor: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
};

const STATUS_STYLES = {
  open: "bg-red-500/10 text-red-700 dark:text-red-400",
  investigating: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  resolved: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  closed: "bg-muted text-muted-foreground",
};

function TimelineCheck({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1" title={label}>
      {done ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </div>
  );
}

export default function IncidentReporting() {
  const [statusFilter, setStatusFilter] = useState("all");
  const filtered = MOCK_INCIDENTS.filter((i) => statusFilter === "all" || i.status === statusFilter);

  return (
    <AppShell
      title="Incident Reports"
      actions={
        <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          New Incident
        </Button>
      }
    >
      <div className="space-y-4 max-w-[1440px]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Open", count: MOCK_INCIDENTS.filter((i) => i.status === "open").length, color: "border-l-red-500" },
            { label: "Investigating", count: MOCK_INCIDENTS.filter((i) => i.status === "investigating").length, color: "border-l-blue-500" },
            { label: "Resolved", count: MOCK_INCIDENTS.filter((i) => i.status === "resolved").length, color: "border-l-emerald-500" },
            { label: "Closed", count: MOCK_INCIDENTS.filter((i) => i.status === "closed").length, color: "border-l-slate-400" },
          ].map((s) => (
            <Card key={s.label} className={`p-4 border-l-4 ${s.color} bg-card shadow-sm`}>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{s.count}</p>
            </Card>
          ))}
        </div>

        <Card className="bg-card shadow-sm p-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        <Card className="bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Days Open</TableHead>
                <TableHead className="text-center" title="SC Notified | EIM | Investigation | Complete">PA Timeline</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((inc) => (
                <TableRow key={inc.id} className={inc.status === "open" && inc.daysOpen > 0 ? "bg-red-50/20" : ""}>
                  <TableCell className="font-mono text-xs">{inc.id}</TableCell>
                  <TableCell className="text-sm">{inc.date}</TableCell>
                  <TableCell className="font-medium text-sm">{inc.client}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{inc.category.replace(/_/g, " ")}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${SEVERITY_STYLES[inc.severity]}`}>{inc.severity}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${STATUS_STYLES[inc.status]}`}>{inc.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{inc.daysOpen}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1.5">
                      <TimelineCheck done={inc.scNotified} label="SC Notified (24hr)" />
                      <TimelineCheck done={inc.eimEntered} label="EIM Entered (48hr)" />
                      <TimelineCheck done={inc.investigationStarted} label="Investigation Started (24hr)" />
                      <TimelineCheck done={inc.investigationCompleted} label="Investigation Complete (30d)" />
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{inc.deadline}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppShell>
  );
}
