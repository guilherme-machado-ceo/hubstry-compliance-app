/**
 * Busca HTTP(S) com validacao de destino (mitigacao de SSRF) para o scanner.
 *
 * Garantias:
 *  - IPs literais sao classificados antes de qualquer conexao (o Node nao
 *    chama `lookup` para IP literal);
 *  - nomes sao resolvidos por um `lookup` proprio que valida TODOS os A/AAAA e
 *    so entrega ao socket enderecos ja validados (sem janela de DNS rebinding
 *    entre validacao e conexao). A URL mantem o hostname, entao Host, SNI e a
 *    validacao do certificado TLS continuam usando o nome original;
 *  - redirects sao manuais (maximo 3) e cada Location e revalidado;
 *  - um unico prazo cobre ate o fim da leitura do corpo, e o corpo
 *    (descomprimido) tem limite de tamanho.
 *
 * Sem dependencias novas: apenas modulos nativos do Node.
 */

import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { pipeline, type Readable, type Transform } from "node:stream";
import zlib from "node:zlib";

// ── Classificacao de enderecos ─────────────────────────────────────────

/**
 * Fonte: IANA IPv4 Special-Purpose Address Registry e IANA IPv6 Special-Purpose
 * Address Registry (ambos "last updated" 2025-10-09), consultados em
 * 2026-10-18. Multicast: IANA IPv4/IPv6 Multicast Address Space (RFC 5771,
 * RFC 4291), que nao constam dos registros special-purpose.
 *
 * Politica conservadora (fail-closed): bloqueia todo bloco que o registro marca
 * como nao globalmente alcancavel e tambem blocos com excecoes "globally
 * reachable" que embutem ou traduzem IPv4 (NAT64, 6to4, Teredo) ou que cobrem
 * anycast de protocolo (192.0.0.0/24, 2001::/23).
 */
const BLOCKED_IPV4: ReadonlyArray<readonly [string, number]> = [
  ["0.0.0.0", 8], //          "This network" (inclui 0.0.0.0/32)
  ["10.0.0.0", 8], //         Private-Use
  ["100.64.0.0", 10], //      Shared Address Space (CGNAT)
  ["127.0.0.0", 8], //        Loopback
  ["169.254.0.0", 16], //     Link Local
  ["172.16.0.0", 12], //      Private-Use
  ["192.0.0.0", 24], //       IETF Protocol Assignments
  ["192.0.2.0", 24], //       Documentation (TEST-NET-1)
  ["192.88.99.0", 24], //     Deprecated (6to4 Relay Anycast)
  ["192.168.0.0", 16], //     Private-Use
  ["198.18.0.0", 15], //      Benchmarking
  ["198.51.100.0", 24], //    Documentation (TEST-NET-2)
  ["203.0.113.0", 24], //     Documentation (TEST-NET-3)
  ["224.0.0.0", 4], //        Multicast
  ["240.0.0.0", 4], //        Reserved (inclui 255.255.255.255 Limited Broadcast)
];

const BLOCKED_IPV6: ReadonlyArray<readonly [string, number]> = [
  ["::", 128], //             Unspecified
  ["::1", 128], //            Loopback
  ["::ffff:0:0", 96], //      IPv4-mapped
  ["64:ff9b::", 96], //       NAT64 (IPv4-IPv6 Translat.)
  ["64:ff9b:1::", 48], //     NAT64 local-use
  ["100::", 64], //           Discard-Only
  ["100:0:0:1::", 64], //     Dummy IPv6 Prefix
  ["2001::", 23], //          IETF Protocol Assignments (inclui Teredo 2001::/32)
  ["2001:db8::", 32], //      Documentation
  ["2002::", 16], //          6to4
  ["3fff::", 20], //          Documentation
  ["5f00::", 16], //          Segment Routing (SRv6) SIDs
  ["fc00::", 7], //           Unique-Local (ULA)
  ["fe80::", 10], //          Link-Local Unicast
  ["ff00::", 8], //           Multicast
];

