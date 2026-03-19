import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Building2,
  Search,
  Plus,
  Eye,
  TrendingUp,
  MapPin,
  Phone,
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  referral: "bg-slate-100 text-slate-700",
  assessment: "bg-blue-50 text-blue-700",
  active: "bg-emerald-50 text-emerald-700",
  on_hold: "bg-amber-50 text-amber-700",
  discharged: "bg-red-50 text-red-700",
};

const SERVICE_LINE_STYLES: Record<string, string> = {
  OLTL: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ODP: "bg-blue-50 text-blue-700 border-blue-200",
  Skilled: "bg-purple-50 text-purple-700 border-purple-200",
};

// Mock data
const MOCK_CLIENTS = [
  { id: 1, firstName: "Patricia", lastName: "Moore", serviceLine: "OLTL", region: 4, status: "active", county: "Philadelphia", phone: "(215) 555-0142", mco: "UPMC CHC", hoursPerWeek: 30, coordinator: "Matt F." },
  { id: 2, firstName: "Robert", lastName: "Chen", serviceLine: "ODP", region: 4, status: "active", county: "Montgomery", phone: "(610) 555-0198", mco: "AmeriHealth Caritas", hoursPerWeek: 40, coordinator: "Matt F." },
  { id: 3, firstName: "Helen", lastName: "Washington", serviceLine: "OLTL", region: 4, status: "active", county: "Delaware", phone: "(610) 555-0267", mco: "PA Health & Wellness", hoursPerWeek: 25, coordinator: "Matt F." },
  { id: 4, firstName: "James", lastName: "Rodriguez", serviceLine: "Skilled", region: 4, status: "active", county: "Philadelphia", phone: "(215) 555-0331", mco: "UPMC CHC", hoursPerWeek: 15, coordinator: "Matt F." },
  { id: 5, firstName: "Dorothy", lastName: "Kim", serviceLine: "OLTL", region: 4, status: "on_hold", county: "Chester", phone: "(484) 555-0102", mco: "AmeriHealth Caritas", hoursPerWeek: 20, coordinator: "Matt F." },
  { id: 6, firstName: "Michael", lastName: "Brown", serviceLine: "ODP", region: 3, status: "referral", county: "Lancaster", phone: "(717) 555-0445", mco: "UPMC CHC", hoursPerWeek: 0, coordinator: "Unassigned" },
  { id: 7, firstName: "Susan", lastName: "Davis", serviceLine: "OLTL", region: 4, status: "assessment", county: "Bucks", phone: "(215) 555-0578", mco: "PA Health & Wellness", hoursPerWeek: 0, coordinator: "Matt F." },
  { id: 8, firstName: "William", lastName: "Taylor", serviceLine: "Skilled", region: 4, status: "discharged", county: "Philadelphia", phone: "(215) 555-0691", mco: "UPMC CHC", hoursPerWeek: 0, coordinator: "Matt F." },
];

export default function Clients() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceLineFilter, setServiceLineFilter] = useState("all");

  const filtered = MOCK_CLIENTS.filter((c) => {
    const matchesSearch =
      !search ||
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesLine = serviceLineFilter === "all" || c.serviceLine === serviceLineFilter;
    return matchesSearch && matchesStatus && matchesLine;
  });

  const statusCounts = {
    all: MOCK_CLIENTS.length,
    active: MOCK_CLIENTS.filter((c) => c.status === "active").length,
    referral: MOCK_CLIENTS.filter((c) => c.status === "referral").length,
    on_hold: MOCK_CLIENTS.filter((c) => c.status === "on_hold").length,
  };

  return (
    <AppShell
      title="Clients"
      actions={
        <Button className="bg-emerald-600 hover:bg-emerald-700" size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          New Client
        </Button>
      }
    >
      <div className="space-y-4 max-w-[1440px]">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total", count: statusCounts.all, color: "border-l-slate-400" },
            { label: "Active", count: statusCounts.active, color: "border-l-emerald-500" },
            { label: "Referrals", count: statusCounts.referral, color: "border-l-blue-500" },
            { label: "On Hold", count: statusCounts.on_hold, color: "border-l-amber-500" },
          ].map((s) => (
            <Card key={s.label} className={`p-4 border-l-4 ${s.color} bg-white shadow-sm`}>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.count}</p>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="bg-white shadow-sm p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search clients..."
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
        <Card className="bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Service Line</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>MCO</TableHead>
                <TableHead className="text-right">Hours/Wk</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Coordinator</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow key={client.id} className="cursor-pointer hover:bg-slate-50/80">
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-900 text-sm">
                        {client.firstName} {client.lastName}
                      </p>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${SERVICE_LINE_STYLES[client.serviceLine]}`}>
                      {client.serviceLine}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${STATUS_STYLES[client.status]}`}>
                      {client.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{client.mco}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm font-medium">
                    {client.hoursPerWeek || "—"}
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      R{client.region} · {client.county}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">{client.coordinator}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600">
                        <TrendingUp className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </AppShell>
  );
}
