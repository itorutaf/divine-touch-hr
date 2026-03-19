import AppShell from "@/components/AppShell";
import StatCard from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { FileCheck, AlertTriangle, TrendingDown, TrendingUp, Clock, Eye, RefreshCw, Search, Download } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

function getUtilColor(util: number) {
  if (util > 100) return { bar: "bg-red-500", text: "text-red-600 dark:text-red-400", label: "Over" };
  if (util >= 80) return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", label: "On Track" };
  return { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", label: "Under" };
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const end = new Date(dateStr);
  const now = new Date();
  return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function AuthorizationTracker() {
  const [search, setSearch] = useState("");

  const { data: auths, isLoading } = trpc.authorizations.list.useQuery();

  // Enrich authorizations with computed fields
  const enriched = (auths || []).map((a: any) => {
    const clientName = a.clientFirstName && a.clientLastName
      ? `${a.clientFirstName} ${a.clientLastName}`
      : `Client #${a.clientId}`;
    const authHours = Number(a.authorizedHoursPerWeek) || 0;
    const daysLeft = daysUntil(a.endDate);

    // Utilization is not stored — we'd need EVV delivered hours.
    // For now show authorized hours only; utilization TBD when HHA Exchange syncs.
    return {
      ...a,
      clientName,
      authHours,
      daysLeft,
      // Placeholder utilization until EVV integration delivers actual hours
      deliveredHours: 0,
      utilization: 0,
    };
  });

  // Filter by search
  const filtered = enriched.filter((a: any) =>
    !search ||
    a.clientName.toLowerCase().includes(search.toLowerCase()) ||
    a.mco?.toLowerCase().includes(search.toLowerCase()) ||
    a.authorizationNumber?.toLowerCase().includes(search.toLowerCase())
  );

  // Aggregate stats
  const activeCount = enriched.filter((a: any) => a.status === "active" || a.status === "expiring").length;
  const expiringCount = enriched.filter((a: any) => a.status === "expiring" || (a.daysLeft !== null && a.daysLeft <= 60 && a.daysLeft > 0)).length;
  const expiredCount = enriched.filter((a: any) => a.status === "expired" || (a.daysLeft !== null && a.daysLeft <= 0)).length;
  const pendingRenewalCount = enriched.filter((a: any) => a.status === "pending_renewal").length;

  return (
    <AppShell title="Authorization Tracker">
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
              <StatCard title="Active Authorizations" value={activeCount} icon={FileCheck} accentColor="emerald" />
              <StatCard title="Expiring (≤60 days)" value={expiringCount} icon={Clock} accentColor="amber" />
              <StatCard title="Expired" value={expiredCount} icon={AlertTriangle} accentColor="red" />
              <StatCard title="Pending Renewal" value={pendingRenewalCount} icon={RefreshCw} accentColor="blue" />
            </>
          )}
        </div>

        {/* Search + Export */}
        <Card className="bg-card shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client, MCO, or auth number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" />Export</Button>
          </div>
        </Card>

        <Card className="bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>MCO</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Auth #</TableHead>
                <TableHead className="text-right">Auth Hrs/Wk</TableHead>
                <TableHead>Auth Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {search ? "No authorizations match your search" : "No authorizations found. Create one from a client record."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a: any) => {
                  const statusStyles: Record<string, string> = {
                    active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
                    expiring: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
                    expired: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
                    pending_renewal: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
                  };
                  const statusLabels: Record<string, string> = {
                    active: "Active",
                    expiring: "Expiring",
                    expired: "Expired",
                    pending_renewal: "Pending Renewal",
                  };

                  // Override status display if computed daysLeft says it's expiring/expired
                  let displayStatus = a.status || "active";
                  if (a.daysLeft !== null && a.daysLeft <= 0) displayStatus = "expired";
                  else if (a.daysLeft !== null && a.daysLeft <= 60 && displayStatus === "active") displayStatus = "expiring";

                  return (
                    <TableRow
                      key={a.id}
                      className={displayStatus === "expired" ? "bg-red-500/[0.04]" : displayStatus === "expiring" ? "bg-amber-500/[0.04]" : ""}
                    >
                      <TableCell className="font-medium text-sm">{a.clientName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.mco || "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{a.serviceType || "—"}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">{a.authorizationNumber || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{a.authHours || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {a.startDate && a.endDate ? `${a.startDate} — ${a.endDate}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${statusStyles[displayStatus] || ""}`}>
                          {statusLabels[displayStatus] || displayStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {a.daysLeft !== null ? (
                          a.daysLeft <= 30 ? (
                            <Badge className="bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20 text-[10px]">{a.daysLeft}d</Badge>
                          ) : a.daysLeft <= 60 ? (
                            <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px]">{a.daysLeft}d</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">{a.daysLeft}d</span>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
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
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Info card about utilization */}
        <Card className="bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20 p-5">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Utilization Tracking</h3>
          <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
            Authorization utilization (delivered vs. authorized hours) will be available once HHA Exchange EVV data syncs.
            This enables real-time under/over-utilization alerts, helping prevent revenue leakage from un-billed authorized hours
            and compliance issues from exceeding authorized limits.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
