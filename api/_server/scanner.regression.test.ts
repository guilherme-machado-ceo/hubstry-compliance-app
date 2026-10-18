import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, it, expect } from "vitest";
import { scanHtmlForViolations } from "./scanner.js";
import { findingsOf, type FindingCategory } from "./__fixtures__/scanner/matchers.js";

/**
 * Regressão de falsos positivos do scanner.
 *
 * Estes testes afirmam apenas que certos achados NÃO devem aparecer para
 * entradas que, comprovadamente, não os justificam. Eles não definem
 * severidades, exigências de consentimento nem critérios de acesso provável
 * por crianças (ver manifest.json).
 *
 * Casos marcados com `it.fails` documentam defeitos CONHECIDOS da versão
 * atual: o teste "passa" enquanto o defeito existir. Quando a correção for
 * implementada, o Vitest acusará o caso, e ele deve virar `it` normal.
 */

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "__fixtures__", "scanner");

interface FixtureEntry {
  arquivo: string;
  nao_deve_gerar: FindingCategory[];
  motivo: string;
}
const manifest = JSON.parse(readFileSync(join(FIXTURES, "manifest.json"), "utf8")) as {
  fixtures: FixtureEntry[];
};

const load = (file: string) => readFileSync(join(FIXTURES, file), "utf8");

async function expectNoFinding(file: string, category: FindingCategory) {
  const { violations } = await scanHtmlForViolations(load(file));
  const found = findingsOf(violations, category);
  expect(found, `${file} não deveria gerar "${category}"`).toEqual([]);
}

/** Defeitos conhecidos na implementação atual (fixture + categoria). */
const KNOWN_DEFECTS = new Set([
  "idade-fourteen.html:publico_infantojuvenil",
  "idade-kidney.html:publico_infantojuvenil",
  "idade-script-gamemode.html:publico_infantojuvenil",
  "form-busca.html:roach_motel",
  "sem-rastreadores-en.html:ausencia_banner_consentimento",
  "portal-enciclopedia-sintetico.html:publico_infantojuvenil",
  "portal-enciclopedia-sintetico.html:roach_motel",
  "portal-enciclopedia-sintetico.html:ausencia_banner_consentimento",
]);

describe("Scanner — regressão de falsos positivos", () => {
  it("manifest lista apenas fixtures existentes", () => {
    for (const f of manifest.fixtures) {
      expect(() => load(f.arquivo), f.arquivo).not.toThrow();
    }
  });

  for (const fixture of manifest.fixtures) {
    for (const category of fixture.nao_deve_gerar) {
      const key = `${fixture.arquivo}:${category}`;
      const title = `${fixture.arquivo} não gera "${category}" (${fixture.motivo})`;
      if (KNOWN_DEFECTS.has(key)) {
        it.fails(`[defeito conhecido] ${title}`, () => expectNoFinding(fixture.arquivo, category));
      } else {
        it(title, () => expectNoFinding(fixture.arquivo, category));
      }
    }
  }
});
