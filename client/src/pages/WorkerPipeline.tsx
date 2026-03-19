import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Plus, User, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const SERVICE_LINE_COLORS: Record<string, string> = {
  OLTL: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  ODP: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Skilled: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
};

type Worker = {
  id: number;
  name: string;
  role: string;
  serviceLine: string;
  daysInPhase: number;
  gateProgress: number; // out of 8
  nextAction: string;
  stuck: boolean;
  expiring: boolean;
};

const COLUMNS: { name: string; phase: string; workers: Worker[] }[] = [
  {
    name: "Applied", phase: "Intake",
    workers: [
      { id: 1, name: "Jasmine Carter", role: "PCA", serviceLine: "OLTL", daysInPhase: 2, gateProgress: 0, nextAction: "Review application", stuck: false, expiring: false },
      { id: 2, name: "David Kim", role: "DSP", serviceLine: "ODP", daysInPhase: 1, gateProgress: 0, nextAction: "Review application", stuck: false, expiring: false },
      { id: 3, name: "Rosa Martinez", role: "HHA", serviceLine: "OLTL", daysInPhase: 4, gateProgress: 1, nextAction: "Send DocuSign packet", stuck: false, expiring: false },
    ],
  },
  {
    name: "Documents", phase: "Documentation",
    workers: [
      { id: 4, name: "Marcus Johnson", role: "PCA", serviceLine: "OLTL", daysInPhase: 6, gateProgress: 2, nextAction: "Awaiting DocuSign", stuck: false, expiring: false },
      { id: 5, name: "Aisha Patel", role: "LPN", serviceLine: "Skilled", daysInPhase: 9, gateProgress: 2, nextAction: "Missing I-9", stuck: true, expiring: false },
    ],
  },
  {
    name: "Clearances", phase: "Verification",
    workers: [
      { id: 6, name: "James Wilson", role: "DSP", serviceLine: "ODP", daysInPhase: 12, gateProgress: 3, nextAction: "Awaiting FBI clearance", stuck: true, expiring: false },
      { id: 7, name: "Chen Wei", role: "PCA", serviceLine: "OLTL", daysInPhase: 5, gateProgress: 3, nextAction: "ChildLine pending", stuck: false, expiring: false },
      { id: 8, name: "Fatima Ali", role: "HHA", serviceLine: "OLTL", daysInPhase: 3, gateProgress: 4, nextAction: "All clearances received", stuck: false, expiring: true },
      { id: 9, name: "Andre Brooks", role: "DSP", serviceLine: "ODP", daysInPhase: 8, gateProgress: 2, nextAction: "FBI + ChildLine pending", stuck: true, expiring: false },
    ],
  },
  {
    name: "Credentialing", phase: "Provisioning",
    workers: [
      { id: 10, name: "Sarah Thompson", role: "RN", serviceLine: "Skilled", daysInPhase: 4, gateProgress: 5, nextAction: "License verification", stuck: false, expiring: false },
      { id: 11, name: "Miguel Rodriguez", role: "PCA", serviceLine: "OLTL", daysInPhase: 2, gateProgress: 6, nextAction: "CPR cert upload", stuck: false, expiring: false },
    ],
  },
  {
    name: "Payroll/EVV", phase: "Ready to Schedule",
    workers: [
      { id: 12, name: "Lisa Park", role: "HHA", serviceLine: "OLTL", daysInPhase: 1, gateProgress: 7, nextAction: "Add to HHA Exchange", stuck: false, expiring: false },
    ],
  },
  {
    name: "Active", phase: "Active",
    workers: [
      { id: 13, name: "Maria Santos", role: "PCA", serviceLine: "OLTL", daysInPhase: 0, gateProgress: 8, nextAction: "", stuck: false, expiring: true },
    ],
  },
];

function GateBar({ progress }: { progress: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full ${
            i < progress ? "bg-emerald-500" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

export default function WorkerPipeline() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [serviceLineFilter, setServiceLineFilter] = useState("all");

  const filteredColumns = COLUMNS.map((col) => ({
    ...col,
    workers: col.workers.filter((w) => {
      const matchesSearch = !search || w.name.toLowerCase().includes(search.toLowerCase());
      const matchesLine = serviceLineFilter === "all" || w.serviceLine === serviceLineFilter;
      return matchesSearch && matchesLine;
    }),
  }));

  const totalWorkers = filteredColumns.reduce((s, c) => s + c.workers.length, 0);
  const stuckCount = filteredColumns.reduce((s, c) => s + c.workers.filter((w) => w.stuck).length, 0);

  return (
    <AppShell
      title="Worker Pipeline"
      actions={
        <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => setLocation("/employees/new")}>
          <Plus className="h-4 w-4 mr-1.5" /> New Worker
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search workers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
          <Select value={serviceLineFilter} onValueChange={setServiceLineFilter}>
            <SelectTrigger className="w-[130px] bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Lines</SelectItem>
              <SelectItem value="OLTL">OLTL</SelectItem>
              <SelectItem value="ODP">ODP</SelectItem>
              <SelectItem value="Skilled">Skilled</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-4 ml-auto text-xs text-muted-foreground">
            <span>{totalWorkers} workers</span>
            {stuckCount > 0 && (
              <span className="flex items-center gap-1 text-red-500 font-medium">
                <AlertCircle className="h-3.5 w-3.5" /> {stuckCount} stuck
              </span>
            )}
          </div>
        </div>

        {/* Kanban Board */}
        <ScrollArea className="w-full">
          <div className="flex gap-3 min-w-max pb-4">
            {filteredColumns.map((col) => (
              <div key={col.name} className="w-[240px] shrink-0">
                {/* Column Header */}
                <div className="flex items-center justify-between px-2 py-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                      {col.name}
                    </span>
                    <Badge variant="secondary" className="h-5 text-[10px] bg-muted">
                      {col.workers.length}
                    </Badge>
                  </div>
                </div>

                {/* Cards */}
                <div className="space-y-2 min-h-[300px]">
                  {col.workers.map((w) => (
                    <Card
                      key={w.id}
                      onClick={() => setLocation(`/employees/${w.id}`)}
                      className={`p-3 bg-card shadow-sm hover:shadow cursor-pointer transition-all ${
                        w.stuck
                          ? "border-l-[3px] border-l-red-400"
                          : w.expiring
                            ? "border-l-[3px] border-l-amber-400"
                            : "border-l-[3px] border-l-transparent"
                      }`}
                    >
                      {/* Name + Avatar */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-foreground truncate">{w.name}</p>
                          <p className="text-[10px] text-muted-foreground">{w.role}</p>
                        </div>
                      </div>

                      {/* Service Line + Days */}
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={`text-[9px] h-4 px-1.5 ${SERVICE_LINE_COLORS[w.serviceLine]}`}>
                          {w.serviceLine}
                        </Badge>
                        <span className={`text-[10px] tabular-nums ${w.daysInPhase > 7 ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
                          {w.daysInPhase}d
                        </span>
                      </div>

                      {/* Gate Progress */}
                      <GateBar progress={w.gateProgress} />

                      {/* Next Action */}
                      {w.nextAction && (
                        <p className="text-[10px] text-muted-foreground mt-2 leading-snug truncate">
                          {w.nextAction}
                        </p>
                      )}
                    </Card>
                  ))}

                  {col.workers.length === 0 && (
                    <div className="py-8 text-center text-xs text-muted-foreground">
                      No workers
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </AppShell>
  );
}
