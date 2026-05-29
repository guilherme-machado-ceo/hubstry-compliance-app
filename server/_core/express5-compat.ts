/**
 * Express 5 changed several type definitions.
 * This module provides compatibility helpers for accessing request/response
 * properties that moved or changed types between Express 4 and Express 5.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get request protocol (http/https).
 * Express 5 moved this off the core Request type.
 */
export function getProtocol(req: any): string {
  return req.protocol ?? (req.headers?.["x-forwarded-proto"] === "https" ? "https" : "http");
}

/**
 * Get a header value from the request.
 */
export function getHeader(req: any, name: string): string | string[] | undefined {
  return req.headers?.[name];
}

/**
 * Get the origin header from the request.
 */
export function getOrigin(req: any): string {
  return req.headers?.["origin"] ?? "https://localhost:3000";
}

/**
 * Set a cookie using the raw Set-Cookie header (works with VercelResponse too).
 */
export function setCookieHeader(res: any, cookie: string): void {
  if (typeof res.setHeader === "function") {
    res.setHeader("Set-Cookie", cookie);
  } else if (typeof res.appendHeader === "function") {
    res.appendHeader("Set-Cookie", cookie);
  }
}

/**
 * Clear a cookie by setting an expired Set-Cookie header.
 * Bypasses Express 5's clearCookie which may not exist on the Response type.
 */
export function clearCookieRaw(
  res: any,
  name: string,
  options: Record<string, unknown>,
): void {
  const parts = [
    `${name}=`,
    "Path=/",
    options?.["httpOnly"] ? "HttpOnly" : "",
    options?.["sameSite"] ? `SameSite=${options["sameSite"]}` : "",
    options?.["secure"] ? "Secure" : "",
    `Max-Age=-1`,
    options?.["domain"] ? `Domain=${options["domain"]}` : "",
  ].filter(Boolean);

  setCookieHeader(res, parts.join("; "));
}
