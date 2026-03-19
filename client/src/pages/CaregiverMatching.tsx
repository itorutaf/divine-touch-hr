import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, CheckCircle2, XCircle, MapPin, Clock, Star, ArrowRight, Loader2,
} from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

const SERVICE_LINE_STYLES: Record<string, string> = {
  OLTL: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  ODP: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Skilled: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
};

const URGENCY_STYLES: Record<string, string> = {
  high: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  low: "bg-muted text-muted-foreground",
};

/**
 * Derive a simplified clearance status from employee boolean flags.
 */
function getClearanceStatus(emp: any): "clear" | "expiring" | "pending" {
  const allReceived = emp.patchReceived && emp.fbiReceived && emp.childAbuseReceived;
  if (!allReceived) return "pending";

  // Check if any clearance is expiring within 60 days
  const sixtyDaysFromNow = new Date();
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

  for (const dateField of [emp.patchDate, emp.fbiDate, emp.childAbuseDate]) {
    if (dateField) {
      const expiry = new Date(dateField);
      expiry.setMonth(expiry.getMonth() + 60); // PA Act 153: 60-month validity
      if (expiry < sixtyDaysFromNow) return "expiring";
    }
  }

  return "clear";
}

export default function CaregiverMatching() {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  // Fetch clients with active authorizations
  const { data: clients, isLoading: loadingClients } = trpc.clients.list.useQuery();
  const { data: auths } = trpc.authorizations.list.useQuery();
  const { data: employees, isLoading: loadingEmployees } = trpc.employees.list.useQuery();

  // Build clients needing assignment: clients with active authorizations
  const clientsNeedingAssignment = (clients || [])
    .map((client: any) => {
      const clientAuths = (auths || []).filter((a: any) =>
        a.clientId === client.id && (a.status === "active" || a.status === "expiring")
      );
      if (clientAuths.length === 0) return null;

      const totalHours = clientAuths.reduce((sum: number, a: any) => sum + (Number(a.authorizedHoursPerWeek) || 0), 0);
      const primaryAuth = clientAuths[0];

      // Urgency based on how soon the auth expires
      const daysLeft = primaryAuth.endDate
        ? Math.ceil((new Date(primaryAuth.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : 999;
      const urgency = daysLeft <= 30 ? "high" : daysLeft <= 90 ? "medium" : "low";

      return {
        id: client.id,
        name: `${client.firstName} ${client.lastName}`,
        serviceLine: primaryAuth.serviceType?.includes("PAS") ? "OLTL" : primaryAuth.serviceType?.includes("RN") || primaryAuth.serviceType?.includes("LPN") ? "Skilled" : "ODP",
        county: client.county || "—",
        hoursNeeded: totalHours,
        urgency,
        mco: primaryAuth.mco,
      };
    })
    .filter(Boolean) as any[];

  const selectedClient = clientsNeedingAssignment.find((c: any) => c.id === selectedClientId) || clientsNeedingAssignment[0];

  // Build caregiver pool from active employees
  const caregivers = (employees || [])
    .filter((emp: any) =>
      emp.currentPhase === "Active" || emp.currentPhase === "Ready to Schedule"
    )
    .map((emp: any) => {
      const clearanceStatus = getClearanceStatus(emp);
      const trainingComplete = emp.nevvonTrainingComplete ?? false;

      // Simple match score: clearance (40pts) + training (20pts) + service line match (30pts) + county (10pts)
      let matchScore = 0;
      if (clearanceStatus === "clear") matchScore += 40;
      else if (clearanceStatus === "expiring") matchScore += 20;
      if (trainingComplete) matchScore += 20;
      if (selectedClient && emp.serviceLine === selectedClient.serviceLine) matchScore += 30;
      if (selectedClient && emp.county?.toLowerCase() === selectedClient.county?.toLowerCase()) matchScore += 10;

      return {
        id: emp.id,
        name: `${emp.legalFirstName} ${emp.legalLastName}`,
        serviceLine: emp.serviceLine || "OLTL",
        county: emp.county || "—",
        availableHours: 40, // Would come from EVV/scheduling data
        clearanceStatus,
        trainingComplete,
        matchScore,
      };
    })
    .sort((a: any, b: any) => b.matchScore - a.matchScore);

  const isLoading = loadingClients || loadingEmployees;

  return (
    <AppShell title="Caregiver Matching">
      <div className="space-y-4 max-w-[1440px]">
        {/* Clients needing assignment */}
        <Card className="bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              Clients Needing Caregiver Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 rounded-lg border">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            ) : clientsNeedingAssignment.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No clients with active authorizations needing assignment.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clientsNeedingAssignment.map((client: any) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      selectedClient?.id === client.id
                        ? "border-emerald-300 bg-emerald-500/10 ring-1 ring-emerald-200 dark:ring-emerald-500/30"
                        : "border-border hover:border-border bg-card"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-foreground">{client.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className={`text-[9px] ${SERVICE_LINE_STYLES[client.serviceLine] || ""}`}>
                            {client.serviceLine}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                            <MapPin className="h-3 w-3" /> {client.county}
                          </span>
                          {client.mco && (
                            <span className="text-[10px] text-muted-foreground">{client.mco}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums">{client.hoursNeeded}h/wk</p>
                        <Badge variant="outline" className={`text-[9px] mt-1 ${URGENCY_STYLES[client.urgency]}`}>
                          {client.urgency}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Matching results */}
        {selectedClient && (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 text-amber-500" />
              <span>
                Showing {caregivers.length} matches for <strong className="text-foreground">{selectedClient.name}</strong> — sorted by match score
              </span>
            </div>

            {caregivers.length === 0 ? (
              <Card className="bg-card shadow-sm p-8 text-center">
                <p className="text-muted-foreground">No active caregivers available for matching.</p>
                <p className="text-xs text-muted-foreground mt-1">Employees must be in "Active" or "Ready to Schedule" phase.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {caregivers.map((cg: any) => {
                  const scoreColor = cg.matchScore >= 80 ? "text-emerald-600 dark:text-emerald-400" : cg.matchScore >= 60 ? "text-amber-600 dark:text-amber-400" : "text-red-500 dark:text-red-400";
                  const scoreBg = cg.matchScore >= 80 ? "bg-emerald-500/10" : cg.matchScore >= 60 ? "bg-amber-500/10" : "bg-red-500/10";

                  return (
                    <Card key={cg.id} className={`bg-card shadow-sm overflow-hidden ${cg.matchScore < 50 ? "opacity-60" : ""}`}>
                      <div className={`h-1 ${cg.matchScore >= 80 ? "bg-emerald-500" : cg.matchScore >= 60 ? "bg-amber-500" : "bg-red-400"}`} />
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground">{cg.name}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge variant="outline" className={`text-[9px] ${SERVICE_LINE_STYLES[cg.serviceLine] || ""}`}>{cg.serviceLine}</Badge>
                              <span className="text-[10px] text-muted-foreground">{cg.county}</span>
                            </div>
                          </div>
                          <div className={`h-10 w-10 rounded-lg ${scoreBg} flex items-center justify-center`}>
                            <span className={`text-sm font-bold tabular-nums ${scoreColor}`}>{cg.matchScore}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Available
                            </span>
                            <span className="font-medium tabular-nums">{cg.availableHours}h/wk</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Clearances</span>
                            <span className="flex items-center gap-1">
                              {cg.clearanceStatus === "clear" ? (
                                <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> <span className="text-emerald-600 dark:text-emerald-400">Clear</span></>
                              ) : cg.clearanceStatus === "expiring" ? (
                                <><Clock className="h-3 w-3 text-amber-500" /> <span className="text-amber-600 dark:text-amber-400">Expiring</span></>
                              ) : (
                                <><XCircle className="h-3 w-3 text-red-400" /> <span className="text-red-500 dark:text-red-400">Pending</span></>
                              )}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Training</span>
                            <span className="flex items-center gap-1">
                              {cg.trainingComplete ? (
                                <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> <span className="text-emerald-600 dark:text-emerald-400">Complete</span></>
                              ) : (
                                <><XCircle className="h-3 w-3 text-red-400" /> <span className="text-red-500 dark:text-red-400">Incomplete</span></>
                              )}
                            </span>
                          </div>
                        </div>

                        <Button
                          className="w-full mt-3 h-8 text-xs bg-emerald-600 hover:bg-emerald-700"
                          disabled={cg.matchScore < 50}
                        >
                          Assign to {selectedClient.name.split(" ")[0]}
                          <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Matching criteria info */}
        <Card className="bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20 p-5">
          <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-2">Match Score Criteria</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-blue-700 dark:text-blue-400">
            <div><strong>40 pts</strong> — All clearances clear</div>
            <div><strong>30 pts</strong> — Service line match</div>
            <div><strong>20 pts</strong> — Training complete</div>
            <div><strong>10 pts</strong> — Same county</div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
