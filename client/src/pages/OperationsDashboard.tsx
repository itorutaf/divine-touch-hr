import AppShell from "@/components/AppShell";
import StatCard from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Calendar, Users, AlertCircle, CheckCircle2, Clock, MapPin, Phone,
} from "lucide-react";

const TODAYS_SCHEDULE = [
  { id: 1, client: "Patricia Moore", caregiver: "Maria Santos", time: "8:00 AM - 2:00 PM", hours: 6, status: "confirmed" as const },
  { id: 2, client: "Robert Chen", caregiver: "Chen Wei", time: "9:00 AM - 5:00 PM", hours: 8, status: "confirmed" as const },
  { id: 3, client: "Helen Washington", caregiver: "Fatima Ali", time: "7:00 AM - 12:00 PM", hours: 5, status: "in_progress" as const },
  { id: 4, client: "James Rodriguez", caregiver: "Sarah Thompson", time: "10:00 AM - 1:00 PM", hours: 3, status: "confirmed" as const },
  { id: 5, client: "Dorothy Kim", caregiver: "Unassigned", time: "1:00 PM - 5:00 PM", hours: 4, status: "unassigned" as const },
];

const CALLOUTS = [
  { id: 1, caregiver: "Andre Brooks", client: "Robert Chen", shift: "Mar 18, 1:00 PM - 5:00 PM", reason: "Personal emergency", status: "needs_coverage" as const },
];

const SCHEDULE_STATUS = {
  confirmed: { bg: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", label: "Confirmed" },
  in_progress: { bg: "bg-blue-500/10 text-blue-700 dark:text-blue-400", label: "In Progress" },
  completed: { bg: "bg-muted text-muted-foreground", label: "Completed" },
  unassigned: { bg: "bg-red-500/10 text-red-700 dark:text-red-400", label: "Unassigned" },
  needs_coverage: { bg: "bg-red-500/10 text-red-700 dark:text-red-400", label: "Needs Coverage" },
};

export default function OperationsDashboard() {
  const totalVisits = TODAYS_SCHEDULE.length;
  const confirmed = TODAYS_SCHEDULE.filter((s) => s.status === "confirmed" || s.status === "in_progress").length;
  const unassigned = TODAYS_SCHEDULE.filter((s) => s.status === "unassigned").length;

  return (
    <AppShell title="Schedule Overview">
      <div className="space-y-4 max-w-[1440px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Today's Visits" value={totalVisits} icon={Calendar} accentColor="blue" />
          <StatCard title="Confirmed" value={confirmed} icon={CheckCircle2} accentColor="emerald" />
          <StatCard title="Unassigned" value={unassigned} icon={AlertCircle} accentColor="red" />
          <StatCard title="Call-Outs" value={CALLOUTS.length} icon={Phone} accentColor="amber" />
        </div>

        {/* Call-outs */}
        {CALLOUTS.length > 0 && (
          <Card className="bg-red-50/50 border-red-500/20 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-800 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" /> Active Call-Outs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {CALLOUTS.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-red-500/20">
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.caregiver} called out</p>
                    <p className="text-xs text-muted-foreground">{c.shift} — Client: {c.client}</p>
                    <p className="text-xs text-red-600 mt-0.5">{c.reason}</p>
                  </div>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Find Coverage</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Today's Schedule */}
        <Card className="bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Today's Schedule — March 18, 2026</h3>
            <Badge variant="secondary" className="text-[10px]">{totalVisits} visits</Badge>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Caregiver</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TODAYS_SCHEDULE.map((visit) => {
                const s = SCHEDULE_STATUS[visit.status];
                return (
                  <TableRow key={visit.id} className={visit.status === "unassigned" ? "bg-red-50/20" : ""}>
                    <TableCell className="font-medium text-sm">{visit.client}</TableCell>
                    <TableCell className={`text-sm ${visit.caregiver === "Unassigned" ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                      {visit.caregiver}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />{visit.time}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{visit.hours}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${s.bg}`}>{s.label}</Badge></TableCell>
                    <TableCell className="text-right">
                      {visit.status === "unassigned" ? (
                        <Button size="sm" variant="outline" className="h-7 text-xs text-emerald-600">Assign</Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="h-7 text-xs">Details</Button>
                      )}
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
