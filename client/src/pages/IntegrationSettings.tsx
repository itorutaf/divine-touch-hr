import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings, Plug, CheckCircle2, XCircle, AlertCircle, RefreshCw, ExternalLink,
} from "lucide-react";

type ConnectionStatus = "connected" | "disconnected" | "error";

const STATUS_STYLES: Record<ConnectionStatus, { dot: string; text: string; label: string }> = {
  connected: { dot: "bg-emerald-500", text: "text-emerald-700", label: "Connected" },
  disconnected: { dot: "bg-muted-foreground/30", text: "text-muted-foreground", label: "Not Configured" },
  error: { dot: "bg-red-500", text: "text-red-600", label: "Error" },
};

const INTEGRATIONS: {
  name: string;
  description: string;
  category: string;
  status: ConnectionStatus;
  lastSync?: string;
}[] = [
  { name: "JotForm HIPAA", description: "Worker applications & client intake forms", category: "Forms", status: "disconnected" },
  { name: "DocuSign", description: "Employment agreements & consent packages", category: "Forms", status: "disconnected" },
  { name: "Checkr", description: "Background check initiation & results", category: "Compliance", status: "disconnected" },
  { name: "Nursys e-Notify", description: "Nursing license verification (Skilled track)", category: "Compliance", status: "disconnected" },
  { name: "HHA Exchange", description: "EVV data, billing, scheduling sync", category: "Operations", status: "disconnected" },
  { name: "Nevvon", description: "PA compliance training content delivery", category: "Training", status: "disconnected" },
  { name: "Gusto", description: "Payroll processing & tax filing", category: "Payroll", status: "disconnected" },
  { name: "Twilio", description: "SMS notifications for caregivers", category: "Communication", status: "disconnected" },
  { name: "SAM.gov", description: "Federal exclusion database screening", category: "Compliance", status: "disconnected" },
  { name: "Stripe Billing", description: "Subscription management (multi-tenant)", category: "Platform", status: "disconnected" },
];

function IntegrationCard({ integration }: { integration: typeof INTEGRATIONS[0] }) {
  const status = STATUS_STYLES[integration.status];
  return (
    <Card className="bg-card shadow-sm hover:shadow transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Plug className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">{integration.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{integration.description}</p>
              <Badge variant="outline" className="text-[9px] mt-1.5">{integration.category}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${status.dot}`} />
            <span className={`text-[11px] font-medium ${status.text}`}>{status.label}</span>
          </div>
        </div>
        {integration.lastSync && (
          <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Last sync: {integration.lastSync}
          </p>
        )}
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" className="h-7 text-xs flex-1">Configure</Button>
          {integration.status === "connected" && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">Disconnect</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function IntegrationSettings() {
  return (
    <AppShell title="Settings">
      <div className="space-y-6 max-w-[1200px]">
        <Tabs defaultValue="integrations">
          <TabsList>
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="agency">Agency Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="mt-4">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                Connect external services to automate workflows. Each integration requires API credentials from the provider.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {INTEGRATIONS.map((i) => (
                <IntegrationCard key={i.name} integration={i} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="agency" className="mt-4">
            <Card className="bg-card shadow-sm">
              <CardHeader><CardTitle className="text-sm">Agency Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Agency Name</Label>
                    <Input defaultValue="Divine Touch Home Care Services" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone</Label>
                    <Input defaultValue="(215) 555-0100" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Email</Label>
                    <Input defaultValue="info@divinetouchhc.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">NPI Number</Label>
                    <Input defaultValue="" placeholder="10-digit NPI" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">PROMISe ID</Label>
                    <Input defaultValue="" placeholder="PA PROMISe provider ID" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tax ID (EIN)</Label>
                    <Input defaultValue="" placeholder="XX-XXXXXXX" />
                  </div>
                </div>
                <Separator />
                <div>
                  <Label className="text-xs mb-2 block">Service Lines Enabled</Label>
                  <div className="flex gap-6">
                    {["OLTL", "ODP", "Skilled"].map((line) => (
                      <div key={line} className="flex items-center gap-2">
                        <Switch defaultChecked />
                        <span className="text-sm">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button className="bg-emerald-600 hover:bg-emerald-700">Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <Card className="bg-card shadow-sm">
              <CardHeader><CardTitle className="text-sm">Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Document expiration alerts (30/14/7 day)", key: "doc_expiry" },
                  { label: "Clearance expiration alerts", key: "clearance" },
                  { label: "Authorization expiration reminders", key: "auth_expiry" },
                  { label: "Stuck onboarding notifications (>7 days)", key: "stuck" },
                  { label: "EVV compliance threshold warnings", key: "evv" },
                  { label: "Daily digest email", key: "digest" },
                  { label: "Claim denial notifications", key: "denials" },
                  { label: "LEIE/SAM screening results", key: "leie" },
                ].map((n) => (
                  <div key={n.key} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{n.label}</span>
                    <Switch defaultChecked />
                  </div>
                ))}
                <Separator />
                <Button className="bg-emerald-600 hover:bg-emerald-700">Save Preferences</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
