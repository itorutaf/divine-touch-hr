/**
 * CareBase Notification Dispatcher
 *
 * Central routing engine for all notifications. Determines which transports
 * to use based on event severity and configuration.
 *
 * Routing rules:
 * - critical → SES + Twilio + in-app (all channels)
 * - warning  → SES + in-app
 * - info     → in-app only
 *
 * Replaces the old console.log stub at server/_core/notification.ts
 */

import type { NotificationEvent, DeliveryResult, NotificationSeverity } from "./types";
import { deliverInApp } from "./transports/inApp";
import { deliverSES } from "./transports/ses";
import { deliverTwilio } from "./transports/twilio";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { inArray } from "drizzle-orm";
import { getNotificationSettings } from "../db";

const SEVERITY_RANK: Record<NotificationSeverity, number> = {
  info: 0,
  warning: 1,
  critical: 2,
};

/**
 * Expand targetRoles into user IDs and merge with explicit targetUserIds
 */
async function resolveTargetUsers(event: NotificationEvent): Promise<number[]> {
  const userIds = new Set(event.targetUserIds);

  if (event.targetRoles && event.targetRoles.length > 0) {
    const db = await getDb();
    if (db) {
      const roleUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.role, event.targetRoles as any));
      roleUsers.forEach((u) => userIds.add(u.id));
    }
  }

  return Array.from(userIds);
}

/**
 * Map event categories to notificationSettings fields.
 * Returns the settings key that controls whether this category is enabled,
 * or undefined if no preference governs this category (always deliver).
 */
function categoryToSettingsKey(
  category: string
): "monitorClearances" | "monitorCertifications" | "monitorLicenses" | "monitorMedical" | undefined {
  switch (category) {
    case "compliance":
    case "clearance":
      return "monitorClearances";
    case "certification":
      return "monitorCertifications";
    case "license":
      return "monitorLicenses";
    case "medical":
      return "monitorMedical";
    default:
      return undefined; // no preference gate — always deliver
  }
}

/**
 * Check whether the notification should be delivered based on saved preferences.
 * Critical-severity events always bypass preference checks.
 */
async function isEnabledByPreferences(event: NotificationEvent): Promise<boolean> {
  // Critical events always get delivered regardless of preferences
  if (event.severity === "critical") return true;

  const settingsKey = categoryToSettingsKey(event.category);
  if (!settingsKey) return true; // no preference governs this category

  const settings = await getNotificationSettings();
  if (!settings) return true; // no settings row → default to enabled

  return settings[settingsKey] !== false;
}

/**
 * Main dispatch function — routes a notification event to appropriate transports.
 *
 * @param event - The notification event to deliver
 * @returns Array of delivery results from each transport
 */
export async function dispatch(event: NotificationEvent): Promise<DeliveryResult[]> {
  const results: DeliveryResult[] = [];

  // Resolve all target users (explicit IDs + role expansion)
  const resolvedUserIds = await resolveTargetUsers(event);
  const resolvedEvent = { ...event, targetUserIds: resolvedUserIds };

  if (resolvedUserIds.length === 0) {
    console.warn(`[Dispatcher] No target users for event "${event.type}" — skipping`);
    return results;
  }

  // Check notification preferences (critical severity always bypasses)
  const enabled = await isEnabledByPreferences(event);
  if (!enabled) {
    console.log(
      `[Dispatcher] Event "${event.type}" (category=${event.category}) suppressed by notification preferences`
    );
    return results;
  }

  console.log(
    `[Dispatcher] Routing "${event.type}" (${event.severity}) to ${resolvedUserIds.length} user(s)`
  );

  // Always deliver in-app
  try {
    const inAppResult = await deliverInApp(resolvedEvent);
    results.push(inAppResult);
  } catch (err) {
    console.error("[Dispatcher] In-app transport error:", err);
    results.push({ transport: "inApp", success: false, recipientCount: 0, error: String(err) });
  }

  // SES email for warning + critical
  if (SEVERITY_RANK[event.severity] >= SEVERITY_RANK.warning) {
    try {
      const sesResult = await deliverSES(resolvedEvent);
      results.push(sesResult);
    } catch (err) {
      console.error("[Dispatcher] SES transport error:", err);
      results.push({ transport: "ses", success: false, recipientCount: 0, error: String(err) });
    }
  }

  // Twilio SMS for critical only
  if (event.severity === "critical") {
    try {
      const twilioResult = await deliverTwilio(resolvedEvent);
      results.push(twilioResult);
    } catch (err) {
      console.error("[Dispatcher] Twilio transport error:", err);
      results.push({ transport: "twilio", success: false, recipientCount: 0, error: String(err) });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(
    `[Dispatcher] Event "${event.type}" delivered via ${successCount}/${results.length} transport(s)`
  );

  return results;
}

/**
 * Convenience helper — dispatch to HR + Admin roles by default
 * Used by most intake/compliance events
 */
export async function notifyHRAndAdmin(
  event: Omit<NotificationEvent, "targetUserIds" | "targetRoles">
): Promise<DeliveryResult[]> {
  return dispatch({
    ...event,
    targetUserIds: [],
    targetRoles: ["admin", "hr"],
  });
}

/**
 * Convenience helper — dispatch to Compliance + Admin roles
 * Used by clearance/screening events
 */
export async function notifyComplianceTeam(
  event: Omit<NotificationEvent, "targetUserIds" | "targetRoles">
): Promise<DeliveryResult[]> {
  return dispatch({
    ...event,
    targetUserIds: [],
    targetRoles: ["admin", "compliance"],
  });
}
