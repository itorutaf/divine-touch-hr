/**
 * CareBase Role System
 * Permissions, notifications, and scorecard definitions per role.
 */

export type NavGroup =
  | "dashboard"
  | "workers"
  | "clients"
  | "billing"
  | "compliance"
  | "operations"
  | "training"
  | "settings";

export type AppRole = "admin" | "hr" | "billing" | "coordinator" | "supervisor" | "compliance" | "user";

// ── Navigation Visibility ────────────────────────────────────────────

export const ROLE_VISIBILITY: Record<AppRole, NavGroup[]> = {
  admin:       ["dashboard", "workers", "clients", "billing", "compliance", "operations", "training", "settings"],
  hr:          ["dashboard", "workers", "compliance", "training"],
  billing:     ["dashboard", "clients", "billing"],
  coordinator: ["dashboard", "operations", "clients"],
  supervisor:  ["dashboard", "workers", "operations"],
  compliance:  ["dashboard", "compliance", "workers"],
  user:        ["dashboard"],
};

export function getVisibleGroups(role: string): NavGroup[] {
  return ROLE_VISIBILITY[role as AppRole] ?? ROLE_VISIBILITY.user;
}

// ── Role Metadata ────────────────────────────────────────────────────

export const ROLE_META: Record<AppRole, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  responsibilities: string[];
}> = {
  admin: {
    label: "Administrator",
    description: "Full system access. Oversees all modules, manages users, and makes strategic decisions.",
    color: "text-red-700",
    bgColor: "bg-red-50",
    responsibilities: ["Agency-wide oversight", "User management", "Strategic planning", "Audit readiness", "Financial review"],
  },
  hr: {
    label: "HR Specialist",
    description: "Processes new caregiver hires from application to active status. Manages onboarding pipeline.",
    color: "text-blue-700",
    bgColor: "bg-blue-50",
    responsibilities: ["Worker onboarding", "Document collection", "Clearance tracking", "Training assignment", "DocuSign management"],
  },
  billing: {
    label: "Billing Specialist",
    description: "Tracks authorizations, verifies billing data, follows up on denials, and monitors profitability.",
    color: "text-emerald-700",
    bgColor: "bg-emerald-50",
    responsibilities: ["Claims submission", "Denial management", "Authorization tracking", "Revenue analysis", "Profitability monitoring"],
  },
  coordinator: {
    label: "Care Coordinator",
    description: "Matches caregivers to clients, manages schedules, handles referrals and day-to-day operations.",
    color: "text-cyan-700",
    bgColor: "bg-cyan-50",
    responsibilities: ["Caregiver matching", "Schedule management", "Referral processing", "Client communication", "Visit coverage"],
  },
  supervisor: {
    label: "Supervisor",
    description: "Approves final onboarding sign-offs, oversees shift coverage, and manages team performance.",
    color: "text-purple-700",
    bgColor: "bg-purple-50",
    responsibilities: ["Gate approvals", "Shift oversight", "Performance review", "Escalation handling", "Quality assurance"],
  },
  compliance: {
    label: "Compliance Officer",
    description: "Ensures regulatory compliance across clearances, EVV, LEIE screening, and incident reporting.",
    color: "text-amber-700",
    bgColor: "bg-amber-50",
    responsibilities: ["Clearance verification", "EVV monitoring", "LEIE/SAM screening", "Incident investigation", "Audit preparation"],
  },
  user: {
    label: "Viewer",
    description: "Read-only access to dashboards and employee records. No write permissions.",
    color: "text-slate-600",
    bgColor: "bg-slate-50",
    responsibilities: ["Dashboard viewing", "Record lookup"],
  },
};

// ── Module Permissions ───────────────────────────────────────────────

export type ModulePermission = {
  module: string;
  label: string;
  read: boolean;
  write: boolean;
  admin: boolean;
};

