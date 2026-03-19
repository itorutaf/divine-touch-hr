import AppShell from "@/components/AppShell";
import StatCard from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ShieldCheck, ShieldAlert, Clock, Search, Send, Eye, Download, Plus } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

type ClearanceStatus = "clear" | "pending" | "initiated" | "expiring" | "expired" | "not_started" | "flagged";

const STATUS_STYLES: Record<string, { bg: string; label: string }> = {
  clear: { bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20", label: "Clear" },
  pending: { bg: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20", label: "Pending" },
  initiated: { bg: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20", label: "Initiated" },
  expiring: { bg: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20", label: "Expiring" },
  expired: { bg: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20", label: "Expired" },
  flagged: { bg: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20", label: "Flagged" },
  not_started: { bg: "bg-muted text-muted-foreground", label: "Not Started" },
};

interface WorkerClearance {
  id: number;
  name: string;
  employeeId: string;
  serviceLine: string | null;
  patch: { status: string; expiry: string | null };
  fbi: { status: string; expiry: string | null };
  childline: { status: string; expiry: string | null };
}

function getOverallStatus(w: WorkerClearance): string {
  const statuses = [w.patch.status, w.fbi.status, w.childline.status];
  if (statuses.includes("flagged")) return "flagged";
  if (statuses.includes("expired")) return "expired";
  if (statuses.includes("not_started")) return "not_started";
  if (statuses.includes("pending") || statuses.includes("initiated")) return "pending";
  if (statuses.includes("expiring")) return "expiring";
  return "clear";
}

function ClearanceCell({ status, expiry }: { status: string; expiry: string | null }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.not_started;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Badge variant="outline" className={`text-[10px] ${s.bg}`}>{s.label}</Badge>
      {expiry && <span className="text-[10px] text-muted-foreground">{expiry}</span>}
    </div>
  );
}

/**
 * Derive clearance status from employee fields + clearance records.
 * Uses the employee's boolean flags (patchReceived, fbiReceived, etc.) as primary
 * and falls back to clearance table records for richer detail.
 */
function deriveWorkerClearances(
  employees: any[],
  clearancesByEmployee: Record<number, any[]>
): WorkerClearance[] {
  const today = new Date();
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

  return employees.map((emp) => {
    const clearances = clearancesByEmployee[emp.id] || [];

    function getStatus(type: string, receivedFlag: boolean, dateStr: string | null): { status: string; expiry: string | null } {
      // Check clearance table first
      const record = clearances.find((c: any) => c.type === type);
      if (record) {
        let status = record.status || "not_started";
        const expiry = record.expirationDate || null;

        // Check if expiring/expired based on dates
        if (status === "clear" && expiry) {
          const expDate = new Date(expiry);
          if (expDate < today) status = "expired";
          else if (expDate < sixtyDaysFromNow) status = "expiring";
        }

        return { status, expiry };
      }

      // Fall back to employee fields
      if (receivedFlag) {
        const expiry = dateStr ? calculateExpiry(dateStr) : null;
        if (expiry) {
          const expDate = new Date(expiry);
          if (expDate < today) return { status: "expired", expiry };
          if (expDate < sixtyDaysFromNow) return { status: "expiring", expiry };
        }
        return { status: "clear", expiry };
      }

      return { status: "not_started", expiry: null };
    }

    return {
      id: emp.id,
      name: `${emp.legalFirstName} ${emp.legalLastName}`,
      employeeId: emp.employeeId,
      serviceLine: emp.serviceLine,
      patch: getStatus("PA_PATCH", emp.patchReceived, emp.patchDate),
      fbi: getStatus("FBI", emp.fbiReceived, emp.fbiDate),
      childline: getStatus("CHILDLINE", emp.childAbuseReceived, emp.childAbuseDate),
    };
  });
}

function calculateExpiry(submissionDate: string): string | null {
  try {
    const date = new Date(submissionDate);
    date.setMonth(date.getMonth() + 60); // PA Act 153: 60-month validity
    return date.toISOString().split("T")[0];
  } catch {
    return null;
  }
}

export default function ClearanceTracker() {
  const [search, setSearch] = useState("");
  const [, navigate] = useLocation();

  // Fetch all employees and their clearances
  const { data: employees, isLoading } = trpc.employees.list.useQuery();
  const { data: expiringClearances } = trpc.clearances.getExpiring.useQuery({ daysThreshold: 60 });

  // Build clearance data from employees
  // For now, we derive from employee fields since clearance records may not exist yet
  const workers: WorkerClearance[] = employees
    ? deriveWorkerClearances(
        employees.filter((e: any) => e.currentPhase === "Active" || e.currentPhase === "Ready to Schedule" || e.currentPhase === "Provisioning"),
        {} // Will be populated when clearance records exist
      )
    : [];

  const filtered = workers.filter((w) =>
    !search || w.name.toLowerCase().includes(search.toLowerCase())
  );

  const allClear = workers.filter((w) => getOverallStatus(w) === "clear").length;
  const pending = workers.filter((w) => ["pending", "not_started"].includes(getOverallStatus(w))).length;
  const expiring = workers.filter((w) => getOverallStatus(w) === "expiring").length;
  const expired = workers.filter((w) => ["expired", "flagged"].includes(getOverallStatus(w))).length;

  return (
    <AppShell title="Background Check Tracker">
      <div className="space-y-4 max-w-[1440px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            [1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-5 bg-card">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
              </Card>
            ))
          ) : (
            <>
              <StatCard title="All Clear" value={allClear} icon={ShieldCheck} accentColor="emerald" />
              <StatCard title="Pending / Not Started" value={pending} icon={Clock} accentColor="blue" />
              <StatCard title="Expiring (60 days)" value={expiring} icon={ShieldAlert} accentColor="amber" />
              <StatCard title="Expired / Flagged" value={expired} icon={ShieldAlert} accentColor="red" />
            </>
          )}
        </div>

        <Card className="bg-card shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search workers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export CSV</Button>
          </div>
        </Card>

        <Card className="bg-card shadow-sm overflow-hidden">
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
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {search ? "No workers match your search" : "No employees in clearance-eligible phases"}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((w) => {
                  const overall = getOverallStatus(w);
                  const os = STATUS_STYLES[overall] || STATUS_STYLES.not_started;
                  return (
                    <TableRow
                      key={w.id}
                      className={`cursor-pointer hover:bg-muted/50 transition-colors ${overall === "expired" || overall === "flagged" ? "bg-red-500/[0.04]" : overall === "expiring" ? "bg-amber-500/[0.04]" : ""}`}
                      onClick={() => navigate(`/employees/${w.id}`)}
                    >
                      <TableCell className="font-medium text-sm">{w.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{w.serviceLine || "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-center"><ClearanceCell status={w.patch.status} expiry={w.patch.expiry} /></TableCell>
                      <TableCell className="text-center"><ClearanceCell status={w.fbi.status} expiry={w.fbi.expiry} /></TableCell>
                      <TableCell className="text-center"><ClearanceCell status={w.childline.status} expiry={w.childline.expiry} /></TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`text-[10px] ${os.bg}`}>{os.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); navigate(`/employees/${w.id}`); }}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppShell>
  );
}
