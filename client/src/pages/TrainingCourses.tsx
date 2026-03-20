import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import {
  GraduationCap,
  BookOpen,
  Clock,
  Send,
  Eye,
  Plus,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Users,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const TRACK_REQUIREMENTS = {
  OLTL: [
    { course: "Body Mechanics", hours: 2, initial: true, source: "Nevvon" },
    { course: "Nutrition & Meal Prep", hours: 1.5, initial: true, source: "Nevvon" },
    { course: "Vital Signs", hours: 2, initial: true, source: "Nevvon" },
    { course: "Emergency Response", hours: 2, initial: true, source: "Nevvon" },
    { course: "Infection Control", hours: 1.5, initial: true, source: "Nevvon" },
    { course: "Communication Skills", hours: 1, initial: true, source: "Nevvon" },
    { course: "HIPAA Compliance", hours: 1, initial: false, source: "Custom" },
    { course: "Mandated Reporter", hours: 2, initial: false, source: "Custom" },
    { course: "CPR/First Aid", hours: 4, initial: false, source: "External" },
  ],
  ODP: [
    { course: "Person-Centered Practices", hours: 4, initial: true, source: "MyODP" },
    { course: "Abuse Prevention", hours: 3, initial: true, source: "MyODP" },
    { course: "Individual Rights", hours: 2, initial: true, source: "MyODP" },
    { course: "Incident Reporting", hours: 2, initial: true, source: "MyODP" },
    { course: "ISP Implementation", hours: 3, initial: true, source: "MyODP" },
    { course: "HIPAA Compliance", hours: 1, initial: false, source: "Custom" },
    { course: "CPR/First Aid", hours: 4, initial: false, source: "External" },
  ],
  Skilled: [
    { course: "CE: Clinical Updates", hours: 10, initial: false, source: "External" },
    { course: "CE: Pharmacology", hours: 5, initial: false, source: "External" },
    { course: "CE: Ethics", hours: 5, initial: false, source: "External" },
    { course: "HIPAA Compliance", hours: 1, initial: false, source: "Custom" },
    { course: "CPR/First Aid", hours: 4, initial: false, source: "External" },
  ],
};

const SOURCE_STYLES: Record<string, string> = {
  Nevvon: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  NEVVON: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  MyODP: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  MYODP: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  Custom: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  CUSTOM: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  External: "bg-muted text-muted-foreground",
  EXTERNAL: "bg-muted text-muted-foreground",
};

const STATUS_STYLES: Record<string, string> = {
  assigned: "bg-muted text-foreground",
  in_progress: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  expired: "bg-red-500/10 text-red-700 dark:text-red-400",
};

function AssignTrackSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const { data: employees } = trpc.employees.list.useQuery();
  const [employeeId, setEmployeeId] = useState("");
  const [track, setTrack] = useState<"OLTL" | "ODP" | "Skilled">("OLTL");

  const assignMutation = trpc.training.assignTrack.useMutation({
    onSuccess: (data) => {
      utils.training.list.invalidate();
      utils.training.getStats.invalidate();
      utils.training.getWorkerSummaries.invalidate();
      onOpenChange(false);
      toast.success(`Assigned ${(data as any)?.count || 0} courses from ${track} track`);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[420px]">
        <SheetHeader>
          <SheetTitle>Assign Training Track</SheetTitle>
          <SheetDescription>Assign all required courses for a service line track to a worker.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div>
            <Label>Worker</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger><SelectValue placeholder="Select worker..." /></SelectTrigger>
              <SelectContent>
                {(employees as any[] ?? []).map((e: any) => (
                  <SelectItem key={e.id} value={String(e.id)}>
                    {e.legalFirstName || e.preferredName} {e.legalLastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Training Track</Label>
            <Select value={track} onValueChange={(v) => setTrack(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="OLTL">OLTL (9 courses, 17h)</SelectItem>
                <SelectItem value="ODP">ODP (7 courses, 19h)</SelectItem>
                <SelectItem value="Skilled">Skilled (5 courses, 25h)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs font-medium text-foreground mb-2">Courses to assign:</p>
            <div className="space-y-1">
              {TRACK_REQUIREMENTS[track].map((c) => (
                <div key={c.course} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{c.course}</span>
                  <span className="tabular-nums text-muted-foreground">{c.hours}h</span>
                </div>
              ))}
            </div>
          </div>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={!employeeId || assignMutation.isPending}
            onClick={() => assignMutation.mutate({ employeeId: Number(employeeId), track })}
          >
            {assignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Assign {TRACK_REQUIREMENTS[track].length} Courses
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function WorkerDetailDialog({
  open,
  onOpenChange,
  employeeId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  employeeId: number | null;
}) {
  const utils = trpc.useUtils();
  const { data: records, isLoading } = trpc.training.list.useQuery(
    { employeeId: employeeId! },
    { enabled: !!employeeId }
  );

  const updateMutation = trpc.training.update.useMutation({
    onSuccess: () => {
      utils.training.list.invalidate();
      utils.training.getStats.invalidate();
      utils.training.getWorkerSummaries.invalidate();
      toast.success("Training record updated");
    },
  });

  const markComplete = (id: number) => {
    updateMutation.mutate({ id, status: "completed" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Training Records</DialogTitle>
          <DialogDescription>Individual course progress and completion status</DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(records as any[] ?? []).map((r: any) => (
                <TableRow key={r.id} className={r.status === "expired" ? "bg-red-50/20" : ""}>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{r.courseName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {r.isInitial ? "Pre-service" : "Annual"} · {r.trackRequirement}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[9px] ${SOURCE_STYLES[r.courseSource] || ""}`}>
                      {r.courseSource}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-sm">{r.hoursCredit}h</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${STATUS_STYLES[r.status] || ""}`}>
                      {(r.status || "assigned").replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {r.status !== "completed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-emerald-600"
                        onClick={() => markComplete(r.id)}
                        disabled={updateMutation.isPending}
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Complete
                      </Button>
                    )}
                    {r.status === "completed" && r.completedDate && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(r.completedDate).toLocaleDateString()}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {(records as any[] ?? []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No training records assigned
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function TrainingCourses() {
  const [assignOpen, setAssignOpen] = useState(false);
  const [detailEmployeeId, setDetailEmployeeId] = useState<number | null>(null);

  const { data: stats } = trpc.training.getStats.useQuery();
  const { data: workerSummaries, isLoading } = trpc.training.getWorkerSummaries.useQuery();

  return (
    <AppShell
      title="Training & Courses"
      actions={
        <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => setAssignOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Assign Track
        </Button>
      }
    >
      <div className="space-y-4 max-w-[1440px]">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-4 border-l-4 border-l-emerald-500 bg-card shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Compliant</p>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">{stats?.compliant ?? 0}</p>
            <p className="text-xs text-muted-foreground">of {stats?.totalEmployees ?? 0} workers</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-blue-500 bg-card shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">In Progress</p>
            <p className="text-2xl font-bold text-blue-600 tabular-nums">{stats?.inProgress ?? 0}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-red-500 bg-card shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Overdue</p>
            <p className="text-2xl font-bold text-red-600 tabular-nums">{stats?.overdue ?? 0}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-amber-500 bg-card shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Records</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{stats?.totalCourses ?? 0}</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-purple-500 bg-card shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Workers Tracked</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">{stats?.totalEmployees ?? 0}</p>
          </Card>
        </div>

        <Tabs defaultValue="assignments">
          <TabsList>
            <TabsTrigger value="assignments">Worker Progress</TabsTrigger>
            <TabsTrigger value="oltl">OLTL Track</TabsTrigger>
            <TabsTrigger value="odp">ODP Track</TabsTrigger>
            <TabsTrigger value="skilled">Skilled Track</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="mt-4">
            <Card className="bg-card shadow-sm overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading training data...</span>
                </div>
              ) : (workerSummaries ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <GraduationCap className="h-8 w-8 mb-2" />
                  <p className="text-sm">No training assignments yet</p>
                  <p className="text-xs mt-1">Use "Assign Track" to assign courses to workers</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Worker</TableHead>
                      <TableHead>Track</TableHead>
                      <TableHead className="text-right">Required</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead className="text-right">Overdue</TableHead>
                      <TableHead className="w-[160px]">Hours Progress</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(workerSummaries as any[]).map((w: any) => (
                      <TableRow key={w.id} className={w.overdue > 0 ? "bg-red-50/20" : ""}>
                        <TableCell className="font-medium text-sm">{w.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">{w.track}</Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{w.required}</TableCell>
                        <TableCell className="text-right tabular-nums text-emerald-600 font-medium">
                          {w.completed}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{w.pending}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {w.overdue > 0 ? (
                            <span className="text-red-600 font-semibold flex items-center justify-end gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {w.overdue}
                            </span>
                          ) : (
                            "0"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={w.hoursRequired > 0 ? (w.hoursComplete / w.hoursRequired) * 100 : 0}
                              className="h-2 flex-1"
                            />
                            <span className="text-[10px] text-muted-foreground tabular-nums w-14 text-right">
                              {w.hoursComplete}/{w.hoursRequired}h
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => setDetailEmployeeId(w.id)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          {(["oltl", "odp", "skilled"] as const).map((track) => {
            const trackKey = { oltl: "OLTL", odp: "ODP", skilled: "Skilled" }[track] as keyof typeof TRACK_REQUIREMENTS;
            return (
              <TabsContent key={track} value={track} className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {TRACK_REQUIREMENTS[trackKey]?.map((course) => (
                    <Card key={course.course} className="bg-card shadow-sm p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium text-foreground">{course.course}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Badge
                              variant="outline"
                              className={`text-[9px] ${SOURCE_STYLES[course.source]}`}
                            >
                              {course.source}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {course.hours}h
                            </span>
                            <Badge variant="outline" className="text-[9px]">
                              {course.initial ? "Initial" : "Annual"}
                            </Badge>
                          </div>
                        </div>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      <AssignTrackSheet open={assignOpen} onOpenChange={setAssignOpen} />
      <WorkerDetailDialog
        open={!!detailEmployeeId}
        onOpenChange={(v) => !v && setDetailEmployeeId(null)}
        employeeId={detailEmployeeId}
      />
    </AppShell>
  );
}
