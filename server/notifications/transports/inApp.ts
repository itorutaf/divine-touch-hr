/**
 * In-App Notification Transport
 *
 * Writes directly to the in_app_notifications table.
 * Powers the bell icon dropdown in AppShell.
 * Fan-out model: one row per user per notification.
 */

import type { NotificationEvent, DeliveryResult } from "../types";
import { getDb } from "../../db";
import { inAppNotifications } from "../../../drizzle/schema";

export async function deliverInApp(event: NotificationEvent): Promise<DeliveryResult> {
  const db = await getDb();
  if (!db) {
    return { transport: "inApp", success: false, recipientCount: 0, error: "Database not available" };
  }

  try {
    const rows = event.targetUserIds.map((userId) => ({
      userId,
      title: event.title,
      body: event.body,
      category: event.category as any,
      severity: event.severity as any,
      read: false,
      actionUrl: event.actionUrl || null,
      metadata: event.metadata ? JSON.stringify(event.metadata) : null,
    }));

    if (rows.length === 0) {
      return { transport: "inApp", success: true, recipientCount: 0 };
    }

    // Batch insert — Drizzle supports multi-row inserts
    await db.insert(inAppNotifications).values(rows);

    console.log(`[InApp] Delivered "${event.title}" to ${rows.length} user(s)`);
    return { transport: "inApp", success: true, recipientCount: rows.length };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[InApp] Delivery failed:`, msg);
    return { transport: "inApp", success: false, recipientCount: 0, error: msg };
  }
}
