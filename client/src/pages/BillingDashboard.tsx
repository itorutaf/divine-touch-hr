import AppShell from "@/components/AppShell";
import StatCard from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DollarSign, Receipt, TrendingUp, AlertCircle, Loader2, Users } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { trpc } from "@/lib/trpc";

const CLAIM_STATUS_STYLES: Record<string, string> = {
  submitted: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  pending: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  paid: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  denied: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const AGING_COLORS = ["#10B981", "#F59E0B", "#F97316", "#EF4444"];

export default function BillingDashboard() {
  const { data: billing, isLoading } = trpc.billing.getDashboard.useQuery();

  if (isLoading || !billing) {
    return (
      <AppShell title="Billing Overview">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading billing data...</span>
        </div>
      </AppShell>
    );
  }

  const claimsByStatus = {
    paid: billing.claims.filter((c: any) => c.status === "paid").length,
    pending: billing.claims.filter((c: any) => c.status === "pending").length,
    submitted: billing.claims.filter((c: any) => c.status === "submitted").length,
    denied: billing.claims.filter((c: any) => c.status === "denied").length,
  };

  const totalOutstanding = billing.claims
    .filter((c: any) => c.status !== "paid")
    .reduce((s: number, c: any) => s + c.amount, 0);

  // Build aging buckets from claims based on date
  const now = new Date();
  const agingBuckets = [
    { bucket: "0-30 days", amount: 0, count: 0, color: AGING_COLORS[0] },
    { bucket: "31-60 days", amount: 0, count: 0, color: AGING_COLORS[1] },
    { bucket: "61-90 days", amount: 0, count: 0, color: AGING_COLORS[2] },
    { bucket: "90+ days", amount: 0, count: 0, color: AGING_COLORS[3] },
  ];

  billing.claims.filter((c: any) => c.status !== "paid").forEach((c: any) => {
    const days = Math.floor((now.getTime() - new Date(c.date).getTime()) / (1000 * 60 * 60 * 24));
    const idx = days <= 30 ? 0 : days <= 60 ? 1 : days <= 90 ? 2 : 3;
    agingBuckets[idx].amount += c.amount;
    agingBuckets[idx].count++;
  });

  return (
    <AppShell title="Billing Overview">
      <div className="space-y-4 max-w-[1440px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Monthly Revenue"
            value={`$${billing.monthlyRevenue.toLocaleString()}`}
            icon={DollarSign}
            accentColor="emerald"
            subtitle={`${billing.activeClients} active clients`}
          />
          <StatCard
            title="Outstanding Claims"
            value={`$${totalOutstanding.toLocaleString()}`}
            icon={Receipt}
            accentColor="blue"
            subtitle={`${claimsByStatus.pending + claimsByStatus.submitted} pending`}
          />
          <StatCard
            title="Collection Rate"
            value={`${billing.collectionRate}%`}
            icon={TrendingUp}
            accentColor="emerald"
          />
          <StatCard
            title="Auth Hours/Week"
            value={String(billing.totalAuthHoursPerWeek)}
            icon={Users}
            accentColor="blue"
            subtitle={`${billing.snapshotCount} clients tracked`}
          />
        </div>

        <Tabs defaultValue="claims">
          <TabsList>
            <TabsTrigger value="claims">Claims Tracker</TabsTrigger>
            <TabsTrigger value="aging">Aging Report</TabsTrigger>
          </TabsList>

          <TabsContent value="claims" className="mt-4">
            <Card className="bg-card shadow-sm overflow-hidden">
              {billing.claims.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Receipt className="h-8 w-8 mb-2" />
                  <p className="text-sm">No billing claims yet</p>
                  <p className="text-xs mt-1">Run Profitability Calculator and save snapshots to see billing data</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Claim ID</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>MCO</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {billing.claims.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-xs">{c.id}</TableCell>
                        <TableCell className="font-medium text-sm">{c.client}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.mco}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">
                          ${c.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${CLAIM_STATUS_STYLES[c.status] || ""}`}>
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="aging" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-card shadow-sm p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Claims by Age Bucket</h3>
                {agingBuckets.some((b) => b.amount > 0) ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={agingBuckets}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="bucket" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        stroke="#94a3b8"
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        formatter={(v: number) => [`$${v.toLocaleString()}`, "Amount"]}
                      />
                      <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                        {agingBuckets.map((e, i) => (
                          <Cell key={i} fill={e.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <p className="text-sm">No outstanding claims to age</p>
                  </div>
                )}
              </Card>
              <Card className="bg-card shadow-sm p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Aging Distribution</h3>
                {agingBuckets.some((b) => b.amount > 0) ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={agingBuckets.filter((b) => b.amount > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="amount"
                          nameKey="bucket"
                        >
                          {agingBuckets
                            .filter((b) => b.amount > 0)
                            .map((e, i) => (
                              <Cell key={i} fill={e.color} />
                            ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ fontSize: 11 }}
                          formatter={(v: number) => [`$${v.toLocaleString()}`, undefined]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 justify-center mt-2">
                      {agingBuckets.map((d) => (
                        <div key={d.bucket} className="flex items-center gap-1.5 text-xs">
                          <div className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                          <span className="text-muted-foreground">{d.bucket}</span>
                          <span className="font-medium tabular-nums">{d.count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <p className="text-sm">No aging data available</p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
