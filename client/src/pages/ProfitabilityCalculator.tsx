import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import {
  DollarSign,
  TrendingUp,
  Calculator,
  Save,
  Plus,
  Trash2,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Users,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type Worker = {
  id: number;
  name: string;
  hours: number;
  rate: number;
  isFamily: boolean;
};

const REC_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  STRONG_YES: { bg: "bg-emerald-600", text: "text-white", label: "Strong Yes" },
  YES: { bg: "bg-emerald-500", text: "text-white", label: "Yes" },
  MAYBE: { bg: "bg-amber-500", text: "text-white", label: "Maybe" },
  CAUTION: { bg: "bg-orange-500", text: "text-white", label: "Caution" },
  HARD_NO: { bg: "bg-red-600", text: "text-white", label: "Hard No" },
};

export default function ProfitabilityCalculator() {
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const preselectedClientId = searchParams.get("clientId");

  // Inputs
  const [clientId, setClientId] = useState(preselectedClientId || "");
  const [serviceLine, setServiceLine] = useState<"OLTL" | "ODP" | "Skilled">("OLTL");
  const [region, setRegion] = useState(4);
  const [serviceType, setServiceType] = useState("PAS_CSLA");
  const [hoursPerWeek, setHoursPerWeek] = useState(30);
  const [scheduleType, setScheduleType] = useState<"fixed" | "mostly_fixed" | "variable">("fixed");
  const [caregiverType, setCaregiverType] = useState<"family" | "non_family">("non_family");
  const [caregiverSource, setCaregiverSource] = useState<"referral" | "indeed" | "job_board" | "word_of_mouth" | "other">("referral");
  const [payRateOverride, setPayRateOverride] = useState<string>("");
  const [fitAssessment, setFitAssessment] = useState({
    hasCaregiversAvailable: true,
    inServiceArea: true,
    scheduleCompatible: true,
    withinCapabilities: true,
    familyDynamicsGood: true,
  });
  const [useMultiWorker, setUseMultiWorker] = useState(false);
  const [workers, setWorkers] = useState<Worker[]>([
    { id: 1, name: "Worker 1", hours: 30, rate: 12.5, isFamily: false },
  ]);

  // Results
  const [results, setResults] = useState<any>(null);

  // Queries
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: serviceTypesData } = trpc.profitability.getServiceTypes.useQuery(
    { waiverType: serviceLine },
  );
  const { data: rateData } = trpc.profitability.getRate.useQuery(
    { waiverType: serviceLine, serviceType, region },
  );

  // Update service type when service line changes
  useEffect(() => {
    if (serviceTypesData?.defaultType) {
      setServiceType(serviceTypesData.defaultType);
    }
  }, [serviceTypesData?.defaultType]);

  // Update worker rates when rate changes
  useEffect(() => {
    if (rateData?.defaultPayRate && !payRateOverride) {
      setWorkers((prev) =>
        prev.map((w) => ({ ...w, rate: rateData.defaultPayRate }))
      );
    }
  }, [rateData?.defaultPayRate]);

  // Pre-fill from selected client
  useEffect(() => {
    if (clientId && clients) {
      const client = (clients as any[]).find((c) => String(c.id) === clientId);
      if (client) {
        if (client.serviceLine) setServiceLine(client.serviceLine);
        if (client.region) setRegion(client.region);
      }
    }
  }, [clientId, clients]);

  const calculateMutation = trpc.profitability.calculate.useMutation({
    onSuccess: (data) => {
      setResults(data);
      toast.success("Calculation complete");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const saveMutation = trpc.profitability.saveSnapshot.useMutation({
    onSuccess: () => {
      toast.success("Snapshot saved to client profile");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleCalculate = () => {
    const staffingModel = useMultiWorker
      ? {
          workers: workers.map((w) => ({
            id: String(w.id),
            name: w.name,
            type: w.isFamily ? ("family" as const) : ("non_family" as const),
            hoursPerWeek: w.hours,
            payRate: w.rate,
          })),
        }
      : undefined;

    calculateMutation.mutate({
      clientName: clientId
        ? ((clients as any[])?.find((c: any) => String(c.id) === clientId)?.firstName || "Client") +
          " " +
          ((clients as any[])?.find((c: any) => String(c.id) === clientId)?.lastName || "")
        : "Prospect",
      waiverType: serviceLine,
      region,
      serviceType,
      hoursPerWeek: useMultiWorker
        ? workers.reduce((s, w) => s + w.hours, 0)
        : hoursPerWeek,
      scheduleType,
      caregiverType,
      caregiverSource,
      payRateOverride: payRateOverride ? Number(payRateOverride) : undefined,
      fitAssessment,
      useMultiWorker,
      staffingModel,
    });
  };

  const handleSave = () => {
    if (!clientId || !results) return;
    saveMutation.mutate({
      clientId: Number(clientId),
      revenue: String(results.weeklyRevenue.toFixed(2)),
      laborCost: String(results.weeklyLabor.toFixed(2)),
      overtimeCost: results.staffingAnalysis
        ? String(results.staffingAnalysis.overtimeCost.toFixed(2))
        : "0",
      grossProfit: String(results.weeklyProfit.toFixed(2)),
      grossMargin: String((results.grossMarginPercentage * 100).toFixed(2)),
      inputJson: JSON.stringify({
        serviceLine,
        serviceType,
        region,
        hoursPerWeek,
        caregiverType,
        scheduleType,
        caregiverSource,
      }),
      resultsJson: JSON.stringify(results),
      profitabilityScore: Math.round(results.profitabilityScore),
      recommendation: results.recommendation,
    });
  };

  const rec = results ? REC_STYLES[results.recommendation] : null;

  return (
    <AppShell title="Profitability Calculator">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-[1440px]">
        {/* Input Panel */}
        <div className="lg:col-span-2 space-y-4">
          {/* Client Selector */}
          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Client (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client or calculate for prospect..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client (prospect)</SelectItem>
                  {(clients as any[] ?? []).map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.firstName} {c.lastName} — {c.serviceLine || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Service Config */}
          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4 text-emerald-600" />
                Service Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Service Line</Label>
                  <Select value={serviceLine} onValueChange={(v) => setServiceLine(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OLTL">OLTL</SelectItem>
                      <SelectItem value="ODP">ODP</SelectItem>
                      <SelectItem value="Skilled">Skilled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Region</Label>
                  <Select value={String(region)} onValueChange={(v) => setRegion(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Region 1 — Western</SelectItem>
                      <SelectItem value="2">Region 2 — North Central</SelectItem>
                      <SelectItem value="3">Region 3 — South Central</SelectItem>
                      <SelectItem value="4">Region 4 — Southeast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Service Type</Label>
                <Select value={serviceType} onValueChange={setServiceType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(serviceTypesData?.types ?? []).map((t: any) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Reimb. Rate ($/hr)</Label>
                  <Input
                    value={rateData ? `$${rateData.rate.toFixed(2)}` : "Loading..."}
                    readOnly
                    className="bg-emerald-500/10 font-mono tabular-nums"
                  />
                </div>
                {!useMultiWorker && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Hours/Week</Label>
                    <Input
                      type="number"
                      value={hoursPerWeek}
                      onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Schedule</Label>
                  <Select value={scheduleType} onValueChange={(v) => setScheduleType(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="mostly_fixed">Mostly Fixed</SelectItem>
                      <SelectItem value="variable">Variable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Caregiver Source</Label>
                  <Select value={caregiverSource} onValueChange={(v) => setCaregiverSource(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="word_of_mouth">Word of Mouth</SelectItem>
                      <SelectItem value="indeed">Indeed</SelectItem>
                      <SelectItem value="job_board">Job Board</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Pay Rate Override (optional)</Label>
                <Input
                  type="number"
                  step="0.25"
                  value={payRateOverride}
                  onChange={(e) => setPayRateOverride(e.target.value)}
                  placeholder={rateData ? `Default: $${rateData.defaultPayRate.toFixed(2)}` : ""}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fit Assessment */}
          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Fit Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: "hasCaregiversAvailable", label: "Caregivers available?" },
                { key: "inServiceArea", label: "In service area?" },
                { key: "scheduleCompatible", label: "Schedule compatible?" },
                { key: "withinCapabilities", label: "Within capabilities?" },
                { key: "familyDynamicsGood", label: "Family dynamics good?" },
              ].map((q) => (
                <div key={q.key} className="flex items-center justify-between">
                  <Label className="text-xs">{q.label}</Label>
                  <Switch
                    checked={(fitAssessment as any)[q.key]}
                    onCheckedChange={(v) =>
                      setFitAssessment({ ...fitAssessment, [q.key]: v })
                    }
                  />
                </div>
              ))}
              <div className="flex items-center justify-between pt-2 border-t">
                <Label className="text-xs">Caregiver type</Label>
                <Select value={caregiverType} onValueChange={(v) => setCaregiverType(v as any)}>
                  <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="non_family">Non-Family</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Multi-Worker */}
          <Card className="bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Multi-Worker Staffing</CardTitle>
                <Switch checked={useMultiWorker} onCheckedChange={setUseMultiWorker} />
              </div>
            </CardHeader>
            {useMultiWorker && (
              <CardContent className="space-y-3">
                {workers.map((w, i) => (
                  <div key={w.id} className="flex items-end gap-2 p-2.5 rounded-lg bg-muted border">
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Hours/wk</Label>
                      <Input
                        type="number"
                        value={w.hours}
                        className="h-8 text-sm"
                        onChange={(e) => {
                          const updated = [...workers];
                          updated[i] = { ...w, hours: Number(e.target.value) };
                          setWorkers(updated);
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Rate ($/hr)</Label>
                      <Input
                        type="number"
                        step="0.25"
                        value={w.rate}
                        className="h-8 text-sm font-mono"
                        onChange={(e) => {
                          const updated = [...workers];
                          updated[i] = { ...w, rate: Number(e.target.value) };
                          setWorkers(updated);
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Family?</Label>
                      <Select
                        value={w.isFamily ? "yes" : "no"}
                        onValueChange={(v) => {
                          const updated = [...workers];
                          updated[i] = { ...w, isFamily: v === "yes" };
                          setWorkers(updated);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no">No</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {workers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground"
                        onClick={() => setWorkers(workers.filter((_, j) => j !== i))}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-emerald-600"
                  onClick={() =>
                    setWorkers([
                      ...workers,
                      {
                        id: Date.now(),
                        name: `Worker ${workers.length + 1}`,
                        hours: 20,
                        rate: rateData?.defaultPayRate ?? 12.5,
                        isFamily: false,
                      },
                    ])
                  }
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Worker
                </Button>
                <div className="text-xs text-muted-foreground bg-muted rounded p-2">
                  Total hours: <span className="font-semibold tabular-nums">{workers.reduce((s, w) => s + w.hours, 0)}</span>/week across {workers.length} worker{workers.length > 1 ? "s" : ""}
                </div>
              </CardContent>
            )}
          </Card>

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={handleCalculate}
            disabled={calculateMutation.isPending}
          >
            {calculateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Calculator className="h-4 w-4 mr-2" />
            )}
            Calculate Profitability
          </Button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 space-y-4">
          {!results && !calculateMutation.isPending && (
            <Card className="bg-card shadow-sm p-12 text-center">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Configure inputs and click "Calculate Profitability" to see results
              </p>
            </Card>
          )}

          {calculateMutation.isPending && (
            <Card className="bg-card shadow-sm p-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Running profitability analysis...</p>
            </Card>
          )}

          {results && (
            <>
              {/* Recommendation Badge */}
              <Card className={`${rec!.bg} shadow-sm p-5`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">Recommendation</p>
                    <p className="text-3xl font-bold text-white mt-1">{rec!.label}</p>
                    <p className="text-sm text-white/70 mt-1">
                      Score: {Math.round(results.profitabilityScore)}/100
                    </p>
                    <p className="text-xs text-white/60 mt-0.5">{results.recommendationText}</p>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                </div>
              </Card>

              {/* P&L Card */}
              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    Profit & Loss
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { period: "Weekly", revenue: results.weeklyRevenue, profit: results.weeklyProfit },
                      { period: "Monthly", revenue: results.monthlyRevenue, profit: results.monthlyProfit },
                      { period: "Annual", revenue: results.annualRevenue, profit: results.annualProfit },
                    ].map((p) => (
                      <div key={p.period} className="text-center p-3 rounded-lg bg-muted">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                          {p.period}
                        </p>
                        <p className="text-lg font-bold text-foreground tabular-nums mt-1">
                          ${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground">revenue</p>
                        <Separator className="my-2" />
                        <p className={`text-base font-bold tabular-nums ${p.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          ${p.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground">profit</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Rate Breakdown */}
              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Rate Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-2 rounded-lg border">
                      <p className="text-[10px] uppercase text-muted-foreground">Reimbursement</p>
                      <p className="text-lg font-bold text-foreground tabular-nums font-mono">${results.reimbursementRate.toFixed(2)}</p>
                    </div>
                    <div className="p-2 rounded-lg border">
                      <p className="text-[10px] uppercase text-muted-foreground">Caregiver Pay</p>
                      <p className="text-lg font-bold text-foreground tabular-nums font-mono">${results.caregiverPay.toFixed(2)}</p>
                    </div>
                    <div className="p-2 rounded-lg border">
                      <p className="text-[10px] uppercase text-muted-foreground">Margin/hr</p>
                      <p className={`text-lg font-bold tabular-nums font-mono ${results.grossMarginPerHour >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        ${results.grossMarginPerHour.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Risk Indicators */}
              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Risk Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Gross Margin",
                        value: `${(results.grossMarginPercentage * 100).toFixed(1)}%`,
                        color: results.grossMarginPercentage >= 0.3 ? "text-emerald-600" : results.grossMarginPercentage >= 0.2 ? "text-amber-600" : "text-red-600",
                      },
                      {
                        label: "LTV:CAC",
                        value: `${results.ltvCacRatio.toFixed(1)}:1`,
                        color: results.ltvCacRatio >= 3 ? "text-emerald-600" : results.ltvCacRatio >= 1.5 ? "text-amber-600" : "text-red-600",
                      },
                      {
                        label: "Break-Even",
                        value: results.breakEvenMonths === Infinity ? "Never" : `${results.breakEvenMonths.toFixed(1)} mo`,
                        color: results.breakEvenMonths <= 6 ? "text-blue-600" : results.breakEvenMonths <= 12 ? "text-amber-600" : "text-red-600",
                      },
                      {
                        label: "Churn Risk",
                        value: `${(results.churnProbability * 100).toFixed(0)}%`,
                        color: results.churnProbability <= 0.5 ? "text-emerald-600" : results.churnProbability <= 0.75 ? "text-amber-600" : "text-red-600",
                      },
                    ].map((m) => (
                      <div key={m.label} className="p-3 rounded-lg border text-center">
                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
                          {m.label}
                        </p>
                        <p className={`text-xl font-bold tabular-nums mt-1 ${m.color}`}>
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Staffing Analysis (if multi-worker) */}
              {results.staffingAnalysis && (
                <Card className="bg-card shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Staffing Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                      <div className="p-2 rounded-lg bg-muted">
                        <p className="text-[10px] text-muted-foreground uppercase">Regular Hrs</p>
                        <p className="text-lg font-bold tabular-nums">{results.staffingAnalysis.totalRegularHours.toFixed(1)}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted">
                        <p className="text-[10px] text-muted-foreground uppercase">OT Hrs</p>
                        <p className="text-lg font-bold tabular-nums text-amber-600">{results.staffingAnalysis.totalOvertimeHours.toFixed(1)}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted">
                        <p className="text-[10px] text-muted-foreground uppercase">OT Cost</p>
                        <p className="text-lg font-bold tabular-nums text-red-600">${results.staffingAnalysis.overtimeCost.toFixed(2)}</p>
                      </div>
                    </div>
                    {results.staffingAnalysis.optimalWorkerCount > results.staffingAnalysis.workerCount && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-700">
                          Consider adding workers. Optimal: <span className="font-semibold">{results.staffingAnalysis.optimalWorkerCount}</span> workers to minimize overtime.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Scoring Breakdown */}
              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { label: "LTV:CAC Score", weight: "25%", value: results.ltvCacRatio >= 5 ? 100 : results.ltvCacRatio >= 4 ? 90 : results.ltvCacRatio >= 3 ? 80 : results.ltvCacRatio >= 2 ? 50 : 25 },
                      { label: "Margin Score", weight: "25%", value: results.grossMarginPercentage >= 0.4 ? 100 : results.grossMarginPercentage >= 0.3 ? 75 : results.grossMarginPercentage >= 0.25 ? 50 : 25 },
                      { label: "Break-Even Score", weight: "20%", value: results.breakEvenMonths <= 3 ? 100 : results.breakEvenMonths <= 6 ? 75 : results.breakEvenMonths <= 9 ? 50 : 25 },
                      { label: "Churn Score", weight: "15%", value: results.churnProbability <= 0.3 ? 100 : results.churnProbability <= 0.5 ? 75 : results.churnProbability <= 0.75 ? 25 : 0 },
                      { label: "Fit Score", weight: "15%", value: results.fitScore },
                    ].map((s) => (
                      <div key={s.label} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-[110px]">{s.label}</span>
                        <span className="text-[10px] text-muted-foreground w-[32px] text-right">{s.weight}</span>
                        <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${s.value >= 75 ? "bg-emerald-500" : s.value >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${s.value}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold tabular-nums w-[32px] text-right">{Math.round(s.value)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={!clientId || clientId === "none" || saveMutation.isPending}
                  onClick={handleSave}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : saveMutation.isSuccess ? (
                    <CheckCircle className="h-4 w-4 mr-2 text-emerald-600" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {clientId && clientId !== "none" ? "Save to Client" : "Select client to save"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
