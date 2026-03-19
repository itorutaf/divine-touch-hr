import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Users, Search, CheckCircle2, XCircle, MapPin, Clock, Star, ArrowRight,
} from "lucide-react";
import { useState } from "react";

const SERVICE_LINE_STYLES: Record<string, string> = {
  OLTL: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ODP: "bg-blue-50 text-blue-700 border-blue-200",
  Skilled: "bg-purple-50 text-purple-700 border-purple-200",
};

const MOCK_CLIENTS_NEEDING = [
  { id: 1, name: "Dorothy Kim", serviceLine: "OLTL", region: 4, county: "Chester", hoursNeeded: 20, urgency: "high" as const },
  { id: 2, name: "Michael Brown", serviceLine: "ODP", region: 3, county: "Lancaster", hoursNeeded: 40, urgency: "medium" as const },
];

const MOCK_CAREGIVERS = [
  { id: 1, name: "Maria Santos", serviceLine: "OLTL", county: "Philadelphia", availableHours: 20, clearanceStatus: "clear", trainingComplete: true, matchScore: 92 },
  { id: 2, name: "Chen Wei", serviceLine: "OLTL", county: "Philadelphia", availableHours: 15, clearanceStatus: "clear", trainingComplete: true, matchScore: 87 },
  { id: 3, name: "Lisa Park", serviceLine: "OLTL", county: "Delaware", availableHours: 25, clearanceStatus: "clear", trainingComplete: true, matchScore: 85 },
  { id: 4, name: "Miguel Rodriguez", serviceLine: "OLTL", county: "Montgomery", availableHours: 30, clearanceStatus: "clear", trainingComplete: true, matchScore: 78 },
  { id: 5, name: "Fatima Ali", serviceLine: "OLTL", county: "Philadelphia", availableHours: 10, clearanceStatus: "expiring", trainingComplete: false, matchScore: 52 },
  { id: 6, name: "Andre Brooks", serviceLine: "ODP", county: "Philadelphia", availableHours: 40, clearanceStatus: "pending", trainingComplete: false, matchScore: 30 },
];

const URGENCY_STYLES = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-slate-100 text-slate-600",
};

export default function CaregiverMatching() {
  const [selectedClient, setSelectedClient] = useState(MOCK_CLIENTS_NEEDING[0]);

  const matchedCaregivers = MOCK_CAREGIVERS
    .filter((cg) => cg.serviceLine === selectedClient.serviceLine || cg.serviceLine === "OLTL")
    .sort((a, b) => b.matchScore - a.matchScore);

  return (
    <AppShell title="Caregiver Matching">
      <div className="space-y-4 max-w-[1440px]">
        {/* Clients needing assignment */}
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              Clients Needing Caregiver Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {MOCK_CLIENTS_NEEDING.map((client) => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClient(client)}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    selectedClient.id === client.id
                      ? "border-emerald-300 bg-emerald-50/50 ring-1 ring-emerald-200"
                      : "border-slate-200 hover:border-slate-300 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{client.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-[9px] ${SERVICE_LINE_STYLES[client.serviceLine]}`}>{client.serviceLine}</Badge>
                        <span className="text-xs text-slate-500 flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" /> R{client.region} · {client.county}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">{client.hoursNeeded}h/wk</p>
                      <Badge variant="outline" className={`text-[9px] mt-1 ${URGENCY_STYLES[client.urgency]}`}>{client.urgency}</Badge>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Matching results */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Star className="h-4 w-4 text-amber-500" />
          <span>Showing {matchedCaregivers.length} matches for <strong className="text-slate-900">{selectedClient.name}</strong> — sorted by match score</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matchedCaregivers.map((cg) => {
            const scoreColor = cg.matchScore >= 80 ? "text-emerald-600" : cg.matchScore >= 60 ? "text-amber-600" : "text-red-500";
            const scoreBg = cg.matchScore >= 80 ? "bg-emerald-50" : cg.matchScore >= 60 ? "bg-amber-50" : "bg-red-50";

            return (
              <Card key={cg.id} className={`bg-white shadow-sm overflow-hidden ${cg.matchScore < 50 ? "opacity-60" : ""}`}>
                <div className={`h-1 ${cg.matchScore >= 80 ? "bg-emerald-500" : cg.matchScore >= 60 ? "bg-amber-500" : "bg-red-400"}`} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{cg.name}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge variant="outline" className={`text-[9px] ${SERVICE_LINE_STYLES[cg.serviceLine]}`}>{cg.serviceLine}</Badge>
                        <span className="text-[10px] text-slate-400">{cg.county}</span>
                      </div>
                    </div>
                    <div className={`h-10 w-10 rounded-lg ${scoreBg} flex items-center justify-center`}>
                      <span className={`text-sm font-bold tabular-nums ${scoreColor}`}>{cg.matchScore}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Available
                      </span>
                      <span className="font-medium tabular-nums">{cg.availableHours}h/wk</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Clearances</span>
                      <span className="flex items-center gap-1">
                        {cg.clearanceStatus === "clear" ? (
                          <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> <span className="text-emerald-600">Clear</span></>
                        ) : cg.clearanceStatus === "expiring" ? (
                          <><Clock className="h-3 w-3 text-amber-500" /> <span className="text-amber-600">Expiring</span></>
                        ) : (
                          <><XCircle className="h-3 w-3 text-red-400" /> <span className="text-red-500">Pending</span></>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Training</span>
                      <span className="flex items-center gap-1">
                        {cg.trainingComplete ? (
                          <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> <span className="text-emerald-600">Complete</span></>
                        ) : (
                          <><XCircle className="h-3 w-3 text-red-400" /> <span className="text-red-500">Incomplete</span></>
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
      </div>
    </AppShell>
  );
}
