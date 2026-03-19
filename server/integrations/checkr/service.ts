/**
 * Checkr Background Check Service
 *
 * Orchestrates the full background check flow:
 * 1. Create Checkr candidate from employee data
 * 2. Send invitation for background check
 * 3. Store candidate/report IDs on clearance record
 * 4. Notify HR of initiation
 */

import * as db from "../../db";
import { createCandidate, createInvitation, isCheckrConfigured } from "./client";
import { notifyHRAndAdmin } from "../../notifications";

interface InitiateResult {
  success: boolean;
  candidateId?: string;
  invitationUrl?: string;
  clearanceId?: number;
  error?: string;
}

/**
 * Initiate a background check for an employee.
 *
 * @param employeeId - DB employee ID
 * @param clearanceType - PA_PATCH, FBI, or CHILDLINE
 * @param packageSlug - Checkr package (defaults to tasker_standard)
 */
export async function initiateBackgroundCheck(
  employeeId: number,
  clearanceType: "PA_PATCH" | "FBI" | "CHILDLINE" = "PA_PATCH",
  packageSlug: string = "tasker_standard"
): Promise<InitiateResult> {
  if (!isCheckrConfigured()) {
    return { success: false, error: "Checkr is not configured. Add CHECKR_API_KEY to environment variables." };
  }

  // Get employee data
  const employee = await db.getEmployeeById(employeeId);
  if (!employee) {
    return { success: false, error: `Employee ${employeeId} not found` };
  }

  if (!employee.email) {
    return { success: false, error: "Employee must have an email address for background check" };
  }

  try {
    // 1. Create Checkr candidate
    const candidateResult = await createCandidate({
      firstName: employee.legalFirstName,
      lastName: employee.legalLastName,
      email: employee.email,
      phone: employee.phone || undefined,
      dob: employee.dob ? String(employee.dob) : undefined,
      zipcode: employee.zip || undefined,
    });

    if (!candidateResult.success || !candidateResult.candidateId) {
      return { success: false, error: candidateResult.error || "Failed to create Checkr candidate" };
    }

    // 2. Send invitation
    const invitationResult = await createInvitation(candidateResult.candidateId, packageSlug);
    if (!invitationResult.success) {
      return { success: false, error: invitationResult.error || "Failed to send Checkr invitation" };
    }

    // 3. Create clearance record in our DB
    const clearanceId = await db.createClearance({
      employeeId,
      type: clearanceType as any,
      status: "initiated" as any,
      submissionDate: new Date().toISOString().split("T")[0],
      checkrCandidateId: candidateResult.candidateId,
      notes: `Checkr invitation sent. Package: ${packageSlug}`,
    } as any);

    // 4. Update employee flag
    await db.updateEmployee(employeeId, {
      [`${clearanceType === "PA_PATCH" ? "patchReceived" : clearanceType === "FBI" ? "fbiReceived" : "childAbuseReceived"}`]: false,
    } as any);

    // 5. Notify HR
    await notifyHRAndAdmin({
      type: "checkr_initiated",
      title: "Background Check Initiated",
      body: `${clearanceType} background check initiated for ${employee.legalFirstName} ${employee.legalLastName} via Checkr.`,
      category: "compliance",
      severity: "info",
      actionUrl: `/employees/${employeeId}`,
      metadata: {
        employeeId: employee.employeeId,
        clearanceType,
        candidateId: candidateResult.candidateId,
      },
    });

    console.log(
      `[Checkr] Background check initiated for ${employee.employeeId}: type=${clearanceType}, candidate=${candidateResult.candidateId}`
    );

    return {
      success: true,
      candidateId: candidateResult.candidateId,
      invitationUrl: invitationResult.invitationUrl,
      clearanceId,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Checkr] Initiation error:", msg);
    return { success: false, error: msg };
  }
}
