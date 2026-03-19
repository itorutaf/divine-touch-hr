/**
 * Checkr Webhook Handler
 *
 * Handles POST /api/webhooks/checkr for background check results.
 * Events: report.completed, report.suspended, candidate.engagement.completed
 *
 * On report.completed:
 *   - Update clearance status to "clear" or "flagged"
 *   - Download report PDF → S3
 *   - Notify compliance/HR
 *   - Calculate expiration date (60 months for PA clearances)
 */

import type { Request, Response } from "express";
import * as crypto from "crypto";
import * as db from "../../db";
import { getReport, getReportDocument } from "./client";
import { notifyComplianceTeam, notifyHRAndAdmin } from "../../notifications";
import { storagePut } from "../../storage";

/**
 * Verify Checkr webhook signature
 */
function verifySignature(body: string, signature: string | undefined): boolean {
  const secret = process.env.CHECKR_WEBHOOK_SECRET;
  if (!secret || !signature) return !secret; // Skip if not configured

  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function handleCheckrWebhook(req: Request, res: Response) {
  try {
    // 1. Signature verification (uses raw body captured by Express verify callback)
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const signature = req.headers["x-checkr-signature"] as string | undefined;

    if (!verifySignature(rawBody, signature)) {
      console.warn("[Checkr] Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const payload = req.body;
    const eventType = payload.type;
    const reportId = payload.data?.object?.id;

    console.log(`[Checkr] Webhook: event=${eventType}, reportId=${reportId}`);

    if (!eventType || !reportId) {
      return res.status(200).json({ message: "Ignored — no event type or report ID" });
    }

    // Only process report events
    if (!eventType.startsWith("report.")) {
      return res.status(200).json({ message: `Ignored event type: ${eventType}` });
    }

    // 2. Get full report details from Checkr API
    const reportResult = await getReport(reportId);
    if (!reportResult.success || !reportResult.report) {
      console.warn(`[Checkr] Could not fetch report ${reportId}`);
      return res.status(200).json({ message: "Could not fetch report — will retry" });
    }

    const report = reportResult.report;
    const candidateId = report.candidate_id;

    // 3. Find the clearance record by Checkr candidate ID (indexed join, not full scan)
    const match = await db.getClearanceByCheckrCandidateId(candidateId);

    if (!match) {
      console.warn(`[Checkr] No matching clearance for candidate ${candidateId}`);
      return res.status(200).json({ message: "No matching employee — ignored" });
    }

    const matchedEmployee = match.employee;
    const clearance = match.clearance;

    // 4. Map result to clearance status
    const isCompleted = eventType === "report.completed";
    const isClear = report.result === "clear";
    const isFlagged = report.result === "consider" || report.adjudication === "adverse_action";

    if (isCompleted) {
      // Calculate expiration: PA Act 153 clearances valid for 60 months from date of issue (result date)
      const resultDate = new Date();
      const expirationDate = new Date(resultDate);
      expirationDate.setMonth(expirationDate.getMonth() + 60);

      await db.updateClearance(clearance.id, {
        status: isClear ? ("clear" as any) : ("flagged" as any),
        resultDate: new Date().toISOString().split("T")[0],
        expirationDate: isClear ? expirationDate.toISOString().split("T")[0] : undefined,
        checkrReportId: reportId,
        notes: `Checkr result: ${report.result || "unknown"}${report.adjudication ? ` (adjudication: ${report.adjudication})` : ""}`,
      } as any);

      // 5. Download report PDF → S3
      try {
        const docResult = await getReportDocument(reportId);
        if (docResult.success && docResult.pdfBuffer) {
          const fileName = `checkr/${matchedEmployee.employeeId}_${clearance.type}_${reportId}.pdf`;
          await storagePut(fileName, docResult.pdfBuffer, "application/pdf");

          await db.updateClearance(clearance.id, {
            certificateS3Key: fileName,
          } as any);

          console.log(`[Checkr] Stored report PDF: ${fileName}`);
        }
      } catch (pdfError) {
        console.error("[Checkr] Failed to download report PDF:", pdfError);
      }

      // 6. Update employee clearance fields
      const updateFields: Record<string, any> = {};
      if (clearance.type === "PA_PATCH") {
        updateFields.patchReceived = isClear;
        updateFields.patchDate = new Date().toISOString().split("T")[0];
      } else if (clearance.type === "FBI") {
        updateFields.fbiReceived = isClear;
        updateFields.fbiDate = new Date().toISOString().split("T")[0];
      } else if (clearance.type === "CHILDLINE") {
        updateFields.childAbuseReceived = isClear;
        updateFields.childAbuseDate = new Date().toISOString().split("T")[0];
      }
      await db.updateEmployee(matchedEmployee.id, updateFields);

      // 7. Notifications
      if (isClear) {
        await notifyHRAndAdmin({
          type: "checkr_clear",
          title: `${clearance.type} Clearance Passed`,
          body: `${matchedEmployee.legalFirstName} ${matchedEmployee.legalLastName}'s ${clearance.type} background check came back clear. Valid for 60 months.`,
          category: "compliance",
          severity: "info",
          actionUrl: `/employees/${matchedEmployee.id}`,
          metadata: { clearanceType: clearance.type, reportId, result: "clear" },
        });
      } else {
        // FLAGGED — critical notification to compliance
        await notifyComplianceTeam({
          type: "checkr_flagged",
          title: `${clearance.type} Clearance Flagged`,
          body: `${matchedEmployee.legalFirstName} ${matchedEmployee.legalLastName}'s ${clearance.type} background check has been flagged. Result: ${report.result}. Immediate review required.`,
          category: "compliance",
          severity: "critical",
          actionUrl: `/employees/${matchedEmployee.id}`,
          metadata: { clearanceType: clearance.type, reportId, result: report.result, adjudication: report.adjudication },
        });

        // Create an exception
        await db.createException({
          employeeId: matchedEmployee.id,
          issue: `${clearance.type} background check flagged: result=${report.result}${report.adjudication ? `, adjudication=${report.adjudication}` : ""}. Immediate compliance review required.`,
          owner: "Compliance",
          notes: `Checkr report ID: ${reportId}. Candidate ID: ${candidateId}.`,
        });

        // Set escalation flag
        await db.updateEmployee(matchedEmployee.id, {
          escalationFlag: true,
          status: "Action Required" as any,
          nextAction: `Review flagged ${clearance.type} clearance result`,
        });
      }
    }

    return res.status(200).json({ success: true, processed: reportId });
  } catch (error) {
    console.error("[Checkr] Webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
