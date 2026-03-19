import AppShell from "@/components/AppShell";
import StatCard from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ShieldCheck, ShieldAlert, Clock, Search, Send, Eye, Download } from "lucide-react";
import { useState } from "react";

type ClearanceStatus = "clear" | "pending" | "expiring" | "expired" | "not_started";

const STATUS_STYLES: Record<ClearanceStatus, { bg: string; label: string }> = {
  clear: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Clear" },
  pending: { bg: "bg-blue-50 text-blue-700 border-blue-200", label: "Pending" },
  expiring: { bg: "bg-amber-50 text-amber-700 border-amber-200", label: "Expiring" },
  expired: { bg: "bg-red-50 text-red-700 border-red-200", label: "Expired" },
  not_started: { bg: "bg-slate-100 text-slate-500", label: "Not Started" },
};

const MOCK_WORKERS = [
  { id: 1, name: "Maria Santos", serviceLine: "OLTL", patch: { status: "clear" as ClearanceStatus, expiry: "2029-04-15" }, fbi: { status: "expired" as ClearanceStatus, expiry: "2026-03-15" }, childline: { status: "clear" as ClearanceStatus, expiry: "2029-06-20" } },
  { id: 2, name: "Chen Wei", serviceLine: "OLTL", patch: { status: "clear" as ClearanceStatus, expiry: "2030-01-10" }, fbi: { status: "clear" as ClearanceStatus, expiry: "2030-01-10" }, childline: { status: "pending" as ClearanceStatus, expiry: null } },
  { id: 3, name: "James Wilson", serviceLine: "ODP", patch: { status: "clear" as ClearanceStatus, expiry: "2028-11-05" }, fbi: { status: "pending" as ClearanceStatus, expiry: null }, childline: { status: "clear" as ClearanceStatus, expiry: "2028-11-05" } },
  { id: 4, name: "Fatima Ali", serviceLine: "OLTL", patch: { status: "expiring" as ClearanceStatus, expiry: "2026-05-01" }, fbi: { status: "clear" as ClearanceStatus, expiry: "2029-08-15" }, childline: { status: "clear" as ClearanceStatus, expiry: "2029-08-15" } },
  { id: 5, name: "Andre Brooks", serviceLine: "ODP", patch: { status: "clear" as ClearanceStatus, expiry: "2030-02-20" }, fbi: { status: "not_started" as ClearanceStatus, expiry: null }, childline: { status: "not_started" as ClearanceStatus, expiry: null } },
  { id: 6, name: "Sarah Thompson", serviceLine: "Skilled", patch: { status: "clear" as ClearanceStatus, expiry: "2029-10-01" }, fbi: { status: "clear" as ClearanceStatus, expiry: "2029-10-01" }, childline: { status: "clear" as ClearanceStatus, expiry: "2029-10-01" } },
  { id: 7, name: "Lisa Park", serviceLine: "OLTL", patch: { status: "clear" as ClearanceStatus, expiry: "2030-03-15" }, fbi: { status: "clear" as ClearanceStatus, expiry: "2030-03-15" }, childline: { status: "expiring" as ClearanceStatus, expiry: "2026-04-20" } },
  { id: 8, name: "Miguel Rodriguez", serviceLine: "OLTL", patch: { status: "clear" as ClearanceStatus, expiry: "2029-12-01" }, fbi: { status: "clear" as ClearanceStatus, expiry: "2029-12-01" }, childline: { status: "clear" as ClearanceStatus, expiry: "2029-12-01" } },
];

function getOverallStatus(w: typeof MOCK_WORKERS[0]): ClearanceStatus {
  const statuses = [w.patch.status, w.fbi.status, w.childline.status];
  if (statuses.includes("expired")) return "expired";
  if (statuses.includes("not_started")) return "not_started";
  if (statuses.includes("pending")) return "pending";
  if (statuses.includes("expiring")) return "expiring";
  return "clear";
}

function ClearanceCell({ status, expiry }: { status: ClearanceStatus; expiry: string | null }) {
  const s = STATUS_STYLES[status];
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Badge variant="outline" className={`text-[10px] ${s.bg}`}>{s.label}</Badge>
      {expiry && <span className="text-[10px] text-slate-400">{expiry}</span>}
    </div>
  );
}

export default function ClearanceTracker() {
  const [search, setSearch] = useState("");
  const filtered = MOCK_WORKERS.filter((w) =>
    !search || w.name.toLowerCase().includes(search.toLowerCase())
  );

  const allClear = MOCK_WORKERS.filter((w) => getOverallStatus(w) === "clear").length;
  const pending = MOCK_WORKERS.filter((w) => getOverallStatus(w) === "pending" || getOverallStatus(w) === "not_started").length;
  const expiring = MOCK_WORKERS.filter((w) => getOverallStatus(w) === "expiring").length;
  const expired = MOCK_WORKERS.filter((w) => getOverallStatus(w) === "expired").length;

  return (
    <AppShell title="Background Check Tracker">
      <div className="space-y-4 max-w-[1440px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="All Clear" value={allClear} icon={ShieldCheck} accentColor="emerald" />
          <StatCard title="Pending / Not Started" value={pending} icon={Clock} accentColor="blue" />
          <StatCard title="Expiring (60 days)" value={expiring} icon={ShieldAlert} accentColor="amber" />
          <StatCard title="Expired" value={expired} icon={ShieldAlert} accentColor="red" />
        </div>

        <Card className="bg-white shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Search workers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export CSV</Button>
          </div>
        </Card>

        <Card className="bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Worker</TableHead>
                <TableHead>Service Line</TableHead>
                <TableHead className="text-center">PA PATCH</TableHead>
                <TableHead className="text-center">FBI</TableHead>
                <TableHead className="text-center">ChildLine</TableHead>
                <TableHead className="text-center">Overall</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((w) => {
                const overall = getOverallStatus(w);
                const os = STATUS_STYLES[overall];
                return (
                  <TableRow key={w.id} className={overall === "expired" ? "bg-red-50/30" : overall === "expiring" ? "bg-amber-50/20" : ""}>
                    <TableCell className="font-medium text-sm">{w.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{w.serviceLine}</Badge>
                    </TableCell>
                    <TableCell className="text-center"><ClearanceCell status={w.patch.status} expiry={w.patch.expiry} /></TableCell>
                    <TableCell className="text-center"><ClearanceCell status={w.fbi.status} expiry={w.fbi.expiry} /></TableCell>
                    <TableCell className="text-center"><ClearanceCell status={w.childline.status} expiry={w.childline.expiry} /></TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`text-[10px] ${os.bg}`}>{os.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600"><Send className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppShell>
  );
}
