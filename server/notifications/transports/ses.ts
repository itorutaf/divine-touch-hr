/**
 * AWS SES Email Transport
 *
 * Sends templated HTML emails via Amazon Simple Email Service.
 * Used for: daily digests, document expiration alerts, intake notifications.
 *
 * Requires env vars: SES_FROM_EMAIL, SES_REGION (defaults to us-east-1)
 * Falls back to console logging if SES is not configured (dev mode).
 */

import type { NotificationEvent, DeliveryResult } from "../types";
import { getDb } from "../../db";
import { users } from "../../../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

// Lazy-load AWS SDK to avoid bundling cost when SES isn't configured
let sesClient: any = null;

async function getSESClient() {
  if (sesClient) return sesClient;

  const region = process.env.SES_REGION || "us-east-1";

  try {
    const { SESClient } = await import("@aws-sdk/client-ses");
    sesClient = new SESClient({ region });
    return sesClient;
  } catch {
    console.warn("[SES] @aws-sdk/client-ses not installed — email transport disabled");
    return null;
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function buildHtmlEmail(event: NotificationEvent): string {
  const severityColor = {
    info: "#10B981",
    warning: "#F59E0B",
    critical: "#EF4444",
  }[event.severity];

  const actionButton = event.actionUrl
    ? `<a href="${process.env.APP_URL || "http://localhost:3000"}${event.actionUrl}"
         style="display:inline-block;padding:10px 24px;background:${severityColor};color:#fff;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px;">
         View in CareBase
       </a>`
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;padding:32px;">
      <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="background:${severityColor};padding:20px 24px;">
          <h1 style="color:#fff;font-size:18px;margin:0;font-weight:700;">${escapeHtml(event.title)}</h1>
        </div>
        <div style="padding:24px;">
          <p style="color:#334155;font-size:14px;line-height:1.6;margin:0 0 16px;">${escapeHtml(event.body)}</p>
          ${actionButton}
        </div>
        <div style="padding:16px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:11px;margin:0;">
            CareBase — Divine Touch Home Care Services
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function deliverSES(event: NotificationEvent): Promise<DeliveryResult> {
  const fromEmail = process.env.SES_FROM_EMAIL;
  if (!fromEmail) {
    console.log(`[SES] Not configured — would send "${event.title}" to ${event.targetUserIds.length} user(s)`);
    return { transport: "ses", success: true, recipientCount: 0 };
  }

  // Look up email addresses for target users
  const db = await getDb();
  if (!db) {
    return { transport: "ses", success: false, recipientCount: 0, error: "Database not available" };
  }

  try {
    const targetUsers = event.targetUserIds.length > 0
      ? await db.select({ email: users.email }).from(users).where(inArray(users.id, event.targetUserIds))
      : [];

    const emails = targetUsers
      .map((u) => u.email)
      .filter((e): e is string => !!e);

    if (emails.length === 0) {
      console.log(`[SES] No email addresses found for target users`);
      return { transport: "ses", success: true, recipientCount: 0 };
    }

    const client = await getSESClient();
    if (!client) {
      // SDK not installed — log and succeed gracefully
      console.log(`[SES] SDK not available — would email: ${emails.join(", ")}`);
      return { transport: "ses", success: true, recipientCount: 0 };
    }

    const { SendEmailCommand } = await import("@aws-sdk/client-ses");

    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: { ToAddresses: emails },
      Message: {
        Subject: { Data: `[CareBase] ${event.title}`, Charset: "UTF-8" },
        Body: {
          Html: { Data: buildHtmlEmail(event), Charset: "UTF-8" },
          Text: { Data: `${event.title}\n\n${event.body}`, Charset: "UTF-8" },
        },
      },
    });

    await client.send(command);
    console.log(`[SES] Sent "${event.title}" to ${emails.length} recipient(s)`);
    return { transport: "ses", success: true, recipientCount: emails.length };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error(`[SES] Delivery failed:`, msg);
    return { transport: "ses", success: false, recipientCount: 0, error: msg };
  }
}
