import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * O HTML de entrada não carrega scripts de terceiros. O analytics herdado do
 * template (Umami em `analytics.manus.im`) foi removido: o app não o usava e
 * cada visita fazia o navegador do visitante buscar um script externo.
 * Adicionar um script externo exige decisão explícita e atualização da
 * política de privacidade.
 */
const html = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "..", "..", "client", "index.html"),
  "utf8",
);

describe("client/index.html", () => {
  it("não referencia o analytics herdado do template", () => {
    expect(html).not.toMatch(/umami|VITE_ANALYTICS|analytics\.manus/i);
  });

  it("só carrega scripts locais", () => {
    const srcs = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/gi)].map((m) => m[1]);
    expect(srcs.length).toBeGreaterThan(0);
    for (const src of srcs) expect(src, src).toMatch(/^\/(?!\/)/);
  });
});
