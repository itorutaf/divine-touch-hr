import AppShell from "@/components/AppShell";
import StatCard from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileCheck, AlertTriangle, TrendingDown, TrendingUp, Clock, Eye, RefreshCw } from "lucide-react";

const MOCK_AUTHS = [
  { id: 1, client: "Patricia Moore", mco: "UPMC CHC", serviceType: "PAS (CSLA)", authHours: 30, deliveredHours: 22, utilization: 73, startDate: "2025-10-01", endDate: "2026-09-30", daysUntilExpiry: 197 },
  { id: 2, client: "Robert Chen", mco: "AmeriHealth Caritas", serviceType: "PAS (Agency)", authHours: 40, deliveredHours: 38, utilization: 95, startDate: "2025-11-15", endDate: "2026-05-14", daysUntilExpiry: 57 },
  { id: 3, client: "Helen Washington", mco: "PA Health & Wellness", serviceType: "PAS (CSLA)", authHours: 25, deliveredHours: 27, utilization: 108, startDate: "2025-09-01", endDate: "2026-08-31", daysUntilExpiry: 166 },
  { id: 4, client: "James Rodriguez", mco: "UPMC CHC", serviceType: "RN", authHours: 15, deliveredHours: 14, utilization: 93, startDate: "2026-01-01", endDate: "2026-06-30", daysUntilExpiry: 104 },
  { id: 5, client: "Dorothy Kim", mco: "AmeriHealth Caritas", serviceType: "PAS (CSLA)", authHours: 20, deliveredHours: 10, utilization: 50, startDate: "2025-12-01", endDate: "2026-05-31", daysUntilExpiry: 74 },
  { id: 6, client: "Susan Davis", mco: "PA Health & Wellness", serviceType: "PAS (Agency)", authHours: 35, deliveredHours: 30, utilization: 86, startDate: "2025-08-01", endDate: "2026-07-31", daysUntilExpiry: 135 },
  { id: 7, client: "Michael Brown", mco: "UPMC CHC", serviceType: "PAS (CSLA)", authHours: 28, deliveredHours: 12, utilization: 43, startDate: "2026-02-01", endDate: "2026-04-15", daysUntilExpiry: 28 },
];

function getUtilColor(util: number) {
  if (util > 100) return { bar: "bg-red-500", text: "text-red-600", label: "Over" };
  if (util >= 80) return { bar: "bg-emerald-500", text: "text-emerald-600", label: "On Track" };
  return { bar: "bg-amber-500", text: "text-amber-600", label: "Under" };
}

export default function AuthorizationTracker() {
  return (
    <AppShell title="Authorization Tracker">
      <div className="space-y-4 max-w-[1440px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard title="Active Authorizations" value={MOCK_AUTHS.length} icon={FileCheck} accentColor="emerald" />
          <StatCard title="Avg Utilization" value="78%" icon={TrendingUp} accentColor="blue" trend={{ value: 3.2, direction: "up" }} />
          <StatCard title="Under-Utilized (<80%)" value="3" icon={TrendingDown} accentColor="amber" />
          <StatCard title="Over-Utilized (>100%)" value="1" icon={AlertTriangle} accentColor="red" />
          <StatCard title="Expiring < 30 Days" value="1" icon={Clock} accentColor="red" />
        </div>

        <Card className="bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>MCO</TableHead>
                <TableHead>Service</TableHead>
                <TableHead className="text-right">Auth Hrs/Wk</TableHead>
                <TableHead className="text-right">Delivered</TableHead>
                <TableHead className="w-[180px]">Utilization</TableHead>
                <TableHead>Auth Period</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_AUTHS.map((a) => {
                const u = getUtilColor(a.utilization);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium text-sm">{a.client}</TableCell>
                    <TableCell className="text-sm text-slate-600">{a.mco}</TableCell>
                    <TableCell className="text-sm text-slate-600">{a.serviceType}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{a.authHours}</TableCell>
                    <TableCell className="text-right tabular-nums">{a.deliveredHours}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Progress value={Math.min(a.utilization, 100)} className="h-2" />
                        </div>
                        <span className={`text-xs font-semibold tabular-nums w-10 text-right ${u.text}`}>
                          {a.utilization}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {a.startDate} — {a.endDate}
                    </TableCell>
                    <TableCell>
                      {a.daysUntilExpiry <= 30 ? (
                        <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px]">{a.daysUntilExpiry}d</Badge>
                      ) : a.daysUntilExpiry <= 60 ? (
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">{a.daysUntilExpiry}d</Badge>
                      ) : (
                        <span className="text-xs text-slate-400">{a.daysUntilExpiry}d</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600"><RefreshCw className="h-3.5 w-3.5" /></Button>
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
