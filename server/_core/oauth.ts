import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Initiate GitHub OAuth login
  app.get("/api/auth/github", (req: Request, res: Response) => {
    const redirectUri = `${req.protocol}://${req.get("host")}/api/oauth/callback`;
    const authUrl = sdk.getGitHubAuthUrl(redirectUri);
    res.redirect(authUrl);
  });

  // GitHub OAuth callback
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.redirect("/?error=missing_params");
      return;
    }

    try {
      const userInfo = await sdk.handleGitHubCallback(code, state);

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name,
        email: userInfo.email,
        loginMethod: userInfo.loginMethod,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect("/dashboard");
    } catch (error) {
      console.error("[Auth] GitHub callback error:", error);
      res.redirect("/?error=auth_failed");
    }
  });
}
