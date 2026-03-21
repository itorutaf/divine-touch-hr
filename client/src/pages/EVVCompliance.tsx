import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShieldCheck, AlertTriangle, Eye, Loader2, CheckCircle, XCircle } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { trpc } from "@/lib/trpc";

export default function EVVCompliance() {
  const { data: dashboard, isLoading } = trpc.evv.getDashboard.useQuery();

  if (isLoading || !dashboard) {
    return (
      <AppShell title="EVV Compliance">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading EVV data...</span>
        </div>
      </AppShell>
    );
  }

  const heroRate = dashboard.overallRate;
  const heroColor = heroRate >= 85 ? "#10B981" : heroRate >= 80 ? "#F59E0B" : "#EF4444";

  return (
    <AppShell title="EVV Compliance">
      <div className="space-y-4 max-w-[1440px]">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 border-l-4 border-l-emerald-500 bg-card shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Visits</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{dashboard.totalVisits}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-emerald-500 bg-card shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">EVV Compliant</p>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{dashboard.evvCompliantCount}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-red-500 bg-card shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Manual Entry</p>
            <p className="text-2xl font-bold text-red-600 tabular-nums">{dashboard.manualCount}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-amber-500 bg-card shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Caregivers Tracked</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{dashboard.caregivers.length}</p>
          </Card>
        </div>

        {/* Hero Gauge + Trend */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-card shadow-sm p-6 flex flex-col items-center justify-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium mb-2">
              Agency Auto-Verification Rate
            </p>
            {dashboard.totalVisits === 0 ? (
              <div className="text-center py-8">
                <ShieldCheck className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No visit data yet</p>
              </div>
            ) : (
              <>
                <div className="relative">
                  <ResponsiveContainer width={180} height={110}>
                    <PieChart>
                      <Pie
                        data={[{ value: heroRate }, { value: 100 - heroRate }]}
                        cx="50%"
                        cy="100%"
                        startAngle={180}
                        endAngle={0}
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={0}
                        dataKey="value"
                      >
                        <Cell fill={heroColor} />
                        <Cell fill="#e2e8f0" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-x-0 bottom-2 text-center">
                    <span className="text-4xl font-bold tabular-nums" style={{ color: heroColor }}>
                      {heroRate}%
                    </span>
                  </div>
                </div>
                {dashboard.meetsThreshold ? (
                  <p className="text-sm font-medium text-emerald-600 mt-2 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    Meets 85% PA DHS Threshold
                  </p>
                ) : (
                  <p className="text-sm font-medium text-red-500 mt-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    Below 85% PA DHS Threshold
                  </p>
                )}
              </>
            )}
          </Card>

          <Card className="md:col-span-2 bg-card shadow-sm p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              {dashboard.weeklyTrend.length > 0 ? `${dashboard.weeklyTrend.length}-Week Compliance Trend` : "Weekly Compliance Trend"}
            </h3>
            {dashboard.weeklyTrend.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p className="text-sm">Not enough data for trend analysis</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={dashboard.weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis
                    domain={[
                      Math.max(0, Math.min(...dashboard.weeklyTrend.map((d: any) => d.rate)) - 10),
                      100,
                    ]}
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    formatter={(v: number) => [`${v}%`, "Rate"]}
                  />
                  <ReferenceLine
                    y={85}
                    stroke="#EF4444"
                    strokeDasharray="5 5"
                    label={{
                      value: "85% threshold",
                      position: "right",
                      fontSize: 10,
                      fill: "#EF4444",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke={heroRate >= 85 ? "#10B981" : "#F59E0B"}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        {/* Caregiver Table + Reasons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 bg-card shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b">
              <h3 className="text-sm font-semibold text-foreground">Caregiver Manual Entry Rate</h3>
            </div>
            {dashboard.caregivers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShieldCheck className="h-8 w-8 mb-2" />
                <p className="text-sm">No caregiver data yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Caregiver</TableHead>
                    <TableHead className="text-right">Total Visits</TableHead>
                    <TableHead className="text-right">Auto-Verified</TableHead>
                    <TableHead className="text-right">Manual</TableHead>
                    <TableHead className="text-right">Manual %</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...dashboard.caregivers]
                    .sort((a, b) => b.manualPct - a.manualPct)
                    .map((cg) => (
                      <TableRow key={cg.id} className={cg.manualPct > 15 ? "bg-red-50/20" : ""}>
                        <TableCell className="font-medium text-sm">{cg.name}</TableCell>
                        <TableCell className="text-right tabular-nums">{cg.totalVisits}</TableCell>
                        <TableCell className="text-right tabular-nums">{cg.autoVerified}</TableCell>
                        <TableCell className="text-right tabular-nums">{cg.manual}</TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`tabular-nums font-semibold text-sm ${cg.manualPct > 15 ? "text-red-600" : "text-muted-foreground"}`}
                          >
                            {cg.manualPct.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {cg.manualPct > 15 ? (
                            <Badge className="bg-red-500/10 text-red-700 text-[10px]">
                              <AlertTriangle className="h-3 w-3 mr-0.5" />
                              Action Needed
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-500/10 text-emerald-700 text-[10px]">
                              <CheckCircle className="h-3 w-3 mr-0.5" />
                              Compliant
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </Card>

          <Card className="bg-card shadow-sm p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Manual Entry Reasons</h3>
            {dashboard.reasons.length === 1 && dashboard.reasons[0].name === "No Data" ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <p className="text-sm">No manual entries recorded</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={dashboard.reasons}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {dashboard.reasons.map((e: any, i: number) => (
                        <Cell key={i} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {dashboard.reasons.map((d: any) => (
                    <div key={d.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ background: d.color }}
                        />
                        <span className="text-muted-foreground">{d.name}</span>
                      </div>
                      <span className="tabular-nums text-muted-foreground">{d.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
