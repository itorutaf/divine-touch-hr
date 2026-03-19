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
import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  Calculator,
  Download,
  Save,
  Plus,
  Trash2,
} from "lucide-react";

type Worker = { id: number; name: string; hours: number; rate: number; isFamily: boolean };

const SERVICE_TYPES: Record<string, { label: string; types: { value: string; label: string }[] }> = {
  OLTL: {
    label: "OLTL",
    types: [
      { value: "PAS_CSLA", label: "Personal Assistance (CSLA)" },
      { value: "PAS_Agency", label: "Personal Assistance (Agency)" },
      { value: "PAS_Consumer", label: "Personal Assistance (Consumer)" },
      { value: "Respite_Agency", label: "Respite (Agency)" },
    ],
  },
  ODP: {
    label: "ODP",
    types: [
      { value: "PAS_CSLA", label: "Personal Assistance (CSLA)" },
      { value: "PAS_Agency", label: "Personal Assistance (Agency)" },
    ],
  },
  Skilled: {
    label: "Skilled",
    types: [
      { value: "LPN", label: "LPN" },
      { value: "RN", label: "RN" },
      { value: "OT", label: "Occupational Therapy" },
      { value: "PT", label: "Physical Therapy" },
      { value: "Speech", label: "Speech Therapy" },
    ],
  },
};

const MOCK_RESULTS = {
  weeklyRevenue: 658.08,
  weeklyLabor: 375.0,
  weeklyProfit: 240.62,
  monthlyRevenue: 2849.49,
  monthlyProfit: 1041.87,
  annualRevenue: 34193.85,
  annualProfit: 12502.42,
  reimbursementRate: 21.92,
  grossMarginPercentage: 0.43,
  ltvCacRatio: 4.2,
  breakEvenMonths: 2.8,
  churnProbability: 0.5,
  profitabilityScore: 78,
  recommendation: "YES" as const,
};

const REC_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  STRONG_YES: { bg: "bg-emerald-600", text: "text-white", label: "Strong Yes" },
  YES: { bg: "bg-emerald-500", text: "text-white", label: "Yes" },
  MAYBE: { bg: "bg-amber-500", text: "text-white", label: "Maybe" },
  CAUTION: { bg: "bg-orange-500", text: "text-white", label: "Caution" },
  HARD_NO: { bg: "bg-red-600", text: "text-white", label: "Hard No" },
};

export default function ProfitabilityCalculator() {
  const [serviceLine, setServiceLine] = useState("OLTL");
  const [serviceType, setServiceType] = useState("PAS_CSLA");
  const [region, setRegion] = useState("4");
  const [hours, setHours] = useState("30");
  const [workers, setWorkers] = useState<Worker[]>([
    { id: 1, name: "Worker 1", hours: 30, rate: 12.5, isFamily: false },
  ]);
  const [showResults, setShowResults] = useState(true);

  const rec = REC_STYLES[MOCK_RESULTS.recommendation];

  return (
    <AppShell title="Profitability Calculator">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-[1440px]">
        {/* Input Panel */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="h-4 w-4 text-emerald-600" />
                Client Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Service Line</Label>
                  <Select value={serviceLine} onValueChange={setServiceLine}>
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
                  <Select value={region} onValueChange={setRegion}>
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
                    {SERVICE_TYPES[serviceLine]?.types.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Rate ($/hr)</Label>
                  <Input value="$21.92" readOnly className="bg-emerald-50 font-mono tabular-nums" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Hours/Week</Label>
                  <Input type="number" value={hours} onChange={(e) => setHours(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workers */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Caregiver Assignment</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-emerald-600"
                  onClick={() =>
                    setWorkers([...workers, { id: Date.now(), name: `Worker ${workers.length + 1}`, hours: 20, rate: 12.5, isFamily: false }])
                  }
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Worker
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {workers.map((w, i) => (
                <div key={w.id} className="flex items-end gap-2 p-2.5 rounded-lg bg-slate-50 border">
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px] text-slate-500">Hours/wk</Label>
                    <Input type="number" value={w.hours} className="h-8 text-sm" onChange={() => {}} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label className="text-[10px] text-slate-500">Rate ($/hr)</Label>
                    <Input type="number" value={w.rate} className="h-8 text-sm font-mono" onChange={() => {}} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-slate-500">Family?</Label>
                    <Select value={w.isFamily ? "yes" : "no"}>
                      <SelectTrigger className="h-8 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no">No</SelectItem>
                        <SelectItem value="yes">Yes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {workers.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => setWorkers(workers.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowResults(true)}>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Profitability
          </Button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 space-y-4">
          {showResults && (
            <>
              {/* Recommendation Badge */}
              <Card className={`${rec.bg} shadow-sm p-5`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">Recommendation</p>
                    <p className="text-3xl font-bold text-white mt-1">{rec.label}</p>
                    <p className="text-sm text-white/70 mt-1">Score: {MOCK_RESULTS.profitabilityScore}/100</p>
                  </div>
                  <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
                    <TrendingUp className="h-8 w-8 text-white" />
                  </div>
                </div>
              </Card>

              {/* P&L Card */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-600" />
                    Profit & Loss
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { period: "Weekly", revenue: MOCK_RESULTS.weeklyRevenue, profit: MOCK_RESULTS.weeklyProfit },
                      { period: "Monthly", revenue: MOCK_RESULTS.monthlyRevenue, profit: MOCK_RESULTS.monthlyProfit },
                      { period: "Annual", revenue: MOCK_RESULTS.annualRevenue, profit: MOCK_RESULTS.annualProfit },
                    ].map((p) => (
                      <div key={p.period} className="text-center p-3 rounded-lg bg-slate-50">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">{p.period}</p>
                        <p className="text-lg font-bold text-slate-900 tabular-nums mt-1">
                          ${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-400">revenue</p>
                        <Separator className="my-2" />
                        <p className="text-base font-bold text-emerald-600 tabular-nums">
                          ${p.profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-slate-400">profit</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Indicators */}
              <Card className="bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Risk Indicators</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Gross Margin", value: `${(MOCK_RESULTS.grossMarginPercentage * 100).toFixed(1)}%`, color: "text-emerald-600" },
                      { label: "LTV:CAC", value: `${MOCK_RESULTS.ltvCacRatio.toFixed(1)}:1`, color: "text-emerald-600" },
                      { label: "Break-Even", value: `${MOCK_RESULTS.breakEvenMonths.toFixed(1)} mo`, color: "text-blue-600" },
                      { label: "Churn Risk", value: `${(MOCK_RESULTS.churnProbability * 100).toFixed(0)}%`, color: "text-amber-600" },
                    ].map((m) => (
                      <div key={m.label} className="p-3 rounded-lg border text-center">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500 font-medium">{m.label}</p>
                        <p className={`text-xl font-bold tabular-nums mt-1 ${m.color}`}>{m.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save to Client
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
