/**
 * Exclusion Screening Orchestrator
 *
 * Runs monthly LEIE + SAM.gov screening against all active employees.
 * Designed to be called by cron job (1st of each month).
 *
 * Flow:
 * 1. Download LEIE CSV once (30MB, ~75K records)
 * 2. For each active employee: screen against LEIE + SAM
 * 3. Record results in exclusion_screenings table
 * 4. On any match: create exception + critical notification
 */

import * as db from "../../db";
import { screenEmployeeAgainstLEIE, downloadLEIEData, type LEIERecord } from "./leie";
import { screenEmployeeAgainstSAM } from "./sam";
import { notifyComplianceTeam } from "../../notifications";

interface ScreeningBatchResult {
  success: boolean;
  totalScreened: number;
  leieMatches: number;
  samMatches: number;
  errors: number;
  duration: number;
}

/**
 * Run monthly exclusion screening for all active employees.
 */
export async function runMonthlyScreening(): Promise<ScreeningBatchResult> {
  const startTime = Date.now();
  const result: ScreeningBatchResult = {
    success: false,
    totalScreened: 0,
    leieMatches: 0,
    samMatches: 0,
    errors: 0,
    duration: 0,
  };

  try {
    // 1. Get all active employees
    const allEmployees = await db.getAllEmployees();
    const activeEmployees = allEmployees.filter(
      (e: any) => e.currentPhase === "Active" || e.currentPhase === "Ready to Schedule"
    );

    if (activeEmployees.length === 0) {
      console.log("[Screening] No active employees to screen");
      result.success = true;
      result.duration = Date.now() - startTime;
      return result;
    }

    console.log(`[Screening] Starting monthly screening for ${activeEmployees.length} employee(s)`);

    // 2. Download LEIE data once for batch processing
    let leieData: LEIERecord[] = [];
    try {
      leieData = await downloadLEIEData();
      console.log(`[Screening] LEIE data loaded: ${leieData.length} records`);
    } catch (err) {
      console.error("[Screening] Failed to download LEIE data:", err);
    }

    // 3. Screen each employee
    for (const employee of activeEmployees) {
      result.totalScreened++;

      try {
        // LEIE screening
        const leieResult = await screenEmployeeAgainstLEIE(employee as any, leieData);

        // SAM screening (with rate limit awareness — 10 req/min)
        const samResult = await screenEmployeeAgainstSAM(employee as any);

        // Wait between SAM requests to respect rate limits
        await new Promise((resolve) => setTimeout(resolve, 6500)); // ~9 per minute

        // Record result
        await db.createExclusionScreening({
          employeeId: employee.id,
          screeningDate: new Date().toISOString().split("T")[0],
          leieResult: leieResult.error ? ("error" as any) : leieResult.clear ? ("clear" as any) : ("match" as any),
          samResult: samResult.error ? ("error" as any) : samResult.clear ? ("clear" as any) : ("match" as any),
          matchDetails: (!leieResult.clear || !samResult.clear)
            ? JSON.stringify({
                leie: leieResult.matchDetails ? JSON.parse(leieResult.matchDetails) : null,
                sam: samResult.matchDetails ? JSON.parse(samResult.matchDetails) : null,
              })
            : null,
        } as any);

        // Handle matches
        if (!leieResult.clear) {
          result.leieMatches++;
          await handleMatch(employee, "LEIE", leieResult.matchDetails || "");
        }

        if (!samResult.clear) {
          result.samMatches++;
          await handleMatch(employee, "SAM", samResult.matchDetails || "");
        }
      } catch (empError) {
        result.errors++;
        console.error(`[Screening] Error screening employee ${employee.id}:`, empError);
      }
    }

    result.success = true;
    result.duration = Date.now() - startTime;

    console.log(
      `[Screening] Complete: ${result.totalScreened} screened, ` +
      `${result.leieMatches} LEIE matches, ${result.samMatches} SAM matches, ` +
      `${result.errors} errors, ${Math.round(result.duration / 1000)}s`
    );

    // Update integration last sync
    await db.upsertIntegrationConfig("sam_gov", { lastSyncAt: new Date() });

    return result;
  } catch (error) {
    console.error("[Screening] Fatal error:", error);
    result.duration = Date.now() - startTime;
    return result;
  }
}

/**
 * Handle an exclusion match — create exception, notify compliance, escalate.
 */
async function handleMatch(
  employee: any,
  source: "LEIE" | "SAM",
  matchDetails: string
) {
  console.warn(
    `[Screening] ${source} MATCH found for ${employee.legalFirstName} ${employee.legalLastName} (${employee.employeeId})`
  );

  // Create exception
  await db.createException({
    employeeId: employee.id,
    issue: `URGENT: ${source} federal exclusion match found during monthly screening. Employee must be reviewed immediately — PA Medicaid regulations require immediate action.`,
    owner: "Compliance",
    notes: `Match details: ${matchDetails || "See screening record for details."}`,
  });

  // Set escalation flag
  await db.updateEmployee(employee.id, {
    escalationFlag: true,
    status: "Action Required" as any,
    nextAction: `URGENT: ${source} exclusion match — verify and take immediate action`,
  });

  // CRITICAL notification — goes to all channels (SES + SMS + in-app)
  await notifyComplianceTeam({
    type: "exclusion_match",
    title: `${source} Exclusion Match — ${employee.legalFirstName} ${employee.legalLastName}`,
    body: `URGENT: ${employee.legalFirstName} ${employee.legalLastName} (${employee.employeeId}) matched the ${source} federal exclusion database during monthly screening. This employee MUST be reviewed immediately and may need to be suspended pending investigation. PA Medicaid regulations require immediate action on exclusion matches.`,
    category: "compliance",
    severity: "critical",
    actionUrl: `/employees/${employee.id}`,
    metadata: {
      employeeId: employee.employeeId,
      source,
      matchDetails: matchDetails ? JSON.parse(matchDetails) : null,
    },
  });
}
