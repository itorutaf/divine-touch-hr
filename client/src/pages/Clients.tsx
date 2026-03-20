import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Search,
  Plus,
  Eye,
  TrendingUp,
  MapPin,
  Phone,
  Loader2,
  Users,
  UserPlus,
  Pause,
  UserX,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STATUS_STYLES: Record<string, string> = {
  referral: "bg-muted text-foreground",
  assessment: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  on_hold: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  discharged: "bg-red-500/10 text-red-700 dark:text-red-400",
};

const SERVICE_LINE_STYLES: Record<string, string> = {
  OLTL: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  ODP: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
  Skilled: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",
};

const MCO_OPTIONS = [
  "UPMC Community HealthChoices",
  "AmeriHealth Caritas",
  "PA Health & Wellness",
  "Highmark Wholecare",
];

function CreateClientSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    county: "",
    serviceLine: "" as "" | "OLTL" | "ODP" | "Skilled",
    region: 4,
    mcoId: "",
    referralSource: "",
    serviceType: "",
  });

  const createMutation = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      utils.clients.getStats.invalidate();
      onOpenChange(false);
      setForm({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        county: "",
        serviceLine: "",
        region: 4,
        mcoId: "",
        referralSource: "",
        serviceType: "",
      });
      toast.success("Client created — new referral added");
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Client Referral</SheetTitle>
          <SheetDescription>Add a new client intake. Status will default to "referral".</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>First Name *</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(215) 555-0000" />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
            </div>
          </div>
          <div>
            <Label>County</Label>
            <Input value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} placeholder="Philadelphia" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Service Line</Label>
              <Select value={form.serviceLine} onValueChange={(v) => setForm({ ...form, serviceLine: v as any })}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="OLTL">OLTL</SelectItem>
                  <SelectItem value="ODP">ODP</SelectItem>
                  <SelectItem value="Skilled">Skilled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Region</Label>
              <Select value={String(form.region)} onValueChange={(v) => setForm({ ...form, region: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((r) => (
                    <SelectItem key={r} value={String(r)}>Region {r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>MCO</Label>
            <Select value={form.mcoId} onValueChange={(v) => setForm({ ...form, mcoId: v })}>
              <SelectTrigger><SelectValue placeholder="Select MCO..." /></SelectTrigger>
              <SelectContent>
                {MCO_OPTIONS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Service Type</Label>
            <Input value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })} placeholder="PAS (CSLA), Companion, etc." />
          </div>
          <div>
            <Label>Referral Source</Label>
            <Input value={form.referralSource} onChange={(e) => setForm({ ...form, referralSource: e.target.value })} placeholder="Hospital, MCO SC name, Self-referral..." />
          </div>
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4"
            disabled={!form.firstName || !form.lastName || createMutation.isPending}
            onClick={() => {
              const { serviceLine, ...rest } = form;
              createMutation.mutate({
                ...rest,
                ...(serviceLine ? { serviceLine } : {}),
              });
            }}
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Create Client
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Clients() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceLineFilter, setServiceLineFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);

  const { data: clients, isLoading } = trpc.clients.list.useQuery();
  const { data: stats } = trpc.clients.getStats.useQuery();

  const filtered = (clients ?? []).filter((c: any) => {
    const matchesSearch =
      !search ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      (c.county || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesLine = serviceLineFilter === "all" || c.serviceLine === serviceLineFilter;
    return matchesSearch && matchesStatus && matchesLine;
  });

  return (
    <AppShell
      title="Clients"
      actions={
        <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Client
        </Button>
      }
    >
      <div className="space-y-4 max-w-[1440px]">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Total", count: stats?.total ?? 0, color: "border-l-slate-400", icon: Users },
            { label: "Active", count: stats?.active ?? 0, color: "border-l-emerald-500", icon: Users },
            { label: "Referrals", count: stats?.referral ?? 0, color: "border-l-blue-500", icon: UserPlus },
            { label: "Assessment", count: stats?.assessment ?? 0, color: "border-l-purple-500", icon: UserPlus },
            { label: "On Hold", count: stats?.onHold ?? 0, color: "border-l-amber-500", icon: Pause },
          ].map((s) => (
            <Card key={s.label} className={`p-4 border-l-4 ${s.color} bg-card shadow-sm`}>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold text-foreground tabular-nums">{s.count}</p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="bg-card shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients by name or county..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="referral">Referral</SelectItem>
                <SelectItem value="assessment">Assessment</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="discharged">Discharged</SelectItem>
              </SelectContent>
            </Select>
            <Select value={serviceLineFilter} onValueChange={setServiceLineFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Service Line" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Lines</SelectItem>
                <SelectItem value="OLTL">OLTL</SelectItem>
                <SelectItem value="ODP">ODP</SelectItem>
                <SelectItem value="Skilled">Skilled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Table */}
        <Card className="bg-card shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Loading clients...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <UserX className="h-8 w-8 mb-2" />
              <p className="text-sm">No clients found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Service Line</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>MCO</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Referral Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((client: any) => (
                  <TableRow
                    key={client.id}
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => setLocation(`/clients/${client.id}`)}
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {client.firstName} {client.lastName}
                        </p>
                        {client.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.serviceLine ? (
                        <Badge variant="outline" className={`text-[10px] ${SERVICE_LINE_STYLES[client.serviceLine] || ""}`}>
                          {client.serviceLine}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${STATUS_STYLES[client.status] || ""}`}>
                        {(client.status || "referral").replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{client.mcoId || "—"}</TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {client.region ? `R${client.region}` : "—"}{client.county ? ` · ${client.county}` : ""}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[160px] truncate">
                      {client.referralSource || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setLocation(`/clients/${client.id}`)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={() => setLocation(`/clients/profitability?clientId=${client.id}`)}>
                          <TrendingUp className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      <CreateClientSheet open={createOpen} onOpenChange={setCreateOpen} />
    </AppShell>
  );
}