/**
 * Unicast IPv6 so e considerado publico dentro de 2000::/3 (Global Unicast).
 * Tudo fora disso (inclusive blocos nao alocados) e rejeitado.
 */
const GLOBAL_UNICAST_IPV6: readonly [string, number] = ["2000::", 3];

function buildBlockList(
  entries: ReadonlyArray<readonly [string, number]>,
  family: "ipv4" | "ipv6",
): net.BlockList {
  const list = new net.BlockList();
  for (const [network, prefix] of entries) {
    list.addSubnet(network, prefix, family);
  }
  return list;
}

const blockedV4 = buildBlockList(BLOCKED_IPV4, "ipv4");
const blockedV6 = buildBlockList(BLOCKED_IPV6, "ipv6");
const globalV6 = buildBlockList([GLOBAL_UNICAST_IPV6], "ipv6");

/** Remove colchetes de IPv6 (`[::1]` -> `::1`). */
export function stripBrackets(host: string): string {
  return host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host;
}

/**
 * Retorna true somente se `address` for um IP literal publico.
 * Qualquer entrada que nao seja IP valido retorna false (fail-closed).
 */
export function isPublicIp(address: string): boolean {
  try {
    const raw = stripBrackets(address.trim().toLowerCase());
    // Zone id (fe80::1%eth0) nunca e destino publico valido.
    if (raw.includes("%")) return false;

    const family = net.isIP(raw);
    if (family === 4) return !blockedV4.check(raw, "ipv4");
    if (family === 6) {
      if (!globalV6.check(raw, "ipv6")) return false;
      return !blockedV6.check(raw, "ipv6");
    }
    return false;
  } catch {
    return false;
  }
}

// ── Erros ───────────────────────────────────────────────────────────────

export type SafeFetchErrorCode =
  | "BAD_URL"
  | "BAD_PROTOCOL"
  | "BLOCKED_PORT"
  | "BLOCKED_ADDRESS"
  | "REDIRECT_LIMIT"
  | "BAD_REDIRECT"
  | "BODY_TOO_LARGE"
  | "TIMEOUT"
  | "UNSUPPORTED_ENCODING"
  | "HTTP_ERROR";

export class SafeFetchError extends Error {
  readonly code: SafeFetchErrorCode;
  constructor(code: SafeFetchErrorCode, message: string) {
    super(message);
    this.name = "SafeFetchError";
    this.code = code;
  }
}

const blockedError = () =>
  new SafeFetchError(
    "BLOCKED_ADDRESS",
    "URL aponta para endereco nao permitido",
  );

// ── Lookup seguro ───────────────────────────────────────────────────────

export interface ResolvedAddress {
  address: string;
  family: number;
}

export type ResolveAll = (hostname: string) => Promise<ResolvedAddress[]>;

const defaultResolveAll: ResolveAll = (hostname) =>
  dns.promises.lookup(hostname, { all: true, verbatim: true });

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address?: string | ResolvedAddress[],
  family?: number,
) => void;

type LookupOptions = { all?: boolean; family?: number | string } | number;

function wantedFamily(family: number | string | undefined): 0 | 4 | 6 {
  if (family === 4 || family === "IPv4") return 4;
  if (family === 6 || family === "IPv6") return 6;
  return 0;
}

function notFound(hostname: string): NodeJS.ErrnoException {
  const err = new Error(`getaddrinfo ENOTFOUND ${hostname}`) as NodeJS.ErrnoException;
  err.code = "ENOTFOUND";
  return err;
}

/**
 * Cria a funcao `lookup` usada em `http(s).request`.
 * Rejeita se QUALQUER endereco resolvido nao for publico e so devolve
 * enderecos validados. Trata as duas assinaturas do Node: `all: true`
 * (autoSelectFamily, Node 20+) e endereco unico.
 */
