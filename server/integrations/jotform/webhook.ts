/**
 * JotForm Webhook Receiver
 *
 * Handles POST /api/webhooks/jotform from JotForm HIPAA.
 * On each new submission:
 *   1. Validate HMAC signature (if configured)
 *   2. Map JotForm fields → employee columns
 *   3. Create employee in "Intake" phase
 *   4. Create Gate 1 approval record
 *   5. Notify HR team
 *
 * Route registration happens in server/_core/index.ts
 */

import type { Request, Response } from "express";
import * as crypto from "crypto";
import * as db from "../../db";
import { mapJotFormToEmployee, DEFAULT_FIELD_MAP } from "./fieldMap";
import { notifyHRAndAdmin } from "../../notifications";

/**
 * Validate JotForm webhook HMAC signature
 */
function verifySignature(body: string, signature: string | undefined, secret: string): boolean {
  if (!secret || !signature) return !secret; // Skip validation if no secret configured
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

/**
 * Generate unique employee ID: DT-XXXXXX (6 digits for ~900K range, collision-resistant)
 */
function generateEmployeeId(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `DT-${num}`;
}

export async function handleJotFormWebhook(req: Request, res: Response) {
  const startTime = Date.now();

  try {
    // 1. Signature verification (uses raw body captured by Express verify callback)
    const webhookSecret = process.env.JOTFORM_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers["x-jotform-signature"] as string | undefined;
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      if (!verifySignature(rawBody, signature, webhookSecret)) {
        console.warn("[JotForm] Invalid webhook signature");
        return res.status(401).json({ error: "Invalid signature" });
      }
    }

    const payload = req.body;
    console.log(`[JotForm] Received submission: ${payload.submissionID || "unknown"}`);

    // 2. Load custom field map from integration config (or use default)
    let fieldMap = DEFAULT_FIELD_MAP;
    const config = await db.getIntegrationConfig("jotform");
    if (config?.configJson) {
      try {
        const parsed = JSON.parse(config.configJson);
        if (parsed.fieldMap) fieldMap = parsed.fieldMap;
      } catch {
        console.warn("[JotForm] Invalid config JSON — using default field map");
      }
    }

    // 3. Map fields to employee data
    const employeeData = mapJotFormToEmployee(payload, fieldMap);

    // Validate minimum required fields
    if (!employeeData.legalFirstName || !employeeData.legalLastName) {
      console.warn("[JotForm] Missing required name fields in submission");
      return res.status(400).json({ error: "Missing required name fields" });
    }

    // 4. Create employee record
    const newEmployee = {
      ...employeeData,
      employeeId: generateEmployeeId(),
      currentPhase: "Intake" as const,
      status: "Pending Review" as const,
      hiringSource: "JotForm",
      submissionId: payload.submissionID || payload.submission_id || null,
      submissionTimestamp: payload.created_at ? new Date(payload.created_at) : new Date(),
      priority: "Medium" as const,
      nextAction: "Review intake form and verify information",
      completionPercent: 5,
    };

    const employeeId = await db.createEmployee(newEmployee as any);
    console.log(`[JotForm] Created employee ${newEmployee.employeeId} (DB id: ${employeeId})`);

    // 5. Create initial gate approval record (Gate 1: HR Completeness Review)
    if (employeeId) {
      await db.createGateApproval({
        employeeId: typeof employeeId === "number" ? employeeId : (employeeId as any).id || 0,
        gateType: "HR_COMPLETENESS_REVIEW" as any,
        status: "Pending" as any,
      });
    }

    // 6. Notify HR team
    await notifyHRAndAdmin({
      type: "new_intake",
      title: "New Worker Application",
      body: `${employeeData.legalFirstName} ${employeeData.legalLastName} applied for ${employeeData.roleAppliedFor || "a position"} via JotForm. Review their intake form to begin onboarding.`,
      category: "intake",
      severity: "info",
      actionUrl: `/employees/${employeeId}`,
      metadata: {
        employeeId: newEmployee.employeeId,
        submissionId: newEmployee.submissionId,
        source: "jotform",
      },
    });

    // 7. Update integration last sync timestamp
    await db.upsertIntegrationConfig("jotform", { lastSyncAt: new Date() });

    const elapsed = Date.now() - startTime;
    console.log(`[JotForm] Webhook processed in ${elapsed}ms`);

    return res.status(200).json({
      success: true,
      employeeId: newEmployee.employeeId,
      message: `Employee ${employeeData.legalFirstName} ${employeeData.legalLastName} created in Intake phase`,
    });
  } catch (error) {
    console.error("[JotForm] Webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
