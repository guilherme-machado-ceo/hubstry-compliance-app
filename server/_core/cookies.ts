import type { Request } from "express";
import { getProtocol, getHeader } from "./express5-compat";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (getProtocol(req) === "https") return true;

  const forwardedProto = getHeader(req, "x-forwarded-proto");
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : String(forwardedProto).split(",");

  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(
  req: Request,
): Pick<
    {
      domain?: string;
      httpOnly?: boolean;
      path?: string;
      sameSite?: "strict" | "lax" | "none" | boolean;
      secure?: boolean;
    },
    "domain" | "httpOnly" | "path" | "sameSite" | "secure"
> {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req),
  };
}