export function createSafeLookup(resolveAll: ResolveAll = defaultResolveAll) {
  return function safeLookup(
    hostname: string,
    optionsOrCallback: LookupOptions | LookupCallback,
    maybeCallback?: LookupCallback,
  ): void {
    const callback =
      typeof optionsOrCallback === "function" ? optionsOrCallback : maybeCallback;
    const options: { all?: boolean; family?: number | string } =
      typeof optionsOrCallback === "function"
        ? {}
        : typeof optionsOrCallback === "number"
          ? { family: optionsOrCallback }
          : optionsOrCallback;
    if (!callback) return;

    resolveAll(hostname).then(
      (addresses) => {
        if (addresses.length === 0) return callback(notFound(hostname));

        // Valida TODOS (antes de filtrar por familia).
        if (!addresses.every((a) => isPublicIp(a.address))) {
          return callback(blockedError() as unknown as NodeJS.ErrnoException);
        }

        const family = wantedFamily(options.family);
        const usable = family
          ? addresses.filter((a) => a.family === family)
          : addresses;
        if (usable.length === 0) return callback(notFound(hostname));

        if (options.all) {
          return callback(null, usable.map((a) => ({ ...a })));
        }
        const first = usable[0] as ResolvedAddress;
        return callback(null, first.address, first.family);
      },
      (err: NodeJS.ErrnoException) => callback(err),
    );
  };
}

// ── Validacao de URL ────────────────────────────────────────────────────

/** Unicas portas de destino permitidas (porta efetiva, apos aplicar o padrao do protocolo). */
const ALLOWED_PORTS: ReadonlySet<number> = new Set([80, 443]);

/**
 * Valida protocolo, porta efetiva e, para IP literal, o endereco. Para nomes, a validacao
 * acontece no `lookup` no momento da conexao.
 */
export function assertPublicTarget(url: URL): void {
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new SafeFetchError(
      "BAD_PROTOCOL",
      "Protocolo nao permitido. Use http:// ou https://",
    );
  }
  // WHATWG URL deixa `port` vazio quando e o padrao do protocolo (http:80, https:443).
  const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80;
  if (!ALLOWED_PORTS.has(port)) {
    throw new SafeFetchError(
      "BLOCKED_PORT",
      "Porta de destino nao permitida. Use as portas 80 ou 443",
    );
  }
  const host = stripBrackets(url.hostname);
  if (!host) throw new SafeFetchError("BAD_URL", "URL invalida");
  if (net.isIP(host) !== 0 && !isPublicIp(host)) throw blockedError();
}

// ── Busca ───────────────────────────────────────────────────────────────

type RequestFn = (
  options: https.RequestOptions,
  callback: (res: http.IncomingMessage) => void,
) => http.ClientRequest;

export interface SafeFetchOptions {
  maxRedirects?: number;
  maxBytes?: number;
  timeoutMs?: number;
  headers?: Record<string, string>;
  /** Injecao para testes (sem rede). */
  resolveAll?: ResolveAll;
  httpRequest?: RequestFn;
  httpsRequest?: RequestFn;
}

export const DEFAULT_MAX_REDIRECTS = 3;
export const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
export const DEFAULT_TIMEOUT_MS = 10_000;

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function requestOnce(
  url: URL,
  signal: AbortSignal,
  opts: Required<Pick<SafeFetchOptions, "headers">> &
    Pick<SafeFetchOptions, "resolveAll" | "httpRequest" | "httpsRequest">,
): Promise<http.IncomingMessage> {
  return new Promise((resolve, reject) => {
    const isHttps = url.protocol === "https:";
    const requestFn: RequestFn =
      (isHttps ? opts.httpsRequest : opts.httpRequest) ??
      ((isHttps ? https.request : http.request) as RequestFn);

    const req = requestFn(
      {
        protocol: url.protocol,
        hostname: stripBrackets(url.hostname),
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method: "GET",
        headers: opts.headers,
        agent: false,
        lookup: createSafeLookup(opts.resolveAll) as unknown as net.LookupFunction,
      },
      (res) => {
        signal.removeEventListener("abort", onAbort);
        resolve(res);
      },
    );

    const onAbort = () => {
      req.destroy();
      reject(signal.reason);
    };
    if (signal.aborted) return onAbort();
    signal.addEventListener("abort", onAbort, { once: true });

    req.on("error", (err) => {
      signal.removeEventListener("abort", onAbort);
      reject(err);
    });
    req.end();
  });
}

