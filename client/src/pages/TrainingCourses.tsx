import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { GraduationCap, BookOpen, Clock, Award, Send, Eye } from "lucide-react";

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
  MyODP: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
  Custom: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  External: "bg-muted text-muted-foreground",
};

const MOCK_WORKERS = [
  { id: 1, name: "Maria Santos", track: "OLTL", required: 12, completed: 10, pending: 1, overdue: 1, hoursComplete: 10, hoursRequired: 12 },
  { id: 2, name: "Chen Wei", track: "OLTL", required: 12, completed: 12, pending: 0, overdue: 0, hoursComplete: 12, hoursRequired: 12 },
  { id: 3, name: "James Wilson", track: "ODP", required: 24, completed: 18, pending: 4, overdue: 2, hoursComplete: 18, hoursRequired: 24 },
  { id: 4, name: "Sarah Thompson", track: "Skilled", required: 30, completed: 25, pending: 5, overdue: 0, hoursComplete: 25, hoursRequired: 30 },
  { id: 5, name: "Andre Brooks", track: "ODP", required: 24, completed: 6, pending: 10, overdue: 8, hoursComplete: 6, hoursRequired: 24 },
];

export default function TrainingCourses() {
  return (
    <AppShell title="Training & Courses">
      <div className="space-y-4 max-w-[1440px]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 border-l-4 border-l-emerald-500 bg-card shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Compliant</p>
            <p className="text-2xl font-bold text-emerald-600 tabular-nums">2</p>
            <p className="text-xs text-muted-foreground">of 5 workers</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-amber-500 bg-card shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">In Progress</p>
            <p className="text-2xl font-bold text-amber-600 tabular-nums">2</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-red-500 bg-card shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Overdue</p>
            <p className="text-2xl font-bold text-red-600 tabular-nums">1</p>
          </Card>
          <Card className="p-4 border-l-4 border-l-blue-500 bg-card shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Courses</p>
            <p className="text-2xl font-bold text-foreground tabular-nums">23</p>
          </Card>
        </div>

        <Tabs defaultValue="assignments">
          <TabsList>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="oltl">OLTL Track</TabsTrigger>
            <TabsTrigger value="odp">ODP Track</TabsTrigger>
            <TabsTrigger value="skilled">Skilled Track</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="mt-4">
            <Card className="bg-card shadow-sm overflow-hidden">
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
                  {MOCK_WORKERS.map((w) => (
                    <TableRow key={w.id} className={w.overdue > 0 ? "bg-red-50/20" : ""}>
                      <TableCell className="font-medium text-sm">{w.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{w.track}</Badge></TableCell>
                      <TableCell className="text-right tabular-nums">{w.required}</TableCell>
                      <TableCell className="text-right tabular-nums text-emerald-600 font-medium">{w.completed}</TableCell>
                      <TableCell className="text-right tabular-nums">{w.pending}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {w.overdue > 0 ? <span className="text-red-600 font-semibold">{w.overdue}</span> : "0"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={(w.hoursComplete / w.hoursRequired) * 100} className="h-2 flex-1" />
                          <span className="text-[10px] text-muted-foreground tabular-nums w-14 text-right">{w.hoursComplete}/{w.hoursRequired}h</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600"><Send className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
                          <Badge variant="outline" className={`text-[9px] ${SOURCE_STYLES[course.source]}`}>{course.source}</Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="h-3 w-3" />{course.hours}h
                          </span>
                          <Badge variant="outline" className="text-[9px]">{course.initial ? "Initial" : "Annual"}</Badge>
                        </div>
                      </div>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          );})}
        </Tabs>
      </div>
    </AppShell>
  );
}
