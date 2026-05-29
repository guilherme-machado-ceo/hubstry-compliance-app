import type { Request } from "express";
import { getHeader } from "./express5-compat";

function isSecureRequest(req: Request) {
  const forwardedProto = getHeader(req, "x-forwarded-proto");
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : String(forwardedProto).split(",");

  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request,
): {
  domain?: string;
  httpOnly?: boolean;
  path?: string;
  sameSite?: "strict" | "lax" | "none" | boolean;
  secure?: boolean;
} {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req),
  };
}
