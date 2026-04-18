import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;   // GitHub user ID as string
  appId: string;    // kept for compatibility ("github")
  name: string;
};

// ── GitHub OAuth ──────────────────────────────────────────────

interface GitHubTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
}

interface GitHubUserResponse {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

interface GitHubEmailEntry {
  email: string;
  primary: boolean;
  verified: boolean;
}

async function exchangeGitHubCode(
  code: string,
  redirectUri: string
): Promise<GitHubTokenResponse> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: ENV.githubClientId,
      client_secret: ENV.githubClientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    throw new Error(`GitHub token exchange failed: ${res.status}`);
  }

  const data = (await res.json()) as GitHubTokenResponse & { error?: string };
  if (data.error) {
    throw new Error(`GitHub OAuth error: ${data.error}`);
  }

  return data;
}

async function getGitHubUser(accessToken: string): Promise<{
  openId: string;
  name: string;
  email: string | null;
  loginMethod: string;
}> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
  };

  const [userRes, emailsRes] = await Promise.all([
    fetch("https://api.github.com/user", { headers }),
    fetch("https://api.github.com/user/emails", { headers }),
  ]);

  if (!userRes.ok) throw new Error(`GitHub user fetch failed: ${userRes.status}`);

  const user = (await userRes.json()) as GitHubUserResponse;

  let email = user.email;
  if (!email && emailsRes.ok) {
    const emails = (await emailsRes.json()) as GitHubEmailEntry[];
    const primary = emails.find((e) => e.primary && e.verified);
    email = primary?.email ?? null;
  }

  return {
    openId: String(user.id),
    name: user.name || user.login,
    email,
    loginMethod: "github",
  };
}

// ── SDKServer ─────────────────────────────────────────────────

class SDKServer {
  // ── GitHub OAuth helpers ──────────────────────────────────

  getGitHubAuthUrl(redirectUri: string): string {
    const state = btoa(redirectUri);
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", ENV.githubClientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "user:email");
    url.searchParams.set("state", state);
    return url.toString();
  }

  async handleGitHubCallback(
    code: string,
    state: string
  ): Promise<{ openId: string; name: string; email: string | null; loginMethod: string }> {
    const redirectUri = atob(state);
    const tokenData = await exchangeGitHubCode(code, redirectUri);
    return getGitHubUser(tokenData.access_token);
  }

  // ── JWT Session ───────────────────────────────────────────

  private getSessionSecret() {
    return new TextEncoder().encode(ENV.cookieSecret);
  }

  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      { openId, appId: "github", name: options.name || "" },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) return null;
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId)) return null;
      return { openId, appId, name: String(name ?? "") };
    } catch {
      return null;
    }
  }

  // ── authenticateRequest ───────────────────────────────────

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    return new Map(Object.entries(parseCookieHeader(cookieHeader)));
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) throw ForbiddenError("Invalid session cookie");

    const signedInAt = new Date();
    const user = await db.getUserByOpenId(session.openId);

    if (!user) throw ForbiddenError("User not found");

    await db.upsertUser({ openId: user.openId, lastSignedIn: signedInAt });

    return user;
  }
}

export const sdk = new SDKServer();