function decoderFor(encoding: string | undefined): Transform | null {
  const e = (encoding ?? "").trim().toLowerCase();
  if (e === "" || e === "identity") return null;
  if (e === "gzip" || e === "x-gzip") return zlib.createGunzip();
  if (e === "deflate") return zlib.createInflate();
  if (e === "br") return zlib.createBrotliDecompress();
  throw new SafeFetchError(
    "UNSUPPORTED_ENCODING",
    "Codificacao de resposta nao suportada",
  );
}

async function readBody(
  res: http.IncomingMessage,
  maxBytes: number,
  signal: AbortSignal,
): Promise<string> {
  const declared = Number(res.headers["content-length"]);
  if (Number.isFinite(declared) && declared > maxBytes) {
    res.destroy();
    throw tooLarge();
  }

  const encoding = res.headers["content-encoding"];
  const decoder = decoderFor(Array.isArray(encoding) ? encoding[0] : encoding);
  const stream: Readable = decoder ?? res;
  if (decoder) pipeline(res, decoder, () => undefined);

  const destroyAll = (reason?: Error) => {
    res.destroy(reason);
    decoder?.destroy(reason);
  };
  const onAbort = () => destroyAll(signal.reason);
  if (signal.aborted) onAbort();
  signal.addEventListener("abort", onAbort, { once: true });

  const chunks: Buffer[] = [];
  let total = 0;
  try {
    for await (const chunk of stream) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string);
      total += buf.length;
      if (total > maxBytes) {
        destroyAll();
        throw tooLarge();
      }
      chunks.push(buf);
    }
  } catch (err) {
    // Se o prazo estourou, o erro original (TIMEOUT) tem prioridade.
    if (signal.aborted) throw signal.reason;
    throw err;
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
  if (signal.aborted) throw signal.reason;
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
}

const tooLarge = () =>
  new SafeFetchError("BODY_TOO_LARGE", "Resposta excede o tamanho maximo permitido");

/**
 * Busca `rawUrl` e devolve o corpo como texto UTF-8.
 * Lanca `SafeFetchError` para violacoes de politica.
 */
export async function safeFetchText(
  rawUrl: string,
  options: SafeFetchOptions = {},
): Promise<string> {
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let current: URL;
  try {
    current = new URL(rawUrl);
  } catch {
    throw new SafeFetchError("BAD_URL", "URL invalida");
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () =>
      controller.abort(
        new SafeFetchError("TIMEOUT", "Tempo limite excedido ao buscar a pagina"),
      ),
    timeoutMs,
  );

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Accept-Encoding": "gzip, deflate, br",
    ...options.headers,
  };

  try {
    for (let hop = 0; ; hop++) {
      assertPublicTarget(current);
      const res = await requestOnce(current, controller.signal, {
        headers,
        resolveAll: options.resolveAll,
        httpRequest: options.httpRequest,
        httpsRequest: options.httpsRequest,
      });

      const status = res.statusCode ?? 0;
      if (REDIRECT_STATUSES.has(status)) {
        res.destroy(); // descarta o corpo do salto
        if (hop >= maxRedirects) {
          throw new SafeFetchError(
            "REDIRECT_LIMIT",
            "Redirecionamentos em excesso",
          );
        }
        const location = res.headers["location"];
        if (!location) {
          throw new SafeFetchError("BAD_REDIRECT", "Redirecionamento invalido");
        }
        try {
          current = new URL(location, current);
        } catch {
          throw new SafeFetchError("BAD_REDIRECT", "Redirecionamento invalido");
        }
        continue;
      }

      if (status < 200 || status > 299) {
        res.destroy();
        throw new SafeFetchError(
          "HTTP_ERROR",
          `HTTP ${status}: ${res.statusMessage ?? ""}`.trim(),
        );
      }

      return await readBody(res, maxBytes, controller.signal);
    }
  } finally {
    clearTimeout(timer);
  }
}
