import AppShell from "@/components/AppShell";
import StatCard from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { ShieldCheck, ShieldAlert, Clock, Play, Download, Eye, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const STATUS_STYLES: Record<string, string> = {
  clear: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  match: "bg-red-500/10 text-red-700 dark:text-red-400",
  error: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

export default function LEIEScreening() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Fetch screening history
  const { data: screenings, isLoading } = trpc.exclusions.list.useQuery({});
  const utils = trpc.useUtils();

  const runNow = trpc.exclusions.runNow.useMutation({
    onSuccess: () => {
      utils.exclusions.list.invalidate();
    },
  });

  // Aggregate stats from screening records
  const lastScreening = screenings?.[0];
  const lastScreeningDate = lastScreening?.screeningDate
    ? new Date(lastScreening.screeningDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Never";

  const daysSinceScreening = lastScreening?.screeningDate
    ? Math.floor((Date.now() - new Date(lastScreening.screeningDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Count unique screening dates (batches)
  const screeningDates = new Set(screenings?.map((s: any) => s.screeningDate) || []);
  const totalBatches = screeningDates.size;

  // Count matches
  const leieMatches = screenings?.filter((s: any) => s.leieResult === "match").length || 0;
  const samMatches = screenings?.filter((s: any) => s.samResult === "match").length || 0;
  const unresolvedMatches = screenings?.filter(
    (s: any) => (s.leieResult === "match" || s.samResult === "match") && !s.resolvedAt
  ).length || 0;

  // Group screenings by date for the table
  const screeningsByDate = new Map<string, { date: string; total: number; leieMatches: number; samMatches: number; errors: number; hasUnresolved: boolean }>();

  screenings?.forEach((s: any) => {
    const date = s.screeningDate || "Unknown";
    const existing = screeningsByDate.get(date) || { date, total: 0, leieMatches: 0, samMatches: 0, errors: 0, hasUnresolved: false };
    existing.total++;
    if (s.leieResult === "match") existing.leieMatches++;
    if (s.samResult === "match") existing.samMatches++;
    if (s.leieResult === "error" || s.samResult === "error") existing.errors++;
    if ((s.leieResult === "match" || s.samResult === "match") && !s.resolvedAt) existing.hasUnresolved = true;
    screeningsByDate.set(date, existing);
  });

  const batches = Array.from(screeningsByDate.values()).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <AppShell
      title="LEIE/SAM Screening"
      actions={
        isAdmin ? (
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            size="sm"
            onClick={() => runNow.mutate()}
            disabled={runNow.isPending}
          >
            {runNow.isPending ? (
              <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Running...</>
            ) : (
              <><Play className="h-4 w-4 mr-1.5" /> Run Screening Now</>
            )}
          </Button>
        ) : undefined
      }
    >
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
              <StatCard
                title="Last Screening"
                value={lastScreeningDate}
                icon={Clock}
                accentColor="blue"
                subtitle={daysSinceScreening !== null ? `${daysSinceScreening} day(s) ago` : undefined}
              />
              <StatCard title="Screenings Run" value={totalBatches} icon={ShieldCheck} accentColor="emerald" />
              <StatCard
                title="Active Matches"
                value={unresolvedMatches}
                icon={ShieldAlert}
                accentColor={unresolvedMatches > 0 ? "red" : "emerald"}
              />
              <StatCard
                title="Lifetime Matches"
                value={leieMatches + samMatches}
                icon={ShieldAlert}
                accentColor={leieMatches + samMatches > 0 ? "amber" : "emerald"}
                subtitle={unresolvedMatches === 0 && (leieMatches + samMatches) > 0 ? "all resolved" : undefined}
              />
            </>
          )}
        </div>

        {/* How it works */}
        <Card className="bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 p-5">
          <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-2">Monthly OIG Compliance Screening</h3>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
            CareBase automatically screens all active employees against the OIG LEIE (List of Excluded Individuals/Entities)
            and SAM.gov exclusion databases on the 1st of each month. Matches are flagged for immediate review.
            Penalties for employing excluded individuals can reach $100,000 per item/service plus treble damages.
          </p>
        </Card>

        {/* Screening History */}
        <Card className="bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Screening History</h3>
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
              {isLoading ? (
                [1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No screening records yet. {isAdmin ? "Click \"Run Screening Now\" to start." : "An admin must initiate the first screening."}
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((batch) => {
                  const hasMatches = batch.leieMatches > 0 || batch.samMatches > 0;
                  const statusLabel = batch.hasUnresolved ? "match_found" : hasMatches ? "resolved" : batch.errors > 0 ? "error" : "complete";
                  const statusText = batch.hasUnresolved ? "Action Required" : hasMatches ? "Resolved" : batch.errors > 0 ? "Partial Error" : "Complete";
                  const statusClass = batch.hasUnresolved ? STATUS_STYLES.match : hasMatches ? STATUS_STYLES.error : STATUS_STYLES.clear;

                  return (
                    <TableRow key={batch.date} className={hasMatches ? "bg-amber-500/[0.04]" : ""}>
                      <TableCell className="font-medium text-sm">{batch.date}</TableCell>
                      <TableCell className="text-right tabular-nums">{batch.total}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {batch.leieMatches > 0 ? (
                          <span className="text-red-600 dark:text-red-400 font-semibold">{batch.leieMatches}</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {batch.samMatches > 0 ? (
                          <span className="text-red-600 dark:text-red-400 font-semibold">{batch.samMatches}</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${statusClass}`}>{statusText}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Run result message */}
        {runNow.isSuccess && (
          <Card className="bg-emerald-500/10 border-emerald-500/20 p-4">
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Screening complete: {(runNow.data as any)?.totalScreened || 0} employees screened,{" "}
              {((runNow.data as any)?.leieMatches || 0) + ((runNow.data as any)?.samMatches || 0)} match(es) found.
            </p>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
