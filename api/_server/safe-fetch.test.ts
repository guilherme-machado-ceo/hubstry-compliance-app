import { EventEmitter } from "node:events";
import { Readable } from "node:stream";
import { gzipSync } from "node:zlib";
import type http from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertPublicTarget,
  createSafeLookup,
  isPublicIp,
  safeFetchText,
  SafeFetchError,
  type ResolvedAddress,
} from "./safe-fetch.js";

/**
 * Nenhum teste abre socket nem consulta DNS real: DNS e `request` sao simulados.
 */

// ── Simuladores ─────────────────────────────────────────────────────────

interface FakeResponse {
  status?: number;
  statusMessage?: string;
  headers?: Record<string, string>;
  body?: Buffer | string | Readable;
}

interface RecordedRequest {
  options: Record<string, any>;
  destroyed: boolean;
}

/** `request` simulado: responde conforme a fila, registra as chamadas. */
function fakeRequest(responses: FakeResponse[]) {
  const calls: RecordedRequest[] = [];
  const fn = (options: Record<string, any>, cb: (res: http.IncomingMessage) => void) => {
    const record: RecordedRequest = { options, destroyed: false };
    calls.push(record);
    const next = responses.shift();
    if (!next) throw new Error("fakeRequest: sem resposta na fila");

    const req = new EventEmitter() as EventEmitter & {
      end: () => void;
      destroy: () => void;
    };
    req.destroy = () => {
      record.destroyed = true;
    };
    req.end = () => {
      const body =
        next.body instanceof Readable
          ? next.body
          : Readable.from([Buffer.from(next.body ?? "")]);
      const res = Object.assign(body, {
        statusCode: next.status ?? 200,
        statusMessage: next.statusMessage ?? "OK",
        headers: next.headers ?? {},
      });
      queueMicrotask(() => cb(res as unknown as http.IncomingMessage));
    };
    return req as unknown as http.ClientRequest;
  };
  return { fn, calls };
}

const PUBLIC_V4: ResolvedAddress = { address: "93.184.216.34", family: 4 };
const PUBLIC_V6: ResolvedAddress = { address: "2606:2800:21f:cb07:6820:80da:af6b:8b2c", family: 6 };
const resolveTo = (...a: ResolvedAddress[]) => async () => a;

afterEach(() => {
  vi.useRealTimers();
});

// ── Classificacao de IPs ────────────────────────────────────────────────

