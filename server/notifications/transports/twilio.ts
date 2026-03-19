/**
 * Twilio SMS Transport
 *
 * Sends SMS for critical-severity notifications only.
 * Used for: exclusion matches, expired clearances, system emergencies.
 *
 * Requires env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
 * Falls back to console logging if Twilio is not configured (dev mode).
 */

import type { NotificationEvent, DeliveryResult } from "../types";
import { getDb } from "../../db";
import { users, employees } from "../../../drizzle/schema";
import { inArray } from "drizzle-orm";

// Lazy-load Twilio SDK
let twilioClient: any = null;

function getTwilioClient() {
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Twilio = require("twilio");
    twilioClient = new Twilio(accountSid, authToken);
    return twilioClient;
  } catch {
    console.warn("[Twilio] twilio package not installed — SMS transport disabled");
    return null;
  }
}

export async function deliverTwilio(event: NotificationEvent): Promise<DeliveryResult> {
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (!fromNumber) {
    console.log(`[Twilio] Not configured — would SMS "${event.title}" to ${event.targetUserIds.length} user(s)`);
    return { transport: "twilio", success: true, recipientCount: 0 };
  }

  const db = await getDb();
  if (!db) {
    return { transport: "twilio", success: false, recipientCount: 0, error: "Database not available" };
  }

  try {
    // Look up phone numbers — check users table first, then employees
    // Admin/HR users have phone numbers in the users table via their linked employee records
    const targetUsers = event.targetUserIds.length > 0
      ? await db.select({ id: users.id, email: users.email }).from(users).where(inArray(users.id, event.targetUserIds))
      : [];

    // For now, we'll use a simple approach: look for phone numbers in the employees table
    // matched by email (since users and employees share email as the link)
    const userEmails = targetUsers.map(u => u.email).filter((e): e is string => !!e);

    let phoneNumbers: string[] = [];
    if (userEmails.length > 0) {
      const emps = await db.select({ phone: employees.phone })
        .from(employees)
        .where(inArray(employees.email, userEmails));
      phoneNumbers = emps.map(e => e.phone).filter((p): p is string => !!p);
    }

    if (phoneNumbers.length === 0) {
      console.log(`[Twilio] No phone numbers found for target users`);
      return { transport: "twilio", success: true, recipientCount: 0 };
    }

    const client = getTwilioClient();
    if (!client) {
      console.log(`[Twilio] SDK not available — would SMS ${phoneNumbers.length} recipient(s)`);
      return { transport: "twilio", success: true, recipientCount: 0 };
    }

    // Truncate to SMS-friendly length
    const smsBody = `[CareBase] ${event.title}: ${event.body}`.slice(0, 1500);

    let sent = 0;
    for (const phone of phoneNumbers) {
      try {
        await client.messages.create({
          body: smsBody,
          from: fromNumber,
          to: phone,
        });
        sent++;
      } catch (err) {
        console.error(`[Twilio] Failed to send to recipient:`, err instanceof Error ? err.message : err);
      }
    }

    console.log(`[Twilio] Sent "${event.title}" to ${sent}/${phoneNumbers.length} recipient(s)`);
    return { transport: "twilio", success: sent > 0, recipientCount: sent };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Twilio] Delivery failed:`, msg);
    return { transport: "twilio", success: false, recipientCount: 0, error: msg };
  }
}
