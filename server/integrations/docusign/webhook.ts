/**
 * DocuSign Connect Webhook Handler
 *
 * Handles POST /api/webhooks/docusign from DocuSign Connect.
 * On envelope-completed:
 *   1. Validate HMAC signature
 *   2. Update employee packet status
 *   3. Download signed PDF → S3
 *   4. Check if both packets complete → auto-advance gate
 *   5. Notify HR
 */

import type { Request, Response } from "express";
import * as crypto from "crypto";
import * as db from "../../db";
import { notifyHRAndAdmin } from "../../notifications";
import { getAccessToken, getBaseUrl, getAccountId } from "./auth";
import { storagePut } from "../../storage";

/**
 * Verify DocuSign Connect HMAC-SHA256 signature
 */
function verifySignature(body: string, headers: Record<string, any>): boolean {
  const secret = process.env.DOCUSIGN_CONNECT_SECRET;
  if (!secret) return true; // Skip if not configured

  // DocuSign sends signature in x-docusign-signature-1 header
  const signature = headers["x-docusign-signature-1"];
  if (!signature) return false;

  const computed = crypto
    .createHmac("sha256", Buffer.from(secret, "base64"))
    .update(body)
    .digest("base64");

  const sigBuf = Buffer.from(signature, "base64");
  const compBuf = Buffer.from(computed, "base64");
  if (sigBuf.length !== compBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, compBuf);
}

export async function handleDocuSignWebhook(req: Request, res: Response) {
  try {
    // 1. Signature verification (uses raw body captured by Express verify callback)
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    if (!verifySignature(rawBody, req.headers)) {
      console.warn("[DocuSign] Invalid webhook signature");
      return res.status(401).json({ error: "Invalid signature" });
    }

    const payload = req.body;
    const envelopeId = payload.envelopeId || payload.data?.envelopeId;
    const status = payload.status || payload.data?.envelopeSummary?.status;

    console.log(`[DocuSign] Webhook: envelope ${envelopeId} status=${status}`);

    if (!envelopeId) {
      return res.status(400).json({ error: "Missing envelopeId" });
    }

    // 2. Find the employee by envelope ID (indexed lookup, not full table scan)
    const employee = await db.getEmployeeByEnvelopeId(envelopeId);

    if (!employee) {
      console.warn(`[DocuSign] No employee found for envelope ${envelopeId}`);
      return res.status(200).json({ message: "No matching employee — ignored" });
    }

    const isPacket1 = employee.dsPacket1EnvelopeId === envelopeId;
    const packetNum = isPacket1 ? 1 : 2;

    // 3. Map DocuSign status to our enum
    const statusMap: Record<string, string> = {
      sent: "Sent",
      delivered: "Delivered",
      completed: "Completed",
      declined: "Declined",
      voided: "Voided",
    };

    const mappedStatus = statusMap[status?.toLowerCase()] || status;

    // 4. Update employee record
    const updateData: Record<string, any> = {};
    if (isPacket1) {
      updateData.dsPacket1Status = mappedStatus;
      if (status?.toLowerCase() === "completed") {
        updateData.dsPacket1CompletedDate = new Date().toISOString().split("T")[0];
      }
    } else {
      updateData.dsPacket2Status = mappedStatus;
      if (status?.toLowerCase() === "completed") {
        updateData.dsPacket2CompletedDate = new Date().toISOString().split("T")[0];
      }
    }

    await db.updateEmployee(employee.id, updateData);

    // 5. If completed — download signed PDF and store in S3
    if (status?.toLowerCase() === "completed") {
      try {
        const token = await getAccessToken();
        if (token) {
          const baseUrl = getBaseUrl();
          const accountId = getAccountId();

          const docResponse = await fetch(
            `${baseUrl}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/documents/combined`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (docResponse.ok) {
            const pdfBuffer = Buffer.from(await docResponse.arrayBuffer());
            const fileName = `docusign/packet${packetNum}_${employee.employeeId}_${envelopeId}.pdf`;

            await storagePut(fileName, pdfBuffer, "application/pdf");
            console.log(`[DocuSign] Stored signed PDF: ${fileName}`);

            // Create a document record
            await db.createEmployeeDocument({
              employeeId: employee.id,
              fileName: `DocuSign_Packet${packetNum}_${employee.employeeId}.pdf`,
              originalFileName: `DocuSign Packet ${packetNum} — ${employee.legalFirstName} ${employee.legalLastName}.pdf`,
              category: "other" as any,
              s3Key: fileName,
              s3Url: fileName, // Will be resolved by storage layer
              mimeType: "application/pdf",
              fileSize: pdfBuffer.length,
              status: "approved" as any,
              uploadedBy: null, // System-generated via DocuSign webhook
            } as any);
          }
        }
      } catch (pdfError) {
        console.error(`[DocuSign] Failed to download signed PDF:`, pdfError);
        // Non-fatal — continue processing
      }

      // 6. Check if both packets are complete → auto-advance HR completeness gate
      const updatedEmployee = await db.getEmployeeById(employee.id);
      if (updatedEmployee) {
        const p1Done = updatedEmployee.dsPacket1Status === "Completed";
        const p2Done = updatedEmployee.dsPacket2Status === "Completed";

        if (p1Done && p2Done && updatedEmployee.currentPhase === "Intake") {
          console.log(`[DocuSign] Both packets complete for ${employee.employeeId} — ready for HR review`);

          await db.updateEmployee(employee.id, {
            nextAction: "Both DocuSign packets complete — review for Gate 1 approval",
            completionPercent: 25,
          });
        }
      }

      // 7. Notify HR
      await notifyHRAndAdmin({
        type: "docusign_completed",
        title: `Packet ${packetNum} Signed`,
        body: `${employee.legalFirstName} ${employee.legalLastName} has completed DocuSign Packet ${packetNum}. The signed documents have been stored securely.`,
        category: "intake",
        severity: "info",
        actionUrl: `/employees/${employee.id}`,
        metadata: { envelopeId, packetNum, employeeId: employee.employeeId },
      });
    } else if (status?.toLowerCase() === "declined") {
      // Notify HR of declined envelope
      await notifyHRAndAdmin({
        type: "docusign_declined",
        title: `Packet ${packetNum} Declined`,
        body: `${employee.legalFirstName} ${employee.legalLastName} has declined DocuSign Packet ${packetNum}. Manual intervention required.`,
        category: "intake",
        severity: "warning",
        actionUrl: `/employees/${employee.id}`,
        metadata: { envelopeId, packetNum },
      });
    }

    return res.status(200).json({ success: true, processed: envelopeId });
  } catch (error) {
    console.error("[DocuSign] Webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
