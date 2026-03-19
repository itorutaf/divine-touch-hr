/**
 * CareBase Auth Routes
 * Replaces Manus OAuth callback with local email/password endpoints.
 */

import { COOKIE_NAME } from "@shared/const";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "../_core/cookies";
import {
  authenticateRequest,
  createSessionToken,
  loginUser,
  registerUser,
} from "./authService";

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export function registerAuthRoutes(app: Express) {
  // ── POST /api/auth/login ────────────────────────────────────────
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await loginUser(email, password);

      const token = await createSessionToken({
        userId: user.id,
        email: user.email ?? "",
        name: (user.name as string) ?? "",
        role: user.role,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: SESSION_MAX_AGE_MS,
      });

      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (error: any) {
      return res.status(401).json({ error: error.message ?? "Login failed" });
    }
  });

  // ── POST /api/auth/register ─────────────────────────────────────
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res
          .status(400)
          .json({ error: "Email, password, and name are required" });
      }

      if (password.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
      }

      const user = await registerUser(email, password, name);

      const token = await createSessionToken({
        userId: user.id,
        email: user.email ?? "",
        name: (user.name as string) ?? "",
        role: user.role,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, token, {
        ...cookieOptions,
        maxAge: SESSION_MAX_AGE_MS,
      });

      return res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch (error: any) {
      const status = error.message?.includes("already exists") ? 409 : 500;
      return res.status(status).json({ error: error.message ?? "Registration failed" });
    }
  });

  // ── POST /api/auth/logout ───────────────────────────────────────
  app.post("/api/auth/logout", async (_req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    return res.json({ success: true });
  });

  // ── GET /api/auth/me ────────────────────────────────────────────
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } catch {
      return res.status(401).json({ error: "Not authenticated" });
    }
  });
}
