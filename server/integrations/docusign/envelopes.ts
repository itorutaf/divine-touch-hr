/**
 * DocuSign Envelope Service
 *
 * Creates, sends, and manages DocuSign envelopes for employee onboarding packets.
 *
 * Packet 1: Employment Agreement, W-4, I-9 Section 1, Direct Deposit, Emergency Contact
 * Packet 2: Job Description Ack, HIPAA Consent, Abuse Reporting Training Ack
 */

import { getAccessToken, getBaseUrl, getAccountId, isDocuSignConfigured } from "./auth";
import * as db from "../../db";

interface EnvelopeResult {
  success: boolean;
  envelopeId?: string;
  error?: string;
}

interface SigningUrlResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Create and send a DocuSign envelope for an employee.
 *
 * @param employeeId - DB employee ID
 * @param packetType - 1 or 2 (maps to different template sets)
 * @param templateId - Optional specific template ID (falls back to config)
 */
export async function createEnvelope(
  employeeId: number,
  packetType: 1 | 2,
  templateId?: string
): Promise<EnvelopeResult> {
  if (!isDocuSignConfigured()) {
    return { success: false, error: "DocuSign not configured" };
  }

  const employee = await db.getEmployeeById(employeeId);
  if (!employee) {
    return { success: false, error: `Employee ${employeeId} not found` };
  }

  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: "Failed to get DocuSign access token" };
  }

  try {
    // Get template ID from config if not provided
    if (!templateId) {
      const config = await db.getIntegrationConfig("docusign");
      if (config?.configJson) {
        const parsed = JSON.parse(config.configJson);
        templateId = packetType === 1 ? parsed.packet1TemplateId : parsed.packet2TemplateId;
      }
    }

    const baseUrl = getBaseUrl();
    const accountId = getAccountId();

    // Build the envelope definition
    const envelopeDefinition: Record<string, any> = {
      status: "sent", // Immediately send
      emailSubject: packetType === 1
        ? `Divine Touch Home Care — Employment Packet (${employee.legalFirstName} ${employee.legalLastName})`
        : `Divine Touch Home Care — Compliance Packet (${employee.legalFirstName} ${employee.legalLastName})`,
      emailBlurb: `Please review and sign the attached documents to continue your onboarding with Divine Touch Home Care Services.`,
    };

    if (templateId) {
      // Use a server-side template
      envelopeDefinition.templateId = templateId;
      envelopeDefinition.templateRoles = [{
        email: employee.email || "",
        name: `${employee.legalFirstName} ${employee.legalLastName}`,
        roleName: "Signer",
        clientUserId: String(employee.id), // For embedded signing
      }];
    } else {
      // No template — create a simple envelope with a placeholder document
      // In production, you'd upload the actual PDF templates
      envelopeDefinition.documents = [{
        documentBase64: Buffer.from(
          `Onboarding Packet ${packetType} for ${employee.legalFirstName} ${employee.legalLastName}\n\nPlease sign below to acknowledge receipt.`
        ).toString("base64"),
        name: `Packet ${packetType}`,
        fileExtension: "txt",
        documentId: "1",
      }];
      envelopeDefinition.recipients = {
        signers: [{
          email: employee.email || "",
          name: `${employee.legalFirstName} ${employee.legalLastName}`,
          recipientId: "1",
          clientUserId: String(employee.id), // For embedded signing
          tabs: {
            signHereTabs: [{
              documentId: "1",
              pageNumber: "1",
              xPosition: "100",
              yPosition: "150",
            }],
          },
        }],
      };
    }

    const response = await fetch(
      `${baseUrl}/v2.1/accounts/${accountId}/envelopes`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(envelopeDefinition),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DocuSign] Envelope creation failed: ${response.status} ${errorText}`);
      return { success: false, error: `DocuSign API error: ${response.status}` };
    }

    const result = await response.json();
    const envelopeId = result.envelopeId;

    // Update employee record with envelope ID
    const updateField = packetType === 1
      ? { dsPacket1EnvelopeId: envelopeId, dsPacket1Status: "Sent" as const }
      : { dsPacket2EnvelopeId: envelopeId, dsPacket2Status: "Sent" as const };

    await db.updateEmployee(employeeId, updateField);

    console.log(`[DocuSign] Envelope ${envelopeId} created for employee ${employeeId} (Packet ${packetType})`);
    return { success: true, envelopeId };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[DocuSign] Envelope creation error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Generate an embedded signing URL (Focused View) for in-app signing.
 *
 * @param envelopeId - The DocuSign envelope ID
 * @param employeeId - DB employee ID (used as clientUserId)
 * @param returnUrl - URL to redirect after signing
 */
export async function getSigningUrl(
  envelopeId: string,
  employeeId: number,
  returnUrl: string
): Promise<SigningUrlResult> {
  if (!isDocuSignConfigured()) {
    return { success: false, error: "DocuSign not configured" };
  }

  const employee = await db.getEmployeeById(employeeId);
  if (!employee) {
    return { success: false, error: `Employee ${employeeId} not found` };
  }

  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: "Failed to get DocuSign access token" };
  }

  try {
    const baseUrl = getBaseUrl();
    const accountId = getAccountId();

    const response = await fetch(
      `${baseUrl}/v2.1/accounts/${accountId}/envelopes/${envelopeId}/views/recipient`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          returnUrl,
          authenticationMethod: "none",
          email: employee.email || "",
          userName: `${employee.legalFirstName} ${employee.legalLastName}`,
          clientUserId: String(employee.id),
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DocuSign] Signing URL failed: ${response.status} ${errorText}`);
      return { success: false, error: `DocuSign API error: ${response.status}` };
    }

    const result = await response.json();
    return { success: true, url: result.url };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[DocuSign] Signing URL error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Void (cancel) an outstanding envelope
 */
export async function voidEnvelope(
  envelopeId: string,
  reason: string = "Voided by HR"
): Promise<{ success: boolean; error?: string }> {
  if (!isDocuSignConfigured()) {
    return { success: false, error: "DocuSign not configured" };
  }

  const token = await getAccessToken();
  if (!token) {
    return { success: false, error: "Failed to get DocuSign access token" };
  }

  try {
    const baseUrl = getBaseUrl();
    const accountId = getAccountId();

    const response = await fetch(
      `${baseUrl}/v2.1/accounts/${accountId}/envelopes/${envelopeId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "voided",
          voidedReason: reason,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `DocuSign API error: ${response.status}` };
    }

    console.log(`[DocuSign] Envelope ${envelopeId} voided: ${reason}`);
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}