export const ROLE_PERMISSIONS: Record<AppRole, ModulePermission[]> = {
  admin: [
    { module: "workers", label: "Workers", read: true, write: true, admin: true },
    { module: "clients", label: "Clients", read: true, write: true, admin: true },
    { module: "billing", label: "Billing", read: true, write: true, admin: true },
    { module: "compliance", label: "Compliance", read: true, write: true, admin: true },
    { module: "operations", label: "Operations", read: true, write: true, admin: true },
    { module: "training", label: "Training", read: true, write: true, admin: true },
    { module: "settings", label: "Settings", read: true, write: true, admin: true },
  ],
  hr: [
    { module: "workers", label: "Workers", read: true, write: true, admin: false },
    { module: "clients", label: "Clients", read: false, write: false, admin: false },
    { module: "billing", label: "Billing", read: false, write: false, admin: false },
    { module: "compliance", label: "Compliance", read: true, write: false, admin: false },
    { module: "operations", label: "Operations", read: false, write: false, admin: false },
    { module: "training", label: "Training", read: true, write: true, admin: false },
    { module: "settings", label: "Settings", read: false, write: false, admin: false },
  ],
  billing: [
    { module: "workers", label: "Workers", read: false, write: false, admin: false },
    { module: "clients", label: "Clients", read: true, write: true, admin: false },
    { module: "billing", label: "Billing", read: true, write: true, admin: false },
    { module: "compliance", label: "Compliance", read: false, write: false, admin: false },
    { module: "operations", label: "Operations", read: false, write: false, admin: false },
    { module: "training", label: "Training", read: false, write: false, admin: false },
    { module: "settings", label: "Settings", read: false, write: false, admin: false },
  ],
  coordinator: [
    { module: "workers", label: "Workers", read: true, write: false, admin: false },
    { module: "clients", label: "Clients", read: true, write: true, admin: false },
    { module: "billing", label: "Billing", read: false, write: false, admin: false },
    { module: "compliance", label: "Compliance", read: false, write: false, admin: false },
    { module: "operations", label: "Operations", read: true, write: true, admin: false },
    { module: "training", label: "Training", read: true, write: false, admin: false },
    { module: "settings", label: "Settings", read: false, write: false, admin: false },
  ],
  supervisor: [
    { module: "workers", label: "Workers", read: true, write: true, admin: false },
    { module: "clients", label: "Clients", read: false, write: false, admin: false },
    { module: "billing", label: "Billing", read: false, write: false, admin: false },
    { module: "compliance", label: "Compliance", read: false, write: false, admin: false },
    { module: "operations", label: "Operations", read: true, write: true, admin: false },
    { module: "training", label: "Training", read: false, write: false, admin: false },
    { module: "settings", label: "Settings", read: false, write: false, admin: false },
  ],
  compliance: [
    { module: "workers", label: "Workers", read: true, write: false, admin: false },
    { module: "clients", label: "Clients", read: false, write: false, admin: false },
    { module: "billing", label: "Billing", read: false, write: false, admin: false },
    { module: "compliance", label: "Compliance", read: true, write: true, admin: true },
    { module: "operations", label: "Operations", read: false, write: false, admin: false },
    { module: "training", label: "Training", read: false, write: false, admin: false },
    { module: "settings", label: "Settings", read: false, write: false, admin: false },
  ],
  user: [
    { module: "workers", label: "Workers", read: false, write: false, admin: false },
    { module: "clients", label: "Clients", read: false, write: false, admin: false },
    { module: "billing", label: "Billing", read: false, write: false, admin: false },
    { module: "compliance", label: "Compliance", read: false, write: false, admin: false },
    { module: "operations", label: "Operations", read: false, write: false, admin: false },
    { module: "training", label: "Training", read: false, write: false, admin: false },
    { module: "settings", label: "Settings", read: false, write: false, admin: false },
  ],
};

// ── Notification Config Per Role ─────────────────────────────────────

export type RoleNotification = {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
};

