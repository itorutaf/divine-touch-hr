import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ShieldCheck, AlertTriangle, Eye, Send } from "lucide-react";
import {
  PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";

const WEEKLY_TREND = [
  { week: "W1", rate: 88 }, { week: "W2", rate: 87 }, { week: "W3", rate: 86 },
  { week: "W4", rate: 84 }, { week: "W5", rate: 85 }, { week: "W6", rate: 83 },
  { week: "W7", rate: 82 }, { week: "W8", rate: 84 }, { week: "W9", rate: 83 },
  { week: "W10", rate: 81 }, { week: "W11", rate: 83 }, { week: "W12", rate: 84 },
  { week: "W13", rate: 83 },
];

const MOCK_CAREGIVERS = [
  { id: 1, name: "Maria Santos", totalVisits: 48, autoVerified: 40, manual: 8, manualPct: 16.7 },
  { id: 2, name: "Andre Brooks", totalVisits: 52, autoVerified: 38, manual: 14, manualPct: 26.9 },
  { id: 3, name: "Lisa Park", totalVisits: 44, autoVerified: 42, manual: 2, manualPct: 4.5 },
  { id: 4, name: "Chen Wei", totalVisits: 40, autoVerified: 35, manual: 5, manualPct: 12.5 },
  { id: 5, name: "Fatima Ali", totalVisits: 36, autoVerified: 30, manual: 6, manualPct: 16.7 },
  { id: 6, name: "Miguel Rodriguez", totalVisits: 50, autoVerified: 48, manual: 2, manualPct: 4.0 },
  { id: 7, name: "Sarah Thompson", totalVisits: 30, autoVerified: 28, manual: 2, manualPct: 6.7 },
];

const REASON_DATA = [
  { name: "GPS Failure", value: 35, color: "#EF4444" },
  { name: "Phone Issue", value: 25, color: "#F59E0B" },
  { name: "Late Clock-In", value: 20, color: "#F97316" },
  { name: "System Error", value: 12, color: "#2E75B6" },
  { name: "Other", value: 8, color: "#94a3b8" },
];

const heroRate = 83;
const heroColor = heroRate >= 85 ? "#10B981" : heroRate >= 80 ? "#F59E0B" : "#EF4444";

export default function EVVCompliance() {
  return (
    <AppShell title="EVV Compliance">
      <div className="space-y-4 max-w-[1440px]">
        {/* Hero Gauge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-white shadow-sm p-6 flex flex-col items-center justify-center">
            <p className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-2">Agency Auto-Verification Rate</p>
            <div className="relative">
              <ResponsiveContainer width={180} height={110}>
                <PieChart>
                  <Pie data={[{ value: heroRate }, { value: 100 - heroRate }]} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={60} outerRadius={85} paddingAngle={0} dataKey="value">
                    <Cell fill={heroColor} />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-x-0 bottom-2 text-center">
                <span className="text-4xl font-bold tabular-nums" style={{ color: heroColor }}>{heroRate}%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-red-500 mt-2">Below 85% PA DHS Threshold</p>
          </Card>

          <Card className="md:col-span-2 bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">13-Week Compliance Trend</h3>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={WEEKLY_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                <YAxis domain={[75, 95]} tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`${v}%`, "Rate"]} />
                <ReferenceLine y={85} stroke="#EF4444" strokeDasharray="5 5" label={{ value: "85% threshold", position: "right", fontSize: 10, fill: "#EF4444" }} />
                <Line type="monotone" dataKey="rate" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Caregiver Table + Reasons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b">
              <h3 className="text-sm font-semibold text-slate-900">Caregiver Manual Entry Rate</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Caregiver</TableHead>
                  <TableHead className="text-right">Total Visits</TableHead>
                  <TableHead className="text-right">Auto-Verified</TableHead>
                  <TableHead className="text-right">Manual</TableHead>
                  <TableHead className="text-right">Manual %</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {MOCK_CAREGIVERS.sort((a, b) => b.manualPct - a.manualPct).map((cg) => (
                  <TableRow key={cg.id} className={cg.manualPct > 15 ? "bg-red-50/20" : ""}>
                    <TableCell className="font-medium text-sm">{cg.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{cg.totalVisits}</TableCell>
                    <TableCell className="text-right tabular-nums">{cg.autoVerified}</TableCell>
                    <TableCell className="text-right tabular-nums">{cg.manual}</TableCell>
                    <TableCell className="text-right">
                      <span className={`tabular-nums font-semibold text-sm ${cg.manualPct > 15 ? "text-red-600" : "text-slate-600"}`}>
                        {cg.manualPct.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                        {cg.manualPct > 15 && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600"><Send className="h-3.5 w-3.5" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="bg-white shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Manual Entry Reasons</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={REASON_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                  {REASON_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {REASON_DATA.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-slate-600">{d.name}</span>
                  </div>
                  <span className="tabular-nums text-slate-500">{d.value}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
