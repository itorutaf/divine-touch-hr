import AppShell from "@/components/AppShell";
import StatCard from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ShieldCheck, ShieldAlert, Clock, Play, Download, Eye } from "lucide-react";

const MOCK_SCREENINGS = [
  { id: 1, date: "2026-03-01", workersScreened: 62, leieMatches: 0, samMatches: 0, status: "complete" as const },
  { id: 2, date: "2026-02-01", workersScreened: 58, leieMatches: 0, samMatches: 0, status: "complete" as const },
  { id: 3, date: "2026-01-01", workersScreened: 55, leieMatches: 1, samMatches: 0, status: "resolved" as const },
  { id: 4, date: "2025-12-01", workersScreened: 52, leieMatches: 0, samMatches: 0, status: "complete" as const },
  { id: 5, date: "2025-11-01", workersScreened: 49, leieMatches: 0, samMatches: 0, status: "complete" as const },
  { id: 6, date: "2025-10-01", workersScreened: 47, leieMatches: 0, samMatches: 0, status: "complete" as const },
];

const STATUS_STYLES = {
  complete: "bg-emerald-50 text-emerald-700",
  resolved: "bg-amber-50 text-amber-700",
  pending: "bg-blue-50 text-blue-700",
  match_found: "bg-red-50 text-red-700",
};

export default function LEIEScreening() {
  return (
    <AppShell
      title="LEIE/SAM Screening"
      actions={
        <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm">
          <Play className="h-4 w-4 mr-1.5" /> Run Screening Now
        </Button>
      }
    >
      <div className="space-y-4 max-w-[1440px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Last Screening" value="Mar 1, 2026" icon={Clock} accentColor="blue" subtitle="17 days ago" />
          <StatCard title="Workers Screened" value="62" icon={ShieldCheck} accentColor="emerald" />
          <StatCard title="Active Matches" value="0" icon={ShieldAlert} accentColor="emerald" />
          <StatCard title="Lifetime Matches" value="1" icon={ShieldAlert} accentColor="amber" subtitle="all resolved" />
        </div>

        {/* How it works */}
        <Card className="bg-emerald-50/50 border-emerald-200 p-5">
          <h3 className="text-sm font-semibold text-emerald-900 mb-2">Monthly OIG Compliance Screening</h3>
          <p className="text-xs text-emerald-700 leading-relaxed">
            CareBase automatically screens all active employees against the OIG LEIE (List of Excluded Individuals/Entities)
            and SAM.gov exclusion databases on the 1st of each month. Matches are flagged for immediate review.
            Penalties for employing excluded individuals can reach $100,000 per item/service plus treble damages.
          </p>
        </Card>

        {/* Screening History */}
        <Card className="bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Screening History</h3>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export Report</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Workers Screened</TableHead>
                <TableHead className="text-right">LEIE Matches</TableHead>
                <TableHead className="text-right">SAM Matches</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_SCREENINGS.map((s) => (
                <TableRow key={s.id} className={s.leieMatches > 0 || s.samMatches > 0 ? "bg-amber-50/20" : ""}>
                  <TableCell className="font-medium text-sm">{s.date}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.workersScreened}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.leieMatches > 0 ? (
                      <span className="text-red-600 font-semibold">{s.leieMatches}</span>
                    ) : (
                      <span className="text-emerald-600">0</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {s.samMatches > 0 ? (
                      <span className="text-red-600 font-semibold">{s.samMatches}</span>
                    ) : (
                      <span className="text-emerald-600">0</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${STATUS_STYLES[s.status]}`}>{s.status}</Badge>
                  </TableCell>
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
