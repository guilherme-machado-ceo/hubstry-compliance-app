import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers.js";
import { COOKIE_NAME } from "../_shared/const.js";
import type { TrpcContext } from "./_core/context.js";
import handler from "../trpc/[trpc].js";

/**
 * O logout apaga o cookie de sessão escrevendo o cabeçalho `Set-Cookie`
 * diretamente (clearCookieRaw em _core/express5-compat.ts), que é o que
 * funciona com a VercelResponse. O teste antigo simulava `res.clearCookie`
 * (API do Express), que o código não usa mais; por isso recebia uma lista
 * vazia. Aqui o `res` simulado expõe `setHeader`, como em produção.
 *
 * Para o navegador apagar o cookie criado no login (api/oauth/[oauth].ts:
 * `app_session_id`, `Path=/`, sem `Domain`, `Secure` + `SameSite=None` em
 * HTTPS), o `Set-Cookie` do logout precisa ter o mesmo nome, caminho e
 * domínio, valor vazio e `Max-Age` <= 0.
 */

type Cookie = { name: string; value: string; attrs: Record<string, string | true> };

function parseSetCookie(header: string): Cookie {
  const [pair, ...rest] = header.split(";").map((p) => p.trim());
  const eq = pair.indexOf("=");
  const attrs: Record<string, string | true> = {};
  for (const part of rest) {
    const i = part.indexOf("=");
    if (i === -1) attrs[part.toLowerCase()] = true;
    else attrs[part.slice(0, i).toLowerCase()] = part.slice(i + 1);
  }
  return { name: pair.slice(0, eq), value: pair.slice(eq + 1), attrs };
}

function expectSessionCookieCleared(header: string | undefined) {
  expect(header, "Set-Cookie ausente").toBeTypeOf("string");
  const cookie = parseSetCookie(header as string);
  expect(cookie.name).toBe(COOKIE_NAME);
  expect(cookie.value).toBe("");
  expect(cookie.attrs["path"]).toBe("/");
  expect(cookie.attrs["domain"]).toBeUndefined();
  expect(Number(cookie.attrs["max-age"])).toBeLessThanOrEqual(0);
  expect(cookie.attrs["httponly"]).toBe(true);
  expect(cookie.attrs["secure"]).toBe(true);
  expect(String(cookie.attrs["samesite"]).toLowerCase()).toBe("none");
}

describe("auth.logout", () => {
  it("apaga o cookie de sessão via Set-Cookie e informa sucesso", async () => {
    const headers: Record<string, string> = {};
    const ctx = {
      user: null,
      // Na Vercel, HTTPS chega como x-forwarded-proto.
      req: { headers: { "x-forwarded-proto": "https" } },
      res: { setHeader: (name: string, value: string) => (headers[name.toLowerCase()] = value) },
    } as unknown as TrpcContext;

    const result = await appRouter.createCaller(ctx).auth.logout();

    expect(result).toEqual({ success: true });
    expectSessionCookieCleared(headers["set-cookie"]);
  });

  it("pelo handler de produção (api/trpc/[trpc].ts), o Set-Cookie chega na resposta", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const headers: Record<string, string> = {};
    let statusCode = 0;
    let body = "";
    const res = {
      setHeader: (name: string, value: string) => (headers[name.toLowerCase()] = value),
      status(code: number) {
        statusCode = code;
        return res;
      },
      send(payload: string) {
        body = payload;
        return res;
      },
    };
    const req = {
      method: "POST",
      url: "/api/trpc/auth.logout",
      headers: { host: "example.com", "content-type": "application/json", "x-forwarded-proto": "https" },
      body: {},
    };

    await handler(req as never, res as never);

    expect(statusCode).toBe(200);
    expect(JSON.parse(body)).toMatchObject({ result: { data: { json: { success: true } } } });
    // O handler copia os cabeçalhos do tRPC depois; não pode apagar o Set-Cookie.
    expectSessionCookieCleared(headers["set-cookie"]);
  });
});