export const ROLE_NOTIFICATIONS: Record<AppRole, RoleNotification[]> = {
  admin: [
    { key: "onboarding_stuck", label: "Stuck Onboarding", description: "Workers stuck in pipeline > 7 days", enabled: true },
    { key: "clearance_expiry", label: "Clearance Expiration", description: "Clearances expiring within 30 days", enabled: true },
    { key: "claim_denial", label: "Claim Denials", description: "New billing claim denials", enabled: true },
    { key: "evv_threshold", label: "EVV Threshold Warning", description: "EVV rate approaching 85% threshold", enabled: true },
    { key: "incident_report", label: "Incident Reports", description: "New critical/major incident reports", enabled: true },
    { key: "auth_expiry", label: "Authorization Expiry", description: "Client authorizations expiring", enabled: true },
    { key: "daily_digest", label: "Daily Digest", description: "Morning summary of all exceptions", enabled: true },
    { key: "leie_results", label: "LEIE/SAM Results", description: "Monthly screening results", enabled: true },
  ],
  hr: [
    { key: "new_application", label: "New Applications", description: "New worker applications from JotForm", enabled: true },
    { key: "onboarding_stuck", label: "Stuck Onboarding", description: "Workers stuck in pipeline > 7 days", enabled: true },
    { key: "docusign_complete", label: "DocuSign Complete", description: "Signed documents received", enabled: true },
    { key: "clearance_result", label: "Clearance Results", description: "Background check results returned", enabled: true },
    { key: "clearance_expiry", label: "Clearance Expiration", description: "Clearances expiring within 30 days", enabled: true },
    { key: "training_overdue", label: "Training Overdue", description: "Workers with overdue training", enabled: true },
    { key: "doc_expiry", label: "Document Expiration", description: "Documents expiring within 30 days", enabled: true },
    { key: "daily_digest", label: "Daily Digest", description: "Morning HR action items summary", enabled: true },
  ],
  billing: [
    { key: "claim_denial", label: "Claim Denials", description: "New billing claim denials from MCOs", enabled: true },
    { key: "payment_received", label: "Payments Received", description: "MCO payments posted", enabled: true },
    { key: "auth_expiry", label: "Authorization Expiry", description: "Client authorizations expiring", enabled: true },
    { key: "auth_utilization", label: "Under-Utilization Alert", description: "Clients below 80% auth utilization", enabled: true },
    { key: "over_utilization", label: "Over-Utilization Alert", description: "Clients exceeding authorized hours", enabled: true },
    { key: "aging_90plus", label: "90+ Day Claims", description: "Claims aging beyond 90 days", enabled: true },
    { key: "daily_digest", label: "Daily Digest", description: "Morning billing summary", enabled: true },
  ],
  coordinator: [
    { key: "callout", label: "Call-Outs", description: "Caregiver call-outs needing coverage", enabled: true },
    { key: "missed_visit", label: "Missed Visits", description: "Visits not checked in on time", enabled: true },
    { key: "new_referral", label: "New Referrals", description: "New client referrals received", enabled: true },
    { key: "schedule_gap", label: "Schedule Gaps", description: "Unfilled shifts in tomorrow's schedule", enabled: true },
    { key: "caregiver_compliance", label: "Compliance Alerts", description: "Assigned caregiver compliance issues", enabled: true },
  ],
  supervisor: [
    { key: "gate_approval", label: "Gate Approvals", description: "Workers pending supervisor sign-off", enabled: true },
    { key: "escalation", label: "Escalations", description: "Issues escalated from HR or coordinators", enabled: true },
    { key: "shift_coverage", label: "Shift Coverage", description: "Shifts needing supervisor attention", enabled: true },
    { key: "performance_flag", label: "Performance Flags", description: "Caregiver performance issues", enabled: true },
  ],
  compliance: [
    { key: "clearance_expiry", label: "Clearance Expiration", description: "Clearances expiring within 60 days", enabled: true },
    { key: "evv_threshold", label: "EVV Threshold", description: "EVV rate approaching 85% threshold", enabled: true },
    { key: "incident_report", label: "Incident Reports", description: "All new incident reports", enabled: true },
    { key: "leie_results", label: "LEIE/SAM Results", description: "Monthly screening results & matches", enabled: true },
    { key: "audit_gap", label: "Audit Gaps", description: "Workers/clients with compliance gaps", enabled: true },
    { key: "license_change", label: "License Changes", description: "Nursys license status changes", enabled: true },
  ],
  user: [
    { key: "daily_digest", label: "Daily Digest", description: "General daily summary", enabled: false },
  ],
};

// ── Role Scorecard Metrics ───────────────────────────────────────────