describe("isPublicIp — faixas bloqueadas (IANA special-purpose)", () => {
  const blocked: Array<[string, string]> = [
    ["0.0.0.0", "0.0.0.0/8 this network"],
    ["0.1.2.3", "0.0.0.0/8 this network"],
    ["10.1.2.3", "10/8 privado"],
    ["100.64.0.1", "100.64/10 CGNAT"],
    ["100.127.255.255", "100.64/10 CGNAT (limite superior)"],
    ["127.0.0.1", "127/8 loopback"],
    ["169.254.169.254", "169.254/16 link-local (metadata)"],
    ["172.16.0.1", "172.16/12 privado"],
    ["172.31.255.255", "172.16/12 privado (limite superior)"],
    ["192.0.0.9", "192.0.0.0/24 protocolo IETF"],
    ["192.0.2.1", "192.0.2/24 TEST-NET-1"],
    ["192.88.99.1", "192.88.99/24 6to4 relay"],
    ["192.168.1.1", "192.168/16 privado"],
    ["198.18.0.1", "198.18/15 benchmarking"],
    ["198.19.255.255", "198.18/15 benchmarking (limite superior)"],
    ["198.51.100.1", "198.51.100/24 TEST-NET-2"],
    ["203.0.113.1", "203.0.113/24 TEST-NET-3"],
    ["224.0.0.1", "224/4 multicast"],
    ["239.255.255.250", "224/4 multicast"],
    ["240.0.0.1", "240/4 reservado"],
    ["255.255.255.255", "broadcast"],
    ["::", "IPv6 nao especificado"],
    ["::1", "IPv6 loopback"],
    ["::ffff:127.0.0.1", "IPv4 mapeado (loopback)"],
    ["::ffff:7f00:1", "IPv4 mapeado, forma hexadecimal"],
    ["::ffff:8.8.8.8", "IPv4 mapeado de endereco publico (bloqueado por politica)"],
    ["64:ff9b::7f00:1", "NAT64 64:ff9b::/96"],
    ["64:ff9b:1::1", "NAT64 64:ff9b:1::/48"],
    ["100::1", "100::/64 discard-only"],
    ["100:0:0:1::1", "100:0:0:1::/64 dummy"],
    ["2001::1", "2001::/23 / Teredo"],
    ["2001:db8::1", "2001:db8::/32 documentacao"],
    ["2002:7f00:1::1", "2002::/16 6to4"],
    ["3fff::1", "3fff::/20 documentacao"],
    ["5f00::1", "5f00::/16 SRv6"],
    ["fc00::1", "fc00::/7 ULA"],
    ["fd12:3456::1", "fc00::/7 ULA (fd)"],
    ["fe80::1", "fe80::/10 link-local"],
    ["febf::1", "fe80::/10 link-local (limite superior)"],
    ["ff02::1", "ff00::/8 multicast"],
    ["1::1", "fora de 2000::/3 (nao alocado)"],
  ];

  for (const [addr, why] of blocked) {
    it(`bloqueia ${addr} (${why})`, () => {
      expect(isPublicIp(addr)).toBe(false);
    });
  }

  it("bloqueia IPv6 entre colchetes e sem colchetes", () => {
    expect(isPublicIp("[::1]")).toBe(false);
    expect(isPublicIp("::1")).toBe(false);
    expect(isPublicIp("[fc00::1]")).toBe(false);
    expect(isPublicIp("[::ffff:7f00:1]")).toBe(false);
  });

  it("rejeita zone id e entradas que nao sao IP (fail-closed)", () => {
    expect(isPublicIp("fe80::1%eth0")).toBe(false);
    expect(isPublicIp("example.com")).toBe(false);
    expect(isPublicIp("")).toBe(false);
    expect(isPublicIp("999.1.1.1")).toBe(false);
  });

  it("aceita enderecos publicos (limites das faixas vizinhas)", () => {
    for (const a of [
      "93.184.216.34",
      "8.8.8.8",
      "1.1.1.1",
      "100.63.255.255",
      "100.128.0.1",
      "172.15.255.255",
      "172.32.0.1",
      "198.17.255.255",
      "198.20.0.1",
      "223.255.255.255",
      "2606:2800:21f:cb07:6820:80da:af6b:8b2c",
      "[2606:4700:4700::1111]",
      "2a00:1450:4001::1",
    ]) {
      expect(isPublicIp(a), a).toBe(true);
    }
  });
});

describe("assertPublicTarget — IP literal antes de qualquer conexao", () => {
  const blockedUrls = [
    "http://127.0.0.1/",
    "http://[::1]/",
    "http://[fc00::1]/",
    "http://[fe80::1]/",
    "http://[::ffff:127.0.0.1]/",
    "http://169.254.169.254/latest/meta-data/",
    "http://2130706433/", // decimal -> 127.0.0.1
    "http://0x7f.1/", //     hexadecimal -> 127.0.0.1
    "http://0/", //          0.0.0.0
    "http://100.64.0.1/",
    "http://[64:ff9b::7f00:1]/",
  ];
  for (const u of blockedUrls) {
    it(`bloqueia ${u}`, () => {
      expect(() => assertPublicTarget(new URL(u))).toThrowError(
        expect.objectContaining({ code: "BLOCKED_ADDRESS" }),
      );
    });
  }

  it("bloqueia protocolo que nao e http/https", () => {
    expect(() => assertPublicTarget(new URL("file:///etc/passwd"))).toThrowError(
      expect.objectContaining({ code: "BAD_PROTOCOL" }),
    );
    expect(() => assertPublicTarget(new URL("ftp://example.com/"))).toThrowError(
      expect.objectContaining({ code: "BAD_PROTOCOL" }),
    );
  });

  it("aceita IP literal publico e nome (validado depois, no lookup)", () => {
    expect(() => assertPublicTarget(new URL("https://93.184.216.34/"))).not.toThrow();
    expect(() => assertPublicTarget(new URL("https://[2606:4700:4700::1111]/"))).not.toThrow();
    expect(() => assertPublicTarget(new URL("https://example.com/"))).not.toThrow();
  });

  it("IP literal bloqueado nao chega a abrir conexao", async () => {
    const { fn, calls } = fakeRequest([{ body: "x" }]);
    await expect(
      safeFetchText("http://127.0.0.1/", { httpRequest: fn as any }),
    ).rejects.toMatchObject({ code: "BLOCKED_ADDRESS" });
    expect(calls).toHaveLength(0);
  });
});

