/**
 * CareBase Notification System — Shared Types
 *
 * The notification system uses an event-driven architecture:
 * 1. Producers emit NotificationEvents (webhooks, crons, user actions)
 * 2. The Dispatcher routes events to appropriate transports
 * 3. Transports deliver via SES email, Twilio SMS, or in-app bell
 */

export type NotificationCategory = "intake" | "compliance" | "billing" | "scheduling" | "system";
export type NotificationSeverity = "info" | "warning" | "critical";

/**
 * Core event that triggers notifications.
 * Every integration (JotForm, DocuSign, Checkr, LEIE) emits one of these.
 */
export interface NotificationEvent {
  /** Event type determines routing + template selection */
  type:
    | "new_intake"              // JotForm → new application received
    | "docusign_sent"           // DocuSign envelope sent
    | "docusign_completed"      // DocuSign envelope signed
    | "docusign_declined"       // DocuSign envelope declined
    | "checkr_initiated"        // Background check started
    | "checkr_clear"            // Background check passed
    | "checkr_flagged"          // Background check has concerns
    | "clearance_expiring"      // PA clearance approaching expiration
    | "clearance_expired"       // PA clearance expired
    | "document_expiring"       // Document approaching expiration
    | "document_expired"        // Document has expired
    | "exclusion_match"         // LEIE/SAM screening found a match
    | "gate_approved"           // Onboarding gate approved
    | "gate_rejected"           // Onboarding gate rejected
    | "phase_advanced"          // Employee moved to next onboarding phase
    | "exception_created"       // New exception flagged
    | "timesheet_reminder"      // Missing timesheet reminder
    | "auth_expiring"           // Authorization approaching end date
    | "system_alert";           // Generic system notification

  /** Human-readable title */
  title: string;

  /** Detailed message body (supports basic HTML for email) */
  body: string;

  /** Classification for filtering/routing */
  category: NotificationCategory;

  /** Urgency level — affects transport selection */
  severity: NotificationSeverity;

  /** Target user IDs (fan-out: one in-app record per user) */
  targetUserIds: number[];

  /** Optional roles to broadcast to (expands to user IDs) */
  targetRoles?: string[];

  /** Deep link within the app (e.g., "/employees/42") */
  actionUrl?: string;

  /** Extra structured data (stored as JSON) */
  metadata?: Record<string, unknown>;
}

/**
 * Result from a transport delivery attempt
 */
export interface DeliveryResult {
  transport: "ses" | "twilio" | "inApp";
  success: boolean;
  recipientCount: number;
  error?: string;
}

/**
 * Configuration for a single transport
 */
export interface TransportConfig {
  enabled: boolean;
  /** Severity threshold — only deliver if event severity >= this */
  minSeverity: NotificationSeverity;
}

/**
 * Global dispatch configuration
 */
export interface DispatchConfig {
  ses: TransportConfig & { fromEmail: string; region: string };
  twilio: TransportConfig & { accountSid: string; authToken: string; fromNumber: string };
  inApp: TransportConfig;
}
