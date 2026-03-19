/**
 * Checkr API Client
 *
 * REST client for Checkr background check service.
 * Handles candidate creation, invitation sending, and report retrieval.
 *
 * Required env vars:
 *   CHECKR_API_KEY — API key (used as Basic auth username)
 *   CHECKR_ENV — "sandbox" or "production"
 */

const CHECKR_BASE_URLS: Record<string, string> = {
  sandbox: "https://api.checkr-staging.com",
  production: "https://api.checkr.com",
};

function getBaseUrl(): string {
  const env = process.env.CHECKR_ENV || "sandbox";
  return CHECKR_BASE_URLS[env] || CHECKR_BASE_URLS.sandbox;
}

function getAuthHeader(): string {
  const apiKey = process.env.CHECKR_API_KEY || "";
  return `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`;
}

export function isCheckrConfigured(): boolean {
  return !!process.env.CHECKR_API_KEY;
}

/**
 * Generic Checkr API request
 */
async function checkrFetch<T>(
  path: string,
  options: { method?: string; body?: any } = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  if (!isCheckrConfigured()) {
    return { success: false, error: "Checkr not configured" };
  }

  try {
    const response = await fetch(`${getBaseUrl()}${path}`, {
      method: options.method || "GET",
      headers: {
        Authorization: getAuthHeader(),
        "Content-Type": "application/json",
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Checkr] API error: ${response.status} ${errorText}`);
      return { success: false, error: `Checkr API error: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Checkr] Request failed:", msg);
    return { success: false, error: msg };
  }
}

// ── Candidate Operations ──────────────────────────────────────────────

export interface CheckrCandidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string;
  ssn?: string;
}

export async function createCandidate(data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dob?: string;
  zipcode?: string;
}): Promise<{ success: boolean; candidateId?: string; error?: string }> {
  const result = await checkrFetch<CheckrCandidate>("/v1/candidates", {
    method: "POST",
    body: {
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      dob: data.dob,
      zipcode: data.zipcode,
      work_locations: [{ state: "PA", city: "Philadelphia" }],
    },
  });

  if (result.success && result.data) {
    return { success: true, candidateId: result.data.id };
  }
  return { success: false, error: result.error };
}

// ── Invitation Operations ─────────────────────────────────────────────

export interface CheckrInvitation {
  id: string;
  status: string;
  invitation_url: string;
  candidate_id: string;
  package: string;
}

/**
 * Send a background check invitation to a candidate.
 *
 * @param candidateId - Checkr candidate ID
 * @param packageSlug - Checkr package name (e.g., "tasker_standard", "driver_standard")
 */
export async function createInvitation(
  candidateId: string,
  packageSlug: string = "tasker_standard"
): Promise<{ success: boolean; invitationId?: string; invitationUrl?: string; error?: string }> {
  const result = await checkrFetch<CheckrInvitation>("/v1/invitations", {
    method: "POST",
    body: {
      candidate_id: candidateId,
      package: packageSlug,
    },
  });

  if (result.success && result.data) {
    return {
      success: true,
      invitationId: result.data.id,
      invitationUrl: result.data.invitation_url,
    };
  }
  return { success: false, error: result.error };
}

// ── Report Operations ─────────────────────────────────────────────────

export interface CheckrReport {
  id: string;
  status: string; // "pending", "complete", "suspended"
  result: string | null; // null while pending, "clear", "consider"
  adjudication: string | null; // null, "engaged", "pre_adverse_action", "adverse_action"
  candidate_id: string;
  completed_at: string | null;
  package: string;
  turnaround_time: number | null;
}

export async function getReport(
  reportId: string
): Promise<{ success: boolean; report?: CheckrReport; error?: string }> {
  const result = await checkrFetch<CheckrReport>(`/v1/reports/${reportId}`);
  if (result.success && result.data) {
    return { success: true, report: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Download the report PDF
 */
export async function getReportDocument(
  reportId: string
): Promise<{ success: boolean; pdfBuffer?: Buffer; error?: string }> {
  if (!isCheckrConfigured()) {
    return { success: false, error: "Checkr not configured" };
  }

  try {
    const response = await fetch(
      `${getBaseUrl()}/v1/reports/${reportId}/document`,
      {
        headers: { Authorization: getAuthHeader() },
      }
    );

    if (!response.ok) {
      return { success: false, error: `Checkr API error: ${response.status}` };
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    return { success: true, pdfBuffer: buffer };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: msg };
  }
}
