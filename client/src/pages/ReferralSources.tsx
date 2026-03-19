import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, TrendingUp, Users, DollarSign, ArrowUpRight } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const MOCK_SOURCES = [
  { id: 1, name: "Temple University Hospital", type: "Hospital", totalReferrals: 12, activeClients: 8, avgMargin: 41, avgScore: 76, totalRevenue: 18400 },
  { id: 2, name: "UPMC CHC - Lisa Chen (SC)", type: "MCO/SC", totalReferrals: 9, activeClients: 7, avgMargin: 38, avgScore: 72, totalRevenue: 15200 },
  { id: 3, name: "AmeriHealth Caritas - David Park", type: "MCO/SC", totalReferrals: 7, activeClients: 5, avgMargin: 43, avgScore: 81, totalRevenue: 12800 },
  { id: 4, name: "Einstein Medical Center", type: "Hospital", totalReferrals: 5, activeClients: 3, avgMargin: 35, avgScore: 62, totalRevenue: 7600 },
  { id: 5, name: "PA Health & Wellness - Sarah Kim", type: "MCO/SC", totalReferrals: 4, activeClients: 4, avgMargin: 45, avgScore: 84, totalRevenue: 9200 },
  { id: 6, name: "Community Legal Services", type: "Community Org", totalReferrals: 3, activeClients: 2, avgMargin: 32, avgScore: 55, totalRevenue: 3800 },
  { id: 7, name: "Self-Referral / Family", type: "Direct", totalReferrals: 8, activeClients: 6, avgMargin: 40, avgScore: 70, totalRevenue: 11400 },
];

const CHART_DATA = MOCK_SOURCES
  .sort((a, b) => b.totalRevenue - a.totalRevenue)
  .slice(0, 6)
  .map((s) => ({ name: s.name.split(" ").slice(0, 2).join(" "), revenue: s.totalRevenue, referrals: s.totalReferrals }));

const TYPE_STYLES: Record<string, string> = {
  Hospital: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  "MCO/SC": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  "Community Org": "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  Direct: "bg-muted text-muted-foreground",
};

export default function ReferralSources() {
  const totalReferrals = MOCK_SOURCES.reduce((s, r) => s + r.totalReferrals, 0);
  const totalRevenue = MOCK_SOURCES.reduce((s, r) => s + r.totalRevenue, 0);
  const avgConversion = Math.round(
    (MOCK_SOURCES.reduce((s, r) => s + r.activeClients, 0) / totalReferrals) * 100
  );

  return (
    <AppShell
      title="Referral Sources"
      actions={
        <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm">
          <Plus className="h-4 w-4 mr-1.5" /> Add Source
        </Button>
      }
    >
      <div className="space-y-4 max-w-[1440px]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 border-l-4 border-l-blue-500 bg-card shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Total Referrals</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{totalReferrals}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-emerald-500 bg-card shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Conversion Rate</p>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{avgConversion}%</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-emerald-500 bg-card shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Revenue from Referrals</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">${totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">monthly</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-amber-500 bg-card shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">Sources Tracked</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{MOCK_SOURCES.length}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 bg-card shadow-sm p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Revenue by Source</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={CHART_DATA} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" width={120} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Monthly Revenue"]} />
                <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="bg-card shadow-sm p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Top Performing Sources</h3>
            <div className="space-y-3">
              {MOCK_SOURCES.sort((a, b) => b.avgScore - a.avgScore).slice(0, 4).map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                  <span className="text-xs font-bold text-muted-foreground w-5 text-center">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.activeClients} active clients</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600 tabular-nums">{s.avgScore}</p>
                    <p className="text-[10px] text-muted-foreground">avg score</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Referrals</TableHead>
                <TableHead className="text-right">Active Clients</TableHead>
                <TableHead className="text-right">Avg Margin</TableHead>
                <TableHead className="text-right">Avg Score</TableHead>
                <TableHead className="text-right">Monthly Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MOCK_SOURCES.sort((a, b) => b.totalRevenue - a.totalRevenue).map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-sm">{s.name}</TableCell>
                  <TableCell><Badge variant="outline" className={`text-[10px] ${TYPE_STYLES[s.type] || ""}`}>{s.type}</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{s.totalReferrals}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.activeClients}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{s.avgMargin}%</TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className={s.avgScore >= 75 ? "text-emerald-600 font-semibold" : s.avgScore >= 60 ? "text-amber-600" : "text-red-500"}>{s.avgScore}</span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">${s.totalRevenue.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppShell>
  );
}
