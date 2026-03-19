/**
 * OIG LEIE (List of Excluded Individuals/Entities) Screening
 *
 * Downloads the LEIE CSV from OIG and matches against employees.
 * The LEIE is a federal exclusion list — anyone on it cannot be employed
 * by Medicaid/Medicare providers (PA home care agencies bill through these).
 *
 * Source: https://oig.hhs.gov/exclusions/downloadables/
 */

interface LEIERecord {
  lastName: string;
  firstName: string;
  dob?: string;
  exclusionType: string;
  exclusionDate: string;
  state?: string;
}

interface ScreeningResult {
  clear: boolean;
  matchDetails?: string;
  error?: string;
}

/**
 * Download and parse the OIG LEIE CSV file.
 * The file is ~30MB and contains ~75K records.
 */
async function downloadLEIEData(): Promise<LEIERecord[]> {
  const url = process.env.LEIE_CSV_URL || "https://oig.hhs.gov/exclusions/downloadables/UPDATED.csv";

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download LEIE: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.split("\n");

    // Skip header row
    const records: LEIERecord[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // CSV format: LASTNAME,FIRSTNAME,MIDNAME,BUSNAME,GENERAL,SPECIALTY,UPIN,NPI,DOB,ADDRESS,CITY,STATE,ZIP,EXCLTYPE,EXCLDATE,REINDATE,WAIVERDATE,WVRSTATE
      const fields = parseCSVLine(line);
      if (fields.length < 15) continue;

      records.push({
        lastName: (fields[0] || "").toUpperCase().trim(),
        firstName: (fields[1] || "").toUpperCase().trim(),
        dob: fields[8] || undefined,
        exclusionType: fields[13] || "",
        exclusionDate: fields[14] || "",
        state: fields[11] || undefined,
      });
    }

    console.log(`[LEIE] Downloaded ${records.length} records from OIG`);
    return records;
  } catch (error) {
    console.error("[LEIE] Download failed:", error);
    return [];
  }
}

/**
 * CSV line parser that handles quoted fields and escaped double-quotes ("" → ")
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      // Handle escaped double-quote ("") inside quoted fields
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Screen a single employee against the LEIE database.
 *
 * Matching criteria:
 * - Exact last name match (case-insensitive)
 * - First name starts-with match (to handle nicknames)
 * - If DOB available, must also match
 */
export async function screenEmployeeAgainstLEIE(
  employee: { legalFirstName: string; legalLastName: string; dob?: string | null },
  leieData?: LEIERecord[]
): Promise<ScreeningResult> {
  try {
    // Download LEIE data if not provided (for batch screening, pass it in to avoid re-downloading)
    const data = leieData || await downloadLEIEData();
    if (data.length === 0) {
      // Fail-closed: if we can't download the data, report error (don't assume clear)
      return { clear: false, error: "Could not download LEIE data — screening inconclusive" };
    }

    const empLastName = employee.legalLastName.toUpperCase().trim();
    const empFirstName = employee.legalFirstName.toUpperCase().trim();

    // Find potential matches
    const matches = data.filter((record) => {
      // Exact last name match
      if (record.lastName !== empLastName) return false;

      // First name starts-with (e.g., "JOHN" matches "JONATHAN")
      if (!record.firstName.startsWith(empFirstName.slice(0, 3))) return false;

      // If both have DOB, must match
      if (employee.dob && record.dob) {
        const empDob = new Date(employee.dob).toISOString().split("T")[0];
        const recDob = new Date(record.dob).toISOString().split("T")[0];
        if (empDob !== recDob) return false;
      }

      return true;
    });

    if (matches.length > 0) {
      return {
        clear: false,
        matchDetails: JSON.stringify(matches.map((m) => ({
          name: `${m.firstName} ${m.lastName}`,
          exclusionType: m.exclusionType,
          exclusionDate: m.exclusionDate,
          state: m.state,
        }))),
      };
    }

    return { clear: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { clear: false, error: `LEIE screening error: ${msg}` }; // Fail-closed — require manual review
  }
}

// Re-export for use by orchestrator
export { downloadLEIEData };
export type { LEIERecord };