// ── Lookup seguro ───────────────────────────────────────────────────────

describe("createSafeLookup", () => {
  type Cb = (err: any, address?: any, family?: number) => void;
  const call = (
    lookup: ReturnType<typeof createSafeLookup>,
    host: string,
    options: any,
  ) =>
    new Promise<{ err: any; address?: any; family?: number }>((resolve) => {
      (lookup as any)(host, options, ((err: any, address: any, family: number) =>
        resolve({ err, address, family })) as Cb);
    });

  it("assinatura de endereco unico: devolve (address, family)", async () => {
    const lookup = createSafeLookup(resolveTo(PUBLIC_V4, PUBLIC_V6));
    const r = await call(lookup, "example.com", {});
    expect(r.err).toBeNull();
    expect(r.address).toBe("93.184.216.34");
    expect(r.family).toBe(4);
  });

  it("assinatura { all: true }: devolve lista (autoSelectFamily)", async () => {
    const lookup = createSafeLookup(resolveTo(PUBLIC_V4, PUBLIC_V6));
    const r = await call(lookup, "example.com", { all: true });
    expect(r.err).toBeNull();
    expect(r.address).toEqual([PUBLIC_V4, PUBLIC_V6]);
  });

  it("aceita a forma (hostname, callback) sem options", async () => {
    const lookup = createSafeLookup(resolveTo(PUBLIC_V4));
    const r = await new Promise<any>((resolve) =>
      (lookup as any)("example.com", (err: any, address: any, family: number) =>
        resolve({ err, address, family }),
      ),
    );
    expect(r.address).toBe("93.184.216.34");
  });

  it("respeita options.family", async () => {
    const lookup = createSafeLookup(resolveTo(PUBLIC_V4, PUBLIC_V6));
    const r = await call(lookup, "example.com", { family: 6 });
    expect(r.address).toBe(PUBLIC_V6.address);
    expect(r.family).toBe(6);
  });

  it("rejeita se QUALQUER endereco for privado (um A publico e um privado)", async () => {
    const lookup = createSafeLookup(
      resolveTo(PUBLIC_V4, { address: "10.0.0.5", family: 4 }),
    );
    for (const options of [{}, { all: true }]) {
      const r = await call(lookup, "misto.example", options);
      expect(r.err).toBeInstanceOf(SafeFetchError);
      expect(r.err.code).toBe("BLOCKED_ADDRESS");
      expect(r.address).toBeUndefined();
    }
  });

  it("rejeita mesmo se o endereco privado for o que seria filtrado por familia", async () => {
    const lookup = createSafeLookup(
      resolveTo(PUBLIC_V4, { address: "fd00::1", family: 6 }),
    );
    const r = await call(lookup, "misto6.example", { family: 4 });
    expect(r.err?.code).toBe("BLOCKED_ADDRESS");
  });

  it("propaga erro de DNS e trata resposta vazia como ENOTFOUND", async () => {
    const boom = Object.assign(new Error("falha"), { code: "ESERVFAIL" });
    const failing = createSafeLookup(async () => {
      throw boom;
    });
    expect((await call(failing, "x.example", {})).err).toBe(boom);

    const empty = createSafeLookup(resolveTo());
    expect((await call(empty, "vazio.example", {})).err.code).toBe("ENOTFOUND");
  });
});

