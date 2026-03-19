/**
 * SAM.gov Exclusion Screening
 *
 * Queries the SAM.gov Entity Management API to check for federal exclusions.
 * SAM = System for Award Management, maintained by GSA.
 *
 * Required env vars:
 *   SAM_API_KEY — Free API key from api.sam.gov
 */

interface SAMScreeningResult {
  clear: boolean;
  matchDetails?: string;
  error?: string;
}

const SAM_API_BASE = "https://api.sam.gov/entity-information/v3/entities";

/**
 * Screen a single employee against SAM.gov exclusion list.
 *
 * The SAM.gov API is rate-limited (10 requests/minute for free tier),
 * so we use name-based search with minimal fields.
 */
export async function screenEmployeeAgainstSAM(
  employee: { legalFirstName: string; legalLastName: string }
): Promise<SAMScreeningResult> {
  const apiKey = process.env.SAM_API_KEY;

  if (!apiKey) {
    console.log("[SAM] API key not configured — skipping SAM screening");
    return { clear: true, error: "SAM.gov API key not configured" };
  }

  try {
    const params = new URLSearchParams({
      api_key: apiKey,
      q: `${employee.legalFirstName} ${employee.legalLastName}`,
      purposeOfRegistrationCode: "Z2", // Exclusion records
      registrationStatus: "A", // Active
      includeSections: "entityRegistration,coreData",
    });

    const response = await fetch(`${SAM_API_BASE}?${params.toString()}`);

    if (!response.ok) {
      if (response.status === 429) {
        return { clear: true, error: "SAM.gov rate limit exceeded — will retry next run" };
      }
      const errorText = await response.text();
      console.error(`[SAM] API error: ${response.status} ${errorText}`);
      return { clear: true, error: `SAM.gov API error: ${response.status}` };
    }

    const data = await response.json();
    const totalRecords = data.totalRecords || 0;

    if (totalRecords === 0) {
      return { clear: true };
    }

    // Check if any returned entities have active exclusions
    const entities = data.entityData || [];
    const exclusionMatches = entities.filter((entity: any) => {
      const name = entity.entityRegistration?.legalBusinessName ||
        `${entity.coreData?.entityInformation?.entityFirstName || ""} ${entity.coreData?.entityInformation?.entityLastName || ""}`;

      // Basic name similarity check
      const nameUpper = name.toUpperCase();
      return (
        nameUpper.includes(employee.legalLastName.toUpperCase()) &&
        nameUpper.includes(employee.legalFirstName.toUpperCase().slice(0, 3))
      );
    });

    if (exclusionMatches.length > 0) {
      return {
        clear: false,
        matchDetails: JSON.stringify(exclusionMatches.map((e: any) => ({
          name: e.entityRegistration?.legalBusinessName || "Unknown",
          ueiSAM: e.entityRegistration?.ueiSAM,
          exclusionType: e.coreData?.entityInformation?.entityType,
        }))),
      };
    }

    return { clear: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[SAM] Screening error:", msg);
    return { clear: true, error: msg };
  }
}