export type ScorecardMetric = {
  label: string;
  key: string;
  value: string | number;
  target?: string | number;
  trend?: { value: number; direction: "up" | "down" | "neutral" };
  status: "good" | "warning" | "critical";
};

export const ROLE_SCORECARD: Record<AppRole, ScorecardMetric[]> = {
  admin: [
    { label: "Agency Health Score", key: "health", value: "82%", status: "good", trend: { value: 3, direction: "up" } },
    { label: "Active Clients", key: "clients", value: 47, status: "good", trend: { value: 8.3, direction: "up" } },
    { label: "Active Caregivers", key: "caregivers", value: 62, status: "good", trend: { value: 4.1, direction: "up" } },
    { label: "Monthly Revenue", key: "revenue", value: "$90,300", status: "good", trend: { value: 12.7, direction: "up" } },
    { label: "Compliance Score", key: "compliance", value: "94%", status: "warning", trend: { value: 1.2, direction: "down" } },
    { label: "Open Exceptions", key: "exceptions", value: 7, status: "warning" },
  ],
  hr: [
    { label: "Pipeline Count", key: "pipeline", value: 15, status: "good" },
    { label: "Stuck > 7 Days", key: "stuck", value: 3, status: "critical" },
    { label: "Pending DocuSign", key: "docusign", value: 4, status: "warning" },
    { label: "Expiring Documents", key: "expiring", value: 6, status: "warning" },
    { label: "Avg Onboarding Time", key: "avg_time", value: "11 days", target: "14 days", status: "good" },
    { label: "Today's Tasks", key: "tasks", value: 8, status: "warning" },
  ],
  billing: [
    { label: "Outstanding Claims", key: "outstanding", value: "$65,500", status: "warning" },
    { label: "Collection Rate", key: "collection", value: "94.2%", target: "95%", status: "warning", trend: { value: 1.1, direction: "up" } },
    { label: "Denied Claims", key: "denied", value: 3, status: "critical" },
    { label: "Avg Utilization", key: "utilization", value: "78%", target: "90%", status: "warning" },
    { label: "90+ Day Claims", key: "aging", value: 2, status: "critical" },
    { label: "Monthly Revenue", key: "revenue", value: "$90,300", status: "good", trend: { value: 6.6, direction: "up" } },
  ],
  coordinator: [
    { label: "Today's Visits", key: "visits", value: 24, status: "good" },
    { label: "Unassigned Shifts", key: "unassigned", value: 1, status: "warning" },
    { label: "Active Call-Outs", key: "callouts", value: 1, status: "critical" },
    { label: "Pending Referrals", key: "referrals", value: 2, status: "warning" },
    { label: "Coverage Rate", key: "coverage", value: "96%", target: "100%", status: "good" },
    { label: "Avg Referral-to-Active", key: "ref_time", value: "5 days", target: "7 days", status: "good" },
  ],
  supervisor: [
    { label: "Pending Approvals", key: "approvals", value: 4, status: "warning" },
    { label: "Active Escalations", key: "escalations", value: 1, status: "critical" },
    { label: "Shifts Today", key: "shifts", value: 24, status: "good" },
    { label: "Coverage Rate", key: "coverage", value: "96%", status: "good" },
    { label: "Team Compliance", key: "compliance", value: "92%", target: "95%", status: "warning" },
    { label: "Open Exceptions", key: "exceptions", value: 3, status: "warning" },
  ],
  compliance: [
    { label: "EVV Rate", key: "evv", value: "83%", target: "85%", status: "critical", trend: { value: 2, direction: "down" } },
    { label: "Expired Clearances", key: "expired", value: 1, status: "critical" },
    { label: "Expiring (60 days)", key: "expiring", value: 4, status: "warning" },
    { label: "Open Incidents", key: "incidents", value: 2, status: "warning" },
    { label: "LEIE Last Screen", key: "leie", value: "Mar 1", status: "good" },
    { label: "Audit Score", key: "audit", value: "82%", target: "95%", status: "warning" },
  ],
  user: [
    { label: "Dashboard Access", key: "access", value: "Active", status: "good" },
  ],
};
