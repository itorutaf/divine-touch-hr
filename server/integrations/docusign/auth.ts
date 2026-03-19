/**
 * DocuSign JWT Authentication
 *
 * Implements the JWT Grant flow for server-to-server DocuSign API access.
 * Tokens are cached and auto-refreshed (tokens last ~1 hour).
 *
 * Required env vars:
 *   DOCUSIGN_INTEGRATION_KEY — OAuth integration key (client ID)
 *   DOCUSIGN_USER_ID — The user ID to impersonate
 *   DOCUSIGN_ACCOUNT_ID — The DocuSign account ID
 *   DOCUSIGN_PRIVATE_KEY — RSA private key (base64 encoded or PEM)
 *   DOCUSIGN_BASE_URL — API base URL (demo or production)
 */

import * as crypto from "crypto";

interface TokenCache {
  accessToken: string;
  expiresAt: number; // Unix timestamp in ms
}

let tokenCache: TokenCache | null = null;

// Refresh 5 minutes before actual expiry
const REFRESH_BUFFER_MS = 5 * 60 * 1000;

function getConfig() {
  return {
    integrationKey: process.env.DOCUSIGN_INTEGRATION_KEY || "",
    userId: process.env.DOCUSIGN_USER_ID || "",
    accountId: process.env.DOCUSIGN_ACCOUNT_ID || "",
    privateKey: process.env.DOCUSIGN_PRIVATE_KEY || "",
    baseUrl: process.env.DOCUSIGN_BASE_URL || "https://demo.docusign.net/restapi",
    authServer: process.env.DOCUSIGN_AUTH_SERVER || "account-d.docusign.com",
  };
}

/**
 * Build a JWT assertion for DocuSign OAuth
 */
function buildJWTAssertion(): string {
  const config = getConfig();
  const now = Math.floor(Date.now() / 1000);

  const header = {
    typ: "JWT",
    alg: "RS256",
  };

  const payload = {
    iss: config.integrationKey,
    sub: config.userId,
    aud: config.authServer,
    iat: now,
    exp: now + 3600, // 1 hour
    scope: "signature impersonation",
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");

  // Decode private key (might be base64 encoded or raw PEM)
  let privateKeyPem = config.privateKey;
  if (!privateKeyPem.includes("-----BEGIN")) {
    privateKeyPem = Buffer.from(privateKeyPem, "base64").toString("utf-8");
  }

  const signingInput = `${headerB64}.${payloadB64}`;
  const signature = crypto
    .createSign("RSA-SHA256")
    .update(signingInput)
    .sign(privateKeyPem, "base64url");

  return `${signingInput}.${signature}`;
}

/**
 * Get a valid access token, refreshing if necessary.
 * Returns null if DocuSign is not configured.
 */
export async function getAccessToken(): Promise<string | null> {
  const config = getConfig();

  if (!config.integrationKey || !config.privateKey) {
    console.log("[DocuSign] Not configured — skipping auth");
    return null;
  }

  // Return cached token if still valid
  if (tokenCache && tokenCache.expiresAt > Date.now() + REFRESH_BUFFER_MS) {
    return tokenCache.accessToken;
  }

  try {
    const assertion = buildJWTAssertion();

    const response = await fetch(`https://${config.authServer}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[DocuSign] Token request failed: ${response.status} ${errorText}`);
      return null;
    }

    const data = await response.json();
    tokenCache = {
      accessToken: data.access_token,
      expiresAt: Date.now() + data.expires_in * 1000,
    };

    console.log("[DocuSign] Token refreshed successfully");
    return tokenCache.accessToken;
  } catch (error) {
    console.error("[DocuSign] Auth error:", error);
    return null;
  }
}

/**
 * Get the base API URL for DocuSign REST calls
 */
export function getBaseUrl(): string {
  return getConfig().baseUrl;
}

/**
 * Get the account ID for API calls
 */
export function getAccountId(): string {
  return getConfig().accountId;
}

/**
 * Check if DocuSign is configured
 */
export function isDocuSignConfigured(): boolean {
  const config = getConfig();
  return !!(config.integrationKey && config.privateKey && config.accountId);
}