// ── safeFetchText ───────────────────────────────────────────────────────

describe("safeFetchText", () => {
  const base = (fn: any, extra: object = {}) => ({
    httpRequest: fn,
    httpsRequest: fn,
    resolveAll: resolveTo(PUBLIC_V4),
    ...extra,
  });

  it("caso positivo: URL publica devolve o texto e usa hostname, nao IP", async () => {
    const { fn, calls } = fakeRequest([{ body: "<html>ola</html>" }]);
    const html = await safeFetchText("https://example.com/p?q=1", base(fn));
    expect(html).toBe("<html>ola</html>");
    expect(calls[0]!.options["hostname"]).toBe("example.com");
    expect(calls[0]!.options["path"]).toBe("/p?q=1");
    expect(typeof calls[0]!.options["lookup"]).toBe("function");
  });

  it("IPv6 literal publico: hostname sem colchetes na conexao", async () => {
    const { fn, calls } = fakeRequest([{ body: "ok" }]);
    await safeFetchText("https://[2606:4700:4700::1111]/", base(fn));
    expect(calls[0]!.options["hostname"]).toBe("2606:4700:4700::1111");
  });

  it("descomprime gzip", async () => {
    const { fn } = fakeRequest([
      { headers: { "content-encoding": "gzip" }, body: gzipSync("conteudo gzip") },
    ]);
    expect(await safeFetchText("https://example.com/", base(fn))).toBe("conteudo gzip");
  });

  it("status nao 2xx lanca HTTP <status>: <mensagem>", async () => {
    const { fn } = fakeRequest([{ status: 404, statusMessage: "Not Found" }]);
    await expect(safeFetchText("https://example.com/", base(fn))).rejects.toThrow(
      "HTTP 404: Not Found",
    );
  });

  describe("redirects", () => {
    it("segue redirect relativo e valido", async () => {
      const { fn, calls } = fakeRequest([
        { status: 301, headers: { location: "/novo" } },
        { body: "final" },
      ]);
      expect(await safeFetchText("https://example.com/velho", base(fn))).toBe("final");
      expect(calls[1]!.options["path"]).toBe("/novo");
    });

    for (const target of [
      "http://169.254.169.254/latest/meta-data/",
      "http://[::1]/",
      "http://127.0.0.1:8080/",
      "http://[::ffff:127.0.0.1]/",
    ]) {
      it(`bloqueia redirect de URL publica para ${target}`, async () => {
        const { fn, calls } = fakeRequest([
          { status: 302, headers: { location: target } },
          { body: "segredo" },
        ]);
        await expect(
          safeFetchText("https://example.com/", base(fn)),
        ).rejects.toMatchObject({ code: "BLOCKED_ADDRESS" });
        expect(calls).toHaveLength(1); // nunca conectou ao destino interno
      });
    }

    it("bloqueia redirect para protocolo nao http(s)", async () => {
      const { fn } = fakeRequest([
        { status: 302, headers: { location: "file:///etc/passwd" } },
      ]);
      await expect(
        safeFetchText("https://example.com/", base(fn)),
      ).rejects.toMatchObject({ code: "BAD_PROTOCOL" });
    });

    it("permite exatamente 3 redirects e rejeita o 4o", async () => {
      const hop = (n: number): FakeResponse => ({
        status: 302,
        headers: { location: `/r${n}` },
      });
      const ok = fakeRequest([hop(1), hop(2), hop(3), { body: "chegou" }]);
      expect(await safeFetchText("https://example.com/", base(ok.fn))).toBe("chegou");

      const excess = fakeRequest([hop(1), hop(2), hop(3), hop(4), { body: "x" }]);
      await expect(
        safeFetchText("https://example.com/", base(excess.fn)),
      ).rejects.toMatchObject({ code: "REDIRECT_LIMIT" });
      expect(excess.calls).toHaveLength(4);
    });

    it("redirect sem Location e erro", async () => {
      const { fn } = fakeRequest([{ status: 302 }]);
      await expect(
        safeFetchText("https://example.com/", base(fn)),
      ).rejects.toMatchObject({ code: "BAD_REDIRECT" });
    });
  });

  describe("limite de tamanho", () => {
    it("aborta por content-length acima do limite", async () => {
      const { fn } = fakeRequest([
        { headers: { "content-length": "2000" }, body: "pequeno" },
      ]);
      await expect(
        safeFetchText("https://example.com/", base(fn, { maxBytes: 1000 })),
      ).rejects.toMatchObject({ code: "BODY_TOO_LARGE" });
    });

    it("aborta por stream sem content-length e destroi a resposta", async () => {
      let destroyed = false;
      const body = new Readable({
        read() {
          this.push(Buffer.alloc(400, 97));
        },
        destroy(err, cb) {
          destroyed = true;
          cb(err);
        },
      });
      const { fn } = fakeRequest([{ body }]);
      await expect(
        safeFetchText("https://example.com/", base(fn, { maxBytes: 1000 })),
      ).rejects.toMatchObject({ code: "BODY_TOO_LARGE" });
      expect(destroyed).toBe(true);
    });

    it("limita o tamanho DESCOMPRIMIDO (gzip bomb)", async () => {
      const bomb = gzipSync(Buffer.alloc(100_000, 97)); // poucos bytes comprimidos
      expect(bomb.length).toBeLessThan(1000);
      const { fn } = fakeRequest([
        { headers: { "content-encoding": "gzip" }, body: bomb },
      ]);
      await expect(
        safeFetchText("https://example.com/", base(fn, { maxBytes: 10_000 })),
      ).rejects.toMatchObject({ code: "BODY_TOO_LARGE" });
    });

    it("aceita corpo exatamente no limite", async () => {
      const { fn } = fakeRequest([{ body: "a".repeat(1000) }]);
      const html = await safeFetchText(
        "https://example.com/",
        base(fn, { maxBytes: 1000 }),
      );
      expect(html).toHaveLength(1000);
    });
  });

  describe("timeout cobre a leitura do corpo", () => {
    it("estoura durante a leitura e destroi a resposta", async () => {
      vi.useFakeTimers();
      let destroyed = false;
      const body = new Readable({
        read() {
          /* nunca envia: corpo pendente */
        },
        destroy(err, cb) {
          destroyed = true;
          cb(err);
        },
      });
      const { fn } = fakeRequest([{ body }]);
      const promise = safeFetchText(
        "https://example.com/",
        base(fn, { timeoutMs: 5000 }),
      );
      const assertion = expect(promise).rejects.toMatchObject({ code: "TIMEOUT" });
      await vi.advanceTimersByTimeAsync(5001);
      await assertion;
      expect(destroyed).toBe(true);
    });

    it("estoura antes dos headers (request pendente)", async () => {
      vi.useFakeTimers();
      const calls: { destroyed: boolean }[] = [];
      const hanging = () => {
        const rec = { destroyed: false };
        calls.push(rec);
        const req = new EventEmitter() as any;
        req.end = () => undefined;
        req.destroy = () => {
          rec.destroyed = true;
        };
        return req;
      };
      const promise = safeFetchText("https://example.com/", {
        httpsRequest: hanging as any,
        resolveAll: resolveTo(PUBLIC_V4),
        timeoutMs: 3000,
      });
      const assertion = expect(promise).rejects.toMatchObject({ code: "TIMEOUT" });
      await vi.advanceTimersByTimeAsync(3001);
      await assertion;
      expect(calls[0]!.destroyed).toBe(true);
    });
  });

  it("URL invalida e protocolo invalido sao rejeitados sem conexao", async () => {
    await expect(safeFetchText("nao e url")).rejects.toMatchObject({ code: "BAD_URL" });
    await expect(safeFetchText("file:///etc/passwd")).rejects.toMatchObject({
      code: "BAD_PROTOCOL",
    });
  });
});
