/**
 * JotForm → CareBase Field Mapping Engine
 *
 * Maps JotForm submission field IDs to employee schema columns.
 * Default mapping matches Divine Touch's existing HIPAA JotForm application.
 * Custom mappings can be stored in the integration_configs table.
 */

import type { InsertEmployee } from "../../../drizzle/schema";

/**
 * Default field mapping for Divine Touch's JotForm worker application.
 * Keys = JotForm question IDs, values = employee column names.
 */
export const DEFAULT_FIELD_MAP: Record<string, string> = {
  // Full Name field (JotForm splits into first/last)
  "q3_fullName[first]": "legalFirstName",
  "q3_fullName[last]": "legalLastName",
  // Or single name fields
  "q3_firstName": "legalFirstName",
  "q4_lastName": "legalLastName",
  // Contact info
  "q5_phoneNumber": "phone",
  "q6_email": "email",
  // Address
  "q8_address[addr_line1]": "addressLine1",
  "q8_address[city]": "city",
  "q8_address[state]": "state",
  "q8_address[postal]": "zip",
  // Role & service line
  "q10_roleApplied": "roleAppliedFor",
  "q11_serviceLine": "serviceLine",
  // Preferred name
  "q12_preferredName": "preferredName",
  // Date of birth
  "q13_dateOfBirth": "dob",
  // SSN last 4
  "q14_ssnLast4": "ssnLast4",
};

/**
 * Parse a JotForm submission payload using the given field map.
 * JotForm sends data in various formats depending on the webhook config.
 */
export function mapJotFormToEmployee(
  rawPayload: Record<string, any>,
  fieldMap: Record<string, string> = DEFAULT_FIELD_MAP
): Partial<InsertEmployee> {
  const result: Record<string, any> = {};

  // JotForm webhooks can nest answers under rawRequest or send flat
  const answers = rawPayload.rawRequest
    ? JSON.parse(rawPayload.rawRequest)
    : rawPayload;

  // Try to map each field
  for (const [jotFormKey, employeeCol] of Object.entries(fieldMap)) {
    // Support both flat keys and nested bracket notation
    const value = resolveNestedKey(answers, jotFormKey);
    if (value !== undefined && value !== null && value !== "") {
      result[employeeCol] = String(value).trim();
    }
  }

  // Handle JotForm's "pretty" format where full name is a single string
  if (!result.legalFirstName && answers.q3_fullName && typeof answers.q3_fullName === "string") {
    const parts = answers.q3_fullName.trim().split(/\s+/);
    result.legalFirstName = parts[0] || "";
    result.legalLastName = parts.slice(1).join(" ") || "";
  }

  // Validate service line
  if (result.serviceLine) {
    const normalized = result.serviceLine.toUpperCase();
    if (["OLTL", "ODP", "SKILLED"].includes(normalized)) {
      result.serviceLine = normalized === "SKILLED" ? "Skilled" : normalized;
    } else {
      delete result.serviceLine; // Invalid — let HR set it manually
    }
  }

  return result as Partial<InsertEmployee>;
}

/**
 * Resolve a possibly nested key like "q8_address[city]" from a flat or nested object
 */
function resolveNestedKey(obj: Record<string, any>, key: string): any {
  // Try direct match first
  if (obj[key] !== undefined) return obj[key];

  // Handle bracket notation: "q8_address[city]" → obj.q8_address.city
  const bracketMatch = key.match(/^(\w+)\[(\w+)\]$/);
  if (bracketMatch) {
    const [, parent, child] = bracketMatch;
    if (obj[parent] && typeof obj[parent] === "object") {
      return obj[parent][child];
    }
  }

  // JotForm sometimes uses numbered answers: { "3": { "first": "John", "last": "Doe" } }
  const qMatch = key.match(/^q(\d+)_/);
  if (qMatch) {
    const qNum = qMatch[1];
    if (obj[qNum]) {
      // Check if it's a nested answer
      const subKey = key.replace(/^q\d+_\w+\[(\w+)\]$/, "$1");
      if (typeof obj[qNum] === "object" && obj[qNum][subKey]) {
        return obj[qNum][subKey];
      }
      if (typeof obj[qNum] === "string") {
        return obj[qNum];
      }
    }
  }

  return undefined;
}
