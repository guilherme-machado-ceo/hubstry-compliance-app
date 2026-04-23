import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as db from "../../server/db";
import { sdk } from "../../server/_core/sdk";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const code = typeof req.query.code === "string" ? req.query.code : undefined;
  const state = typeof req.query.state === "string" ? req.query.state : undefined;

  if (!code || !state) {
    return res.redirect("/?error=missing_params");
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

    const isSecure = (req.headers["x-forwarded-proto"] as string) === "https";
    const cookieParts = [
      `${COOKIE_NAME}=${sessionToken}`,
      "HttpOnly",
      "Path=/",
      `SameSite=${isSecure ? "None" : "Lax"}`,
      isSecure ? "Secure" : "",
      `Max-Age=${Math.floor(ONE_YEAR_MS / 1000)}`,
    ].filter(Boolean);

    res.setHeader("Set-Cookie", cookieParts.join("; "));
    return res.redirect("/dashboard");
  } catch (error) {
    console.error("[Auth] GitHub callback error:", error);
    return res.redirect("/?error=auth_failed");
  }
}
