import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sdk } from "../../server/_core/sdk";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.GITHUB_CLIENT_ID) {
    return res.status(500).json({ error: "GITHUB_CLIENT_ID not configured" });
  }

  const host = req.headers.host || "";
  const protocol = (req.headers["x-forwarded-proto"] as string) || "https";
  const callbackUrl = `${protocol}://${host}/api/oauth/callback`;

  const authUrl = sdk.getGitHubAuthUrl(callbackUrl);
  return res.redirect(authUrl);
}
