import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Users, TrendingUp, ArrowUpRight } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { trpc } from "@/lib/trpc";

const TYPE_STYLES: Record<string, string> = {
  Hospital: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  "MCO/SC": "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  "Community Org": "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  Direct: "bg-muted text-muted-foreground",
  Other: "bg-muted text-muted-foreground",
};

export default function ReferralSources() {
  const { data: sources, isLoading } = trpc.clients.getReferralSources.useQuery();

  if (isLoading) {
    return (
      <AppShell title="Referral Sources">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading referral data...</span>
        </div>
      </AppShell>
    );
  }

  const allSources = sources ?? [];
  const totalReferrals = allSources.reduce((s, r) => s + r.totalReferrals, 0);
  const totalActive = allSources.reduce((s, r) => s + r.activeClients, 0);
  const avgConversion = totalReferrals > 0 ? Math.round((totalActive / totalReferrals) * 100) : 0;

  const chartData = allSources
    .sort((a, b) => b.totalReferrals - a.totalReferrals)
    .slice(0, 6)
    .map((s) => ({
      name: s.name.length > 20 ? s.name.slice(0, 18) + "..." : s.name,
      referrals: s.totalReferrals,
      active: s.activeClients,
    }));

  return (
    <AppShell title="Referral Sources">
      <div className="space-y-4 max-w-[1440px]">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 border-l-4 border-l-blue-500 bg-card shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              Total Referrals
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{totalReferrals}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-emerald-500 bg-card shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              Active from Referrals
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{totalActive}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-emerald-500 bg-card shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              Conversion Rate
            </p>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{avgConversion}%</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-amber-500 bg-card shadow-sm">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
              Sources Tracked
            </p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{allSources.length}</p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2 bg-card shadow-sm p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Referrals by Source</h3>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No referral data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                    width={140}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Bar
                    dataKey="referrals"
                    name="Total Referrals"
                    fill="#3B82F6"
                    radius={[0, 4, 4, 0]}
                  />
                  <Bar
                    dataKey="active"
                    name="Active Clients"
                    fill="#10B981"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card className="bg-card shadow-sm p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Top Converting Sources
            </h3>
            <div className="space-y-3">
              {allSources
                .filter((s) => s.totalReferrals >= 2)
                .sort((a, b) => b.conversionRate - a.conversionRate)
                .slice(0, 4)
                .map((s, i) => (
                  <div key={s.name} className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                    <span className="text-xs font-bold text-muted-foreground w-5 text-center">
                      #{i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.activeClients}/{s.totalReferrals} converted
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600 tabular-nums">
                        {s.conversionRate}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">conversion</p>
                    </div>
                  </div>
                ))}
              {allSources.filter((s) => s.totalReferrals >= 2).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Need sources with 2+ referrals
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Full table */}
        <Card className="bg-card shadow-sm overflow-hidden">
          {allSources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="h-8 w-8 mb-2" />
              <p className="text-sm">No referral sources tracked yet</p>
              <p className="text-xs mt-1">
                Add a referral source when creating a new client
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total Referrals</TableHead>
                  <TableHead className="text-right">Active Clients</TableHead>
                  <TableHead className="text-right">Conversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSources
                  .sort((a, b) => b.totalReferrals - a.totalReferrals)
                  .map((s) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium text-sm">{s.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${TYPE_STYLES[s.type] || ""}`}
                        >
                          {s.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{s.totalReferrals}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.activeClients}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span
                          className={
                            s.conversionRate >= 70
                              ? "text-emerald-600 font-semibold"
                              : s.conversionRate >= 40
                                ? "text-amber-600"
                                : "text-red-500"
                          }
                        >
                          {s.conversionRate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </AppShell>
  );
}
