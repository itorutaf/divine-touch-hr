import { useAuth } from "@/_core/hooks/useAuth";
import AppShell from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { 
  Users, TrendingUp, ClipboardCheck, AlertTriangle, Clock,
  Settings as SettingsIcon, Database, Cloud, Bell, Shield,
  FileText, Link2, Play, RefreshCw, CheckCircle2, XCircle,
  Calendar, Mail
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  
  const { data: pendingApprovals } = trpc.dashboard.pendingApprovals.useQuery();
  const { data: openExceptions } = trpc.dashboard.openExceptions.useQuery();
  const { data: notificationSettings, refetch: refetchSettings } = trpc.notifications.getSettings.useQuery();
  const { data: notificationLogs, refetch: refetchLogs } = trpc.notifications.getLogs.useQuery({ limit: 20 });
  const { data: expirationSummary, refetch: refetchSummary } = trpc.notifications.getExpirationSummary.useQuery();

  const updateSettingsMutation = trpc.notifications.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings updated");
      refetchSettings();
    },
    onError: (error) => {
      toast.error("Failed to update settings: " + error.message);
    },
  });

  const runCheckMutation = trpc.notifications.runExpirationCheck.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        if (result.documentsFound === 0) {
          toast.success("No expiring documents found");
        } else if (result.notificationSent) {
          toast.success(`Found ${result.documentsFound} expiring document(s) - notification sent`);
        } else {
          toast.info(`Found ${result.documentsFound} expiring document(s)`);
        }
        refetchLogs();
        refetchSummary();
        refetchSettings();
      } else {
        toast.error("Check failed: " + (result.error || "Unknown error"));
      }
    },
    onError: (error) => {
      toast.error("Failed to run check: " + error.message);
    },
  });

  const totalPending = pendingApprovals?.length || 0;
  const totalExceptions = openExceptions?.length || 0;

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: <TrendingUp className="h-4 w-4" /> },
    { label: "Employees", href: "/employees", icon: <Users className="h-4 w-4" /> },
    { label: "Approvals", href: "/approvals", icon: <ClipboardCheck className="h-4 w-4" />, badge: totalPending > 0 ? totalPending : undefined },
    { label: "Exceptions", href: "/exceptions", icon: <AlertTriangle className="h-4 w-4" />, badge: totalExceptions > 0 ? totalExceptions : undefined },
  ];

  if (user?.role === "admin") {
    navItems.push({ label: "Users", href: "/users", icon: <Users className="h-4 w-4" /> });
    navItems.push({ label: "Settings", href: "/settings", icon: <Clock className="h-4 w-4" /> });
  }

  // Redirect non-admins
  if (user?.role !== "admin") {
    setLocation("/dashboard");
    return null;
  }

  const handleToggle = (field: string, value: boolean) => {
    updateSettingsMutation.mutate({ [field]: value });
  };

  return (
    <AppShell 
      title="Settings"
    >
      <div className="max-w-5xl space-y-6">
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            {/* Expiration Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Document Expiration Summary
                    </CardTitle>
                    <CardDescription>Current status of expiring documents</CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => runCheckMutation.mutate()}
                    disabled={runCheckMutation.isPending}
                  >
                    {runCheckMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Run Check Now
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-2xl font-bold text-red-700">{expirationSummary?.expired || 0}</p>
                    <p className="text-sm text-red-600">Expired</p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                    <p className="text-2xl font-bold text-orange-700">{expirationSummary?.expiring7Day || 0}</p>
                    <p className="text-sm text-orange-600">Expiring in 7 days</p>
                  </div>
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-2xl font-bold text-amber-700">{expirationSummary?.expiring14Day || 0}</p>
                    <p className="text-sm text-amber-600">Expiring in 14 days</p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <p className="text-2xl font-bold text-blue-700">{expirationSummary?.expiring30Day || 0}</p>
                    <p className="text-sm text-blue-600">Expiring in 30 days</p>
                  </div>
                </div>
                {notificationSettings?.lastCheckRun && (
                  <p className="text-sm text-slate-500 mt-4">
                    Last check: {new Date(notificationSettings.lastCheckRun).toLocaleString()}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Alert Thresholds */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alert Thresholds
                </CardTitle>
                <CardDescription>Configure when to send expiration alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">30-Day Warning</p>
                    <p className="text-sm text-slate-500">Alert when documents expire within 30 days</p>
                  </div>
                  <Switch 
                    checked={notificationSettings?.alertThreshold30Day ?? true}
                    onCheckedChange={(checked) => handleToggle("alertThreshold30Day", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">14-Day Warning</p>
                    <p className="text-sm text-slate-500">Alert when documents expire within 14 days</p>
                  </div>
                  <Switch 
                    checked={notificationSettings?.alertThreshold14Day ?? true}
                    onCheckedChange={(checked) => handleToggle("alertThreshold14Day", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">7-Day Warning</p>
                    <p className="text-sm text-slate-500">Alert when documents expire within 7 days</p>
                  </div>
                  <Switch 
                    checked={notificationSettings?.alertThreshold7Day ?? true}
                    onCheckedChange={(checked) => handleToggle("alertThreshold7Day", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Expired Alert</p>
                    <p className="text-sm text-slate-500">Alert when documents have expired</p>
                  </div>
                  <Switch 
                    checked={notificationSettings?.alertThresholdExpired ?? true}
                    onCheckedChange={(checked) => handleToggle("alertThresholdExpired", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Document Categories to Monitor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Document Categories
                </CardTitle>
                <CardDescription>Select which document types to monitor for expiration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Clearances</p>
                    <p className="text-sm text-slate-500">PATCH, FBI, Child Abuse clearances</p>
                  </div>
                  <Switch 
                    checked={notificationSettings?.monitorClearances ?? true}
                    onCheckedChange={(checked) => handleToggle("monitorClearances", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Certifications</p>
                    <p className="text-sm text-slate-500">CPR, training certificates</p>
                  </div>
                  <Switch 
                    checked={notificationSettings?.monitorCertifications ?? true}
                    onCheckedChange={(checked) => handleToggle("monitorCertifications", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Licenses</p>
                    <p className="text-sm text-slate-500">Professional licenses for skilled roles</p>
                  </div>
                  <Switch 
                    checked={notificationSettings?.monitorLicenses ?? true}
                    onCheckedChange={(checked) => handleToggle("monitorLicenses", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Medical Documents</p>
                    <p className="text-sm text-slate-500">Physical exams, TB tests</p>
                  </div>
                  <Switch 
                    checked={notificationSettings?.monitorMedical ?? true}
                    onCheckedChange={(checked) => handleToggle("monitorMedical", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Frequency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Notification Frequency
                </CardTitle>
                <CardDescription>How often to send expiration alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Daily Digest</p>
                    <p className="text-sm text-slate-500">Send a daily summary of all expiring documents</p>
                  </div>
                  <Switch 
                    checked={notificationSettings?.dailyDigest ?? true}
                    onCheckedChange={(checked) => handleToggle("dailyDigest", checked)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Immediate Alerts</p>
                    <p className="text-sm text-slate-500">Send alerts as soon as documents enter warning period</p>
                  </div>
                  <Switch 
                    checked={notificationSettings?.immediateAlerts ?? false}
                    onCheckedChange={(checked) => handleToggle("immediateAlerts", checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Notification History
                </CardTitle>
                <CardDescription>Recent notification activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {notificationLogs && notificationLogs.length > 0 ? (
                    <div className="space-y-3">
                      {notificationLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg border">
                          {log.status === "sent" ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {log.notificationType.replace(/_/g, " ")}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {new Date(log.sentAt).toLocaleString()}
                              </span>
                            </div>
                            {log.employeeName && (
                              <p className="text-sm mt-1">{log.employeeName}</p>
                            )}
                            {log.errorMessage && (
                              <p className="text-sm text-red-500 mt-1">{log.errorMessage}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <Bell className="h-8 w-8 mb-2" />
                      <p>No notifications sent yet</p>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link2 className="h-5 w-5" />
                  External Integrations
                </CardTitle>
                <CardDescription>Connect to external services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Cloud className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Google Sheets Sync</p>
                      <p className="text-sm text-slate-500">Bidirectional sync with existing tracker</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-amber-600 border-amber-200">
                      Not Configured
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => toast.info("Feature coming soon")}>
                      Configure
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">DocuSign</p>
                      <p className="text-sm text-slate-500">Document signing integration</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-amber-600 border-amber-200">
                      Not Configured
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => toast.info("Feature coming soon")}>
                      Configure
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Database className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium">EVV/HHA System</p>
                      <p className="text-sm text-slate-500">Electronic Visit Verification</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-amber-600 border-amber-200">
                      Not Configured
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => toast.info("Feature coming soon")}>
                      Configure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-slate-50">
                    <p className="text-sm text-slate-500">Application</p>
                    <p className="font-medium">Divine Touch HR Onboarding</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50">
                    <p className="text-sm text-slate-500">Version</p>
                    <p className="font-medium">1.0.0</p>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50">
                    <p className="text-sm text-slate-500">Environment</p>
                    <Badge className="bg-emerald-100 text-emerald-700">Production</Badge>
                  </div>
                  <div className="p-4 rounded-lg bg-slate-50">
                    <p className="text-sm text-slate-500">Database Status</p>
                    <Badge className="bg-emerald-100 text-emerald-700">Connected</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Management
                </CardTitle>
                <CardDescription>Export and backup options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Export All Employees</p>
                    <p className="text-sm text-slate-500">Download complete employee data as CSV</p>
                  </div>
                  <Button variant="outline" onClick={() => toast.info("Feature coming soon")}>
                    Export CSV
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <p className="font-medium">Export Audit Logs</p>
                    <p className="text-sm text-slate-500">Download complete audit trail</p>
                  </div>
                  <Button variant="outline" onClick={() => toast.info("Feature coming soon")}>
                    Export Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
