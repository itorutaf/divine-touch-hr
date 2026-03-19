/**
 * CareBase Authentication Service
 * Replaces Manus OAuth with standalone email/password auth using scrypt + JWT.
 * Uses the same cookie-based session pattern so all tRPC middleware keeps working.
 */

import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
import type { Request } from "express";
import { nanoid } from "nanoid";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "../_core/env";
import { COOKIE_NAME } from "@shared/const";

const scryptAsync = promisify(scrypt);

const SALT_LENGTH = 32;
const KEY_LENGTH = 64;
const SESSION_EXPIRY_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

// ── Password Hashing (scrypt - OWASP recommended KDF) ──────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  const hashBuffer = Buffer.from(hash, "hex");
  return timingSafeEqual(derived, hashBuffer);
}

// ── JWT Session Management ─────────────────────────────────────────

type SessionPayload = {
  userId: number;
  email: string;
  name: string;
  role: string;
};

function getSessionSecret() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

export async function createSessionToken(
  payload: SessionPayload
): Promise<string> {
  const secret = getSessionSecret();
  const expiresAt = Math.floor((Date.now() + SESSION_EXPIRY_MS) / 1000);

  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime(expiresAt)
    .sign(secret);
}

export async function verifySession(
  cookieValue: string | undefined | null
): Promise<SessionPayload | null> {
  if (!cookieValue) return null;

  try {
    const secret = getSessionSecret();
    const { payload } = await jwtVerify(cookieValue, secret, {
      algorithms: ["HS256"],
    });

    const { userId, email, name, role } = payload as Record<string, unknown>;

    if (typeof userId !== "number" || typeof email !== "string") {
      return null;
    }

    return {
      userId,
      email,
      name: (name as string) ?? "",
      role: (role as string) ?? "user",
    };
  } catch {
    return null;
  }
}

// ── User Registration & Login ──────────────────────────────────────

export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<User> {
  const existing = await db.getUserByEmail(email);
  if (existing) {
    throw new Error("An account with this email already exists");
  }

  const passwordHash = await hashPassword(password);
  const openId = nanoid(); // Backward-compat: existing code references openId

  const user = await db.createUserWithPassword({
    openId,
    email,
    name,
    password: passwordHash,
    loginMethod: "email",
    lastSignedIn: new Date(),
  });

  if (!user) {
    throw new Error("Failed to create user account");
  }

  return user;
}

export async function loginUser(
  email: string,
  password: string
): Promise<User> {
  const user = await db.getUserByEmail(email);
  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.password) {
    throw new Error("This account does not have a password set. Contact your administrator.");
  }

  const valid = await verifyPassword(password, user.password);
  if (!valid) {
    throw new Error("Invalid email or password");
  }

  // Update last signed in
  await db.upsertUser({
    openId: user.openId,
    lastSignedIn: new Date(),
  });

  return user;
}

// ── Request Authentication (replaces sdk.authenticateRequest) ──────

export async function authenticateRequest(req: Request): Promise<User> {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    throw new Error("No session cookie");
  }

  const cookies = parseCookieHeader(cookieHeader);
  const sessionCookie = cookies[COOKIE_NAME];
  const session = await verifySession(sessionCookie);

  if (!session) {
    throw new Error("Invalid or expired session");
  }

  const user = await db.getUserById(session.userId);
  if (!user) {
    throw new Error("User not found");
  }

  return user;
}
