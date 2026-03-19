import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ShieldCheck, CheckCircle2, XCircle, Download, FileText, AlertTriangle,
} from "lucide-react";

const WORKER_AUDIT = [
  { id: 1, name: "Maria Santos", clearances: true, i9: true, training: false, docuSign: true, payroll: true, evv: true, score: 83 },
  { id: 2, name: "Chen Wei", clearances: true, i9: true, training: true, docuSign: true, payroll: true, evv: true, score: 100 },
  { id: 3, name: "James Wilson", clearances: false, i9: true, training: false, docuSign: true, payroll: false, evv: false, score: 33 },
  { id: 4, name: "Fatima Ali", clearances: true, i9: true, training: true, docuSign: true, payroll: true, evv: true, score: 100 },
  { id: 5, name: "Andre Brooks", clearances: false, i9: false, training: false, docuSign: false, payroll: false, evv: false, score: 0 },
  { id: 6, name: "Sarah Thompson", clearances: true, i9: true, training: true, docuSign: true, payroll: true, evv: true, score: 100 },
  { id: 7, name: "Lisa Park", clearances: true, i9: true, training: true, docuSign: true, payroll: true, evv: false, score: 83 },
  { id: 8, name: "Miguel Rodriguez", clearances: true, i9: true, training: true, docuSign: true, payroll: true, evv: true, score: 100 },
];

const CLIENT_AUDIT = [
  { id: 1, name: "Patricia Moore", servicePlan: true, authActive: true, visitsDoc: true, evvCompliant: false, score: 75 },
  { id: 2, name: "Robert Chen", servicePlan: true, authActive: true, visitsDoc: true, evvCompliant: true, score: 100 },
  { id: 3, name: "Helen Washington", servicePlan: true, authActive: true, visitsDoc: true, evvCompliant: true, score: 100 },
  { id: 4, name: "James Rodriguez", servicePlan: true, authActive: true, visitsDoc: false, evvCompliant: true, score: 75 },
];

function CheckIcon({ ok }: { ok: boolean }) {
  return ok
    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
    : <XCircle className="h-4 w-4 text-red-400 mx-auto" />;
}

function ScoreBadge({ score }: { score: number }) {
  const color = score === 100 ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : score >= 75 ? "bg-amber-500/10 text-amber-700 dark:text-amber-400" : "bg-red-500/10 text-red-700 dark:text-red-400";
  return <Badge className={`text-[10px] tabular-nums ${color}`}>{score}%</Badge>;
}

export default function AuditReadiness() {
  const avgWorkerScore = Math.round(WORKER_AUDIT.reduce((s, w) => s + w.score, 0) / WORKER_AUDIT.length);
  const avgClientScore = Math.round(CLIENT_AUDIT.reduce((s, c) => s + c.score, 0) / CLIENT_AUDIT.length);
  const overallScore = Math.round((avgWorkerScore + avgClientScore) / 2);
  const fullyCompliant = WORKER_AUDIT.filter((w) => w.score === 100).length;

  return (
    <AppShell
      title="Audit Readiness"
      actions={
        <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm">
          <Download className="h-4 w-4 mr-1.5" /> Generate Audit Package
        </Button>
      }
    >
      <div className="space-y-4 max-w-[1440px]">
        {/* Overall Score */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={`p-5 border-l-4 bg-card shadow-sm ${overallScore >= 90 ? "border-l-emerald-500" : overallScore >= 70 ? "border-l-amber-500" : "border-l-red-500"}`}>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Overall Readiness</p>
            <div className="flex items-end gap-2 mt-1">
              <span className="text-3xl font-bold tabular-nums text-foreground">{overallScore}%</span>
              <ShieldCheck className={`h-6 w-6 mb-1 ${overallScore >= 90 ? "text-emerald-500" : "text-amber-500"}`} />
            </div>
            <Progress value={overallScore} className="h-2 mt-3" />
          </Card>
          <Card className="p-5 border-l-4 border-l-blue-500 bg-card shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Worker Compliance</p>
            <p className="text-3xl font-bold tabular-nums text-foreground mt-1">{avgWorkerScore}%</p>
            <p className="text-xs text-muted-foreground mt-1">{fullyCompliant}/{WORKER_AUDIT.length} fully compliant</p>
          </Card>
          <Card className="p-5 border-l-4 border-l-emerald-500 bg-card shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Client Compliance</p>
            <p className="text-3xl font-bold tabular-nums text-foreground mt-1">{avgClientScore}%</p>
            <p className="text-xs text-muted-foreground mt-1">{CLIENT_AUDIT.filter((c) => c.score === 100).length}/{CLIENT_AUDIT.length} fully compliant</p>
          </Card>
          <Card className="p-5 border-l-4 border-l-red-500 bg-card shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Action Items</p>
            <p className="text-3xl font-bold text-red-600 tabular-nums mt-1">{WORKER_AUDIT.filter((w) => w.score < 100).length + CLIENT_AUDIT.filter((c) => c.score < 100).length}</p>
            <p className="text-xs text-muted-foreground mt-1">records need attention</p>
          </Card>
        </div>

        <Tabs defaultValue="workers">
          <TabsList>
            <TabsTrigger value="workers">Worker Checklist</TabsTrigger>
            <TabsTrigger value="clients">Client Checklist</TabsTrigger>
          </TabsList>

          <TabsContent value="workers" className="mt-4">
            <Card className="bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Worker</TableHead>
                    <TableHead className="text-center">Clearances</TableHead>
                    <TableHead className="text-center">I-9</TableHead>
                    <TableHead className="text-center">Training</TableHead>
                    <TableHead className="text-center">DocuSign</TableHead>
                    <TableHead className="text-center">Payroll</TableHead>
                    <TableHead className="text-center">EVV/HHA</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {WORKER_AUDIT.sort((a, b) => a.score - b.score).map((w) => (
                    <TableRow key={w.id} className={w.score < 50 ? "bg-red-500/10" : w.score < 100 ? "bg-amber-500/5" : ""}>
                      <TableCell className="font-medium text-sm">{w.name}</TableCell>
                      <TableCell><CheckIcon ok={w.clearances} /></TableCell>
                      <TableCell><CheckIcon ok={w.i9} /></TableCell>
                      <TableCell><CheckIcon ok={w.training} /></TableCell>
                      <TableCell><CheckIcon ok={w.docuSign} /></TableCell>
                      <TableCell><CheckIcon ok={w.payroll} /></TableCell>
                      <TableCell><CheckIcon ok={w.evv} /></TableCell>
                      <TableCell className="text-center"><ScoreBadge score={w.score} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="mt-4">
            <Card className="bg-card shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-center">Service Plan</TableHead>
                    <TableHead className="text-center">Auth Active</TableHead>
                    <TableHead className="text-center">Visits Documented</TableHead>
                    <TableHead className="text-center">EVV Compliant</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {CLIENT_AUDIT.sort((a, b) => a.score - b.score).map((c) => (
                    <TableRow key={c.id} className={c.score < 100 ? "bg-amber-500/5" : ""}>
                      <TableCell className="font-medium text-sm">{c.name}</TableCell>
                      <TableCell><CheckIcon ok={c.servicePlan} /></TableCell>
                      <TableCell><CheckIcon ok={c.authActive} /></TableCell>
                      <TableCell><CheckIcon ok={c.visitsDoc} /></TableCell>
                      <TableCell><CheckIcon ok={c.evvCompliant} /></TableCell>
                      <TableCell className="text-center"><ScoreBadge score={c.score} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
