import AppShell from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Settings, Plug, CheckCircle2, XCircle, AlertCircle, RefreshCw, ExternalLink, Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

type ConnectionStatus = "connected" | "disconnected" | "error";

const STATUS_STYLES: Record<ConnectionStatus, { dot: string; text: string; label: string }> = {
  connected: { dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", label: "Connected" },
  disconnected: { dot: "bg-muted-foreground/30", text: "text-muted-foreground", label: "Not Configured" },
  error: { dot: "bg-red-500", text: "text-red-600 dark:text-red-400", label: "Error" },
};

// Map provider names from DB to display info
const INTEGRATIONS_META: Record<string, { name: string; description: string; category: string }> = {
  jotform: { name: "JotForm HIPAA", description: "Worker applications & client intake forms", category: "Forms" },
  docusign: { name: "DocuSign", description: "Employment agreements & consent packages", category: "Forms" },
  checkr: { name: "Checkr", description: "Background check initiation & results", category: "Compliance" },
  sam_gov: { name: "SAM.gov", description: "Federal exclusion database screening", category: "Compliance" },
  hha_exchange: { name: "HHA Exchange", description: "EVV data, billing, scheduling sync", category: "Operations" },
  nevvon: { name: "Nevvon", description: "PA compliance training content delivery", category: "Training" },
  gusto: { name: "Gusto", description: "Payroll processing & tax filing", category: "Payroll" },
  twilio: { name: "Twilio", description: "SMS notifications for caregivers", category: "Communication" },
  ses: { name: "AWS SES", description: "Email notifications & daily digests", category: "Communication" },
};

// All possible providers
const ALL_PROVIDERS = ["jotform", "docusign", "checkr", "sam_gov", "hha_exchange", "nevvon", "gusto", "twilio", "ses"];

// Form field definitions per provider
type FieldDef = { key: string; label: string; type: "text" | "password" | "textarea" | "toggle"; placeholder?: string };
const INTEGRATION_FIELDS: Record<string, FieldDef[]> = {
  jotform: [
    { key: "apiKey", label: "API Key", type: "password", placeholder: "Enter JotForm API key" },
    { key: "formId", label: "Form ID", type: "text", placeholder: "e.g. 230123456789" },
  ],
  docusign: [
    { key: "integrationKey", label: "Integration Key", type: "password", placeholder: "DocuSign integration key" },
    { key: "accountId", label: "Account ID", type: "text", placeholder: "DocuSign account ID" },
    { key: "rsaPrivateKey", label: "RSA Private Key", type: "textarea", placeholder: "-----BEGIN RSA PRIVATE KEY-----" },
  ],
  checkr: [
    { key: "apiKey", label: "API Key", type: "password", placeholder: "Enter Checkr API key" },
    { key: "sandbox", label: "Sandbox Mode", type: "toggle" },
  ],
  sam_gov: [
    { key: "apiKey", label: "API Key", type: "password", placeholder: "Enter SAM.gov API key" },
  ],
  hha_exchange: [
    { key: "agencyId", label: "Agency ID", type: "text", placeholder: "HHA Exchange agency ID" },
    { key: "username", label: "Username", type: "text", placeholder: "API username" },
    { key: "password", label: "Password", type: "password", placeholder: "API password" },
  ],
  nevvon: [
    { key: "apiKey", label: "API Key", type: "password", placeholder: "Enter Nevvon API key" },
    { key: "organizationId", label: "Organization ID", type: "text", placeholder: "Nevvon org ID" },
  ],
  gusto: [
    { key: "clientId", label: "Client ID", type: "text", placeholder: "OAuth client ID" },
    { key: "clientSecret", label: "Client Secret", type: "password", placeholder: "OAuth client secret" },
  ],
  twilio: [
    { key: "accountSid", label: "Account SID", type: "text", placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
    { key: "authToken", label: "Auth Token", type: "password", placeholder: "Twilio auth token" },
    { key: "fromPhone", label: "From Phone Number", type: "text", placeholder: "+1XXXXXXXXXX" },
  ],
  ses: [
    { key: "accessKeyId", label: "Access Key ID", type: "text", placeholder: "AWS access key ID" },
    { key: "secretAccessKey", label: "Secret Access Key", type: "password", placeholder: "AWS secret access key" },
    { key: "region", label: "Region", type: "text", placeholder: "e.g. us-east-1" },
    { key: "fromEmail", label: "From Email", type: "text", placeholder: "noreply@yourdomain.com" },
  ],
};

// Configure modal component
function ConfigureModal({
  provider,
  open,
  onOpenChange,
  existingConfig,
}: {
  provider: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingConfig?: { isActive: boolean; configJson: string | null } | null;
}) {
  const meta = provider ? INTEGRATIONS_META[provider] : null;
  const fields = provider ? INTEGRATION_FIELDS[provider] ?? [] : [];

  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [isActive, setIsActive] = useState(false);
  const utils = trpc.useUtils();

  const upsertMut = trpc.integrations.upsert.useMutation({
    onSuccess: () => {
      toast.success(`${meta?.name ?? "Integration"} configuration saved`);
      utils.integrations.list.invalidate();
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(`Failed to save: ${err.message}`);
    },
  });

  // Reset form when provider changes or modal opens
  useEffect(() => {
    if (open && provider) {
      let parsed: Record<string, any> = {};
      if (existingConfig?.configJson) {
        try { parsed = JSON.parse(existingConfig.configJson); } catch {}
      }
      const initial: Record<string, string | boolean> = {};
      for (const f of fields) {
        initial[f.key] = parsed[f.key] ?? (f.type === "toggle" ? false : "");
      }
      setFormData(initial);
      setIsActive(existingConfig?.isActive ?? false);
    }
  }, [open, provider]);

  const handleSave = () => {
    if (!provider) return;
    upsertMut.mutate({
      provider,
      isActive,
      configJson: JSON.stringify(formData),
    });
  };

  if (!provider || !meta) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base">Configure {meta.name}</DialogTitle>
          <DialogDescription className="text-xs">{meta.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Active</Label>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>
          <Separator />
          {fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-xs">{field.label}</Label>
              {field.type === "textarea" ? (
                <Textarea
                  className="text-xs font-mono min-h-[80px]"
                  placeholder={field.placeholder}
                  value={(formData[field.key] as string) ?? ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              ) : field.type === "toggle" ? (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!formData[field.key]}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, [field.key]: checked }))}
                  />
                  <span className="text-xs text-muted-foreground">
                    {formData[field.key] ? "Enabled" : "Disabled"}
                  </span>
                </div>
              ) : (
                <Input
                  type={field.type === "password" ? "password" : "text"}
                  className="text-xs"
                  placeholder={field.placeholder}
                  value={(formData[field.key] as string) ?? ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSave}
            disabled={upsertMut.isPending}
          >
            {upsertMut.isPending ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IntegrationCard({
  provider,
  config,
  onConfigure,
}: {
  provider: string;
  config?: { isActive: boolean; lastSyncAt: string | null; lastError: string | null } | null;
  onConfigure: (provider: string) => void;
}) {
  const meta = INTEGRATIONS_META[provider] || { name: provider, description: "", category: "Other" };
  const connStatus: ConnectionStatus = config?.isActive ? "connected" : config?.lastError ? "error" : "disconnected";
  const status = STATUS_STYLES[connStatus];

  return (
    <Card className="bg-card shadow-sm hover:shadow transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <Plug className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">{meta.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{meta.description}</p>
              <Badge variant="outline" className="text-[9px] mt-1.5">{meta.category}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`h-2 w-2 rounded-full ${status.dot}`} />
            <span className={`text-[11px] font-medium ${status.text}`}>{status.label}</span>
          </div>
        </div>
        {config?.lastSyncAt && (
          <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
            <RefreshCw className="h-3 w-3" /> Last sync: {new Date(config.lastSyncAt).toLocaleDateString()}
          </p>
        )}
        {config?.lastError && (
          <p className="text-[10px] text-red-500 mt-1 truncate" title={config.lastError}>
            Error: {config.lastError}
          </p>
        )}
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => onConfigure(provider)}>Configure</Button>
          {connStatus === "connected" && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">Disconnect</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function IntegrationSettings() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Fetch real integration configs
  const { data: configs } = trpc.integrations.list.useQuery(undefined, { enabled: isAdmin });

  // Build a map of provider → config for quick lookup
  const configMap = new Map<string, any>();
  configs?.forEach((c: any) => configMap.set(c.provider, c));

  // Configure modal state
  const [configureProvider, setConfigureProvider] = useState<string | null>(null);
  const [configureOpen, setConfigureOpen] = useState(false);

  const handleConfigure = (provider: string) => {
    setConfigureProvider(provider);
    setConfigureOpen(true);
  };

  // Fetch notification settings
  const { data: notifSettings } = trpc.notifications.getSettings.useQuery(undefined, { enabled: isAdmin });
  const utils = trpc.useUtils();

  // Local state for notification preferences
  const [notifPrefs, setNotifPrefs] = useState({
    alertThreshold30Day: true,
    alertThreshold14Day: true,
    alertThreshold7Day: true,
    alertThresholdExpired: true,
    monitorClearances: true,
    monitorCertifications: true,
    monitorLicenses: true,
    monitorMedical: true,
    dailyDigest: true,
    immediateAlerts: false,
  });

  // Sync server data into local state when it loads
  useEffect(() => {
    if (notifSettings) {
      setNotifPrefs({
        alertThreshold30Day: notifSettings.alertThreshold30Day ?? true,
        alertThreshold14Day: notifSettings.alertThreshold14Day ?? true,
        alertThreshold7Day: notifSettings.alertThreshold7Day ?? true,
        alertThresholdExpired: notifSettings.alertThresholdExpired ?? true,
        monitorClearances: notifSettings.monitorClearances ?? true,
        monitorCertifications: notifSettings.monitorCertifications ?? true,
        monitorLicenses: notifSettings.monitorLicenses ?? true,
        monitorMedical: notifSettings.monitorMedical ?? true,
        dailyDigest: notifSettings.dailyDigest ?? true,
        immediateAlerts: notifSettings.immediateAlerts ?? false,
      });
    }
  }, [notifSettings]);

  const updateSettingsMut = trpc.notifications.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Notification preferences saved");
      utils.notifications.getSettings.invalidate();
    },
    onError: (err) => {
      toast.error(`Failed to save preferences: ${err.message}`);
    },
  });

  const handleSaveNotifPrefs = () => {
    updateSettingsMut.mutate(notifPrefs);
  };

  const togglePref = (key: keyof typeof notifPrefs) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
              {ALL_PROVIDERS.map((provider) => (
                <IntegrationCard
                  key={provider}
                  provider={provider}
                  config={configMap.get(provider)}
                  onConfigure={handleConfigure}
                />
              ))}
            </div>

            {/* Webhook URLs info card */}
            <Card className="bg-muted/50 border-dashed mt-4 p-4">
              <h4 className="text-sm font-semibold text-foreground mb-2">Webhook Endpoints</h4>
              <p className="text-xs text-muted-foreground mb-3">
                Configure these URLs in your external service dashboards to receive real-time data:
              </p>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] w-16 justify-center">JotForm</Badge>
                  <code className="text-muted-foreground">{window.location.origin}/api/webhooks/jotform</code>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] w-16 justify-center">DocuSign</Badge>
                  <code className="text-muted-foreground">{window.location.origin}/api/webhooks/docusign</code>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[9px] w-16 justify-center">Checkr</Badge>
                  <code className="text-muted-foreground">{window.location.origin}/api/webhooks/checkr</code>
                </div>
              </div>
            </Card>
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
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => toast.success("Agency profile updated")}
                >
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <Card className="bg-card shadow-sm">
              <CardHeader><CardTitle className="text-sm">Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {([
                  { label: "30-day expiration alerts", key: "alertThreshold30Day" as const },
                  { label: "14-day expiration alerts", key: "alertThreshold14Day" as const },
                  { label: "7-day expiration alerts", key: "alertThreshold7Day" as const },
                  { label: "Expired document alerts", key: "alertThresholdExpired" as const },
                  { label: "Monitor clearances", key: "monitorClearances" as const },
                  { label: "Monitor certifications", key: "monitorCertifications" as const },
                  { label: "Monitor licenses", key: "monitorLicenses" as const },
                  { label: "Monitor medical documents", key: "monitorMedical" as const },
                  { label: "Daily digest email", key: "dailyDigest" as const },
                  { label: "Immediate alerts", key: "immediateAlerts" as const },
                ] as const).map((n) => (
                  <div key={n.key} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">{n.label}</span>
                    <Switch
                      checked={notifPrefs[n.key]}
                      onCheckedChange={() => togglePref(n.key)}
                    />
                  </div>
                ))}
                <Separator />
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleSaveNotifPrefs}
                  disabled={updateSettingsMut.isPending}
                >
                  {updateSettingsMut.isPending ? "Saving..." : "Save Preferences"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ConfigureModal
        provider={configureProvider}
        open={configureOpen}
        onOpenChange={setConfigureOpen}
        existingConfig={configureProvider ? configMap.get(configureProvider) : null}
      />
    </AppShell>
  );
}
