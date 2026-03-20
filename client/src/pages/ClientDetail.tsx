import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  Phone,
  Mail,
  MapPin,
  User,
  TrendingUp,
  Clock,
  Edit,
  ArrowLeft,
  Loader2,
  Save,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useState } from "react";

const SERVICE_LINE_STYLES: Record<string, string> = {
  OLTL: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  ODP: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Skilled: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
};

const STATUS_STYLES: Record<string, string> = {
  referral: "bg-muted text-foreground",
  assessment: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  on_hold: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  discharged: "bg-red-500/10 text-red-700 dark:text-red-400",
};

function InfoRow({ label, value, className }: { label: string; value: string | undefined | null; className?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium text-right max-w-[200px] ${className || ""}`}>{value || "—"}</span>
    </div>
  );
}

export default function ClientDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/clients/:id");
  const clientId = Number(params?.id);
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);

  const { data: client, isLoading } = trpc.clients.getById.useQuery(
    { id: clientId },
    { enabled: !!clientId }
  );

  const { data: authorizations } = trpc.authorizations.getByClientId.useQuery(
    { clientId },
    { enabled: !!clientId }
  );

  const updateMutation = trpc.clients.update.useMutation({
    onSuccess: () => {
      utils.clients.getById.invalidate({ id: clientId });
      utils.clients.list.invalidate();
      toast.success("Client updated");
    },
  });

  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const startEditing = () => {
    if (!client) return;
    setEditForm({
      firstName: (client as any).firstName,
      lastName: (client as any).lastName,
      dob: (client as any).dob || "",
      phone: (client as any).phone || "",
      email: (client as any).email || "",
      addressLine1: (client as any).addressLine1 || "",
      city: (client as any).city || "",
      state: (client as any).state || "",
      zip: (client as any).zip || "",
      county: (client as any).county || "",
      serviceType: (client as any).serviceType || "",
      referralSource: (client as any).referralSource || "",
      emergencyContactName: (client as any).emergencyContactName || "",
      emergencyContactPhone: (client as any).emergencyContactPhone || "",
      emergencyContactRelation: (client as any).emergencyContactRelation || "",
      serviceCoordinatorName: (client as any).serviceCoordinatorName || "",
      serviceCoordinatorPhone: (client as any).serviceCoordinatorPhone || "",
      serviceCoordinatorEmail: (client as any).serviceCoordinatorEmail || "",
      notes: (client as any).notes || "",
    });
    setEditing(true);
  };

  const saveEdits = () => {
    updateMutation.mutate({ id: clientId, ...editForm });
    setEditing(false);
  };

  const changeStatus = (newStatus: string) => {
    updateMutation.mutate({
      id: clientId,
      status: newStatus as any,
    });
  };

  if (isLoading || !client) {
    return (
      <AppShell title="Client Detail">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading client...</span>
        </div>
      </AppShell>
    );
  }

  const c = client as any;

  return (
    <AppShell
      title="Client Detail"
      actions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setLocation("/clients")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          {editing ? (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={saveEdits} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Save
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={startEditing}>
              <Edit className="h-4 w-4 mr-1" /> Edit
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6 max-w-[1440px]">
        {/* Header */}
        <Card className="bg-card shadow-sm p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <User className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-foreground">{c.firstName} {c.lastName}</h2>
                  {c.serviceLine && (
                    <Badge variant="outline" className={SERVICE_LINE_STYLES[c.serviceLine]}>{c.serviceLine}</Badge>
                  )}
                  <Badge className={`${STATUS_STYLES[c.status] || ""}`}>{(c.status || "referral").replace("_", " ")}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  {c.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{c.phone}</span>}
                  {c.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{c.email}</span>}
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{c.region ? `Region ${c.region}` : "—"}{c.county ? ` · ${c.county}` : ""}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">MCO</p>
              <p className="text-sm font-medium text-foreground">{c.mcoId || "—"}</p>
              {c.startDate && (
                <p className="text-xs text-muted-foreground mt-1">Start: {new Date(c.startDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Status progression */}
        <Card className="bg-card shadow-sm p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">Status Progression</p>
          <div className="flex gap-2">
            {["referral", "assessment", "active", "on_hold", "discharged"].map((s) => (
              <Button
                key={s}
                variant={c.status === s ? "default" : "outline"}
                size="sm"
                className={c.status === s ? "bg-emerald-600" : ""}
                onClick={() => changeStatus(s)}
                disabled={c.status === s}
              >
                {s.replace("_", " ")}
              </Button>
            ))}
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="authorizations">Authorizations</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Personal Information</CardTitle></CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  {editing ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div><Label className="text-xs">First Name</Label><Input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} /></div>
                        <div><Label className="text-xs">Last Name</Label><Input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} /></div>
                      </div>
                      <div><Label className="text-xs">Date of Birth</Label><Input type="date" value={editForm.dob} onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })} /></div>
                      <div><Label className="text-xs">Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                      <div><Label className="text-xs">Email</Label><Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} /></div>
                      <div><Label className="text-xs">Address</Label><Input value={editForm.addressLine1} onChange={(e) => setEditForm({ ...editForm, addressLine1: e.target.value })} /></div>
                      <div className="grid grid-cols-3 gap-2">
                        <div><Label className="text-xs">City</Label><Input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} /></div>
                        <div><Label className="text-xs">State</Label><Input value={editForm.state} onChange={(e) => setEditForm({ ...editForm, state: e.target.value })} /></div>
                        <div><Label className="text-xs">ZIP</Label><Input value={editForm.zip} onChange={(e) => setEditForm({ ...editForm, zip: e.target.value })} /></div>
                      </div>
                      <div><Label className="text-xs">County</Label><Input value={editForm.county} onChange={(e) => setEditForm({ ...editForm, county: e.target.value })} /></div>
                    </div>
                  ) : (
                    <>
                      <InfoRow label="Full Name" value={`${c.firstName} ${c.lastName}`} />
                      <InfoRow label="Date of Birth" value={c.dob ? new Date(c.dob).toLocaleDateString() : undefined} />
                      <InfoRow label="Phone" value={c.phone} />
                      <InfoRow label="Email" value={c.email} />
                      <InfoRow label="Address" value={[c.addressLine1, c.city, c.state, c.zip].filter(Boolean).join(", ") || undefined} />
                      <InfoRow label="County" value={c.county} />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Service Information</CardTitle></CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  {editing ? (
                    <div className="space-y-3">
                      <div><Label className="text-xs">Service Type</Label><Input value={editForm.serviceType} onChange={(e) => setEditForm({ ...editForm, serviceType: e.target.value })} /></div>
                      <div><Label className="text-xs">Referral Source</Label><Input value={editForm.referralSource} onChange={(e) => setEditForm({ ...editForm, referralSource: e.target.value })} /></div>
                    </div>
                  ) : (
                    <>
                      <InfoRow label="Service Line" value={c.serviceLine} />
                      <InfoRow label="Service Type" value={c.serviceType} />
                      <InfoRow label="Region" value={c.region ? `Region ${c.region}` : undefined} />
                      <InfoRow label="MCO" value={c.mcoId} />
                      <InfoRow label="Start Date" value={c.startDate ? new Date(c.startDate).toLocaleDateString() : undefined} />
                      <InfoRow label="Referral Source" value={c.referralSource} />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Service Coordinator (MCO)</CardTitle></CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  {editing ? (
                    <div className="space-y-3">
                      <div><Label className="text-xs">Name</Label><Input value={editForm.serviceCoordinatorName} onChange={(e) => setEditForm({ ...editForm, serviceCoordinatorName: e.target.value })} /></div>
                      <div><Label className="text-xs">Phone</Label><Input value={editForm.serviceCoordinatorPhone} onChange={(e) => setEditForm({ ...editForm, serviceCoordinatorPhone: e.target.value })} /></div>
                      <div><Label className="text-xs">Email</Label><Input value={editForm.serviceCoordinatorEmail} onChange={(e) => setEditForm({ ...editForm, serviceCoordinatorEmail: e.target.value })} /></div>
                    </div>
                  ) : (
                    <>
                      <InfoRow label="Name" value={c.serviceCoordinatorName} />
                      <InfoRow label="Phone" value={c.serviceCoordinatorPhone} />
                      <InfoRow label="Email" value={c.serviceCoordinatorEmail} />
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card shadow-sm">
                <CardHeader className="pb-3"><CardTitle className="text-sm">Emergency Contact</CardTitle></CardHeader>
                <CardContent className="space-y-2.5 text-sm">
                  {editing ? (
                    <div className="space-y-3">
                      <div><Label className="text-xs">Name</Label><Input value={editForm.emergencyContactName} onChange={(e) => setEditForm({ ...editForm, emergencyContactName: e.target.value })} /></div>
                      <div><Label className="text-xs">Phone</Label><Input value={editForm.emergencyContactPhone} onChange={(e) => setEditForm({ ...editForm, emergencyContactPhone: e.target.value })} /></div>
                      <div><Label className="text-xs">Relation</Label><Input value={editForm.emergencyContactRelation} onChange={(e) => setEditForm({ ...editForm, emergencyContactRelation: e.target.value })} /></div>
                    </div>
                  ) : (
                    <>
                      <InfoRow label="Name" value={c.emergencyContactName} />
                      <InfoRow label="Phone" value={c.emergencyContactPhone} />
                      <InfoRow label="Relation" value={c.emergencyContactRelation} />
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="authorizations" className="mt-4">
            <Card className="bg-card shadow-sm overflow-hidden">
              {(authorizations ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Clock className="h-8 w-8 mb-2" />
                  <p className="text-sm">No authorizations on file</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Type</TableHead>
                      <TableHead className="text-right">Auth Hrs/Wk</TableHead>
                      <TableHead>Auth #</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(authorizations ?? []).map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.serviceType || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{a.authorizedHoursPerWeek || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-mono">{a.authorizationNumber || "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {a.startDate ? new Date(a.startDate).toLocaleDateString() : "—"} — {a.endDate ? new Date(a.endDate).toLocaleDateString() : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${a.status === "active" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : a.status === "expiring" ? "bg-amber-500/10 text-amber-700" : "bg-red-500/10 text-red-700"}`}>
                            {a.status || "active"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-4">
            <Card className="bg-card shadow-sm p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Client Notes</h3>
              {editing ? (
                <Textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  rows={6}
                  placeholder="Add notes about this client..."
                />
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {c.notes || "No notes recorded."}
                </p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
