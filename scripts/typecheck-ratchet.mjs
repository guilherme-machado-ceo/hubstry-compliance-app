// Trava de type-check: falha se surgir erro de TypeScript NOVO em relação à
// linha de base (scripts/typecheck-baseline.json). Erros já existentes são
// tolerados e listados; corrigir um deles exige baixar a linha de base com
// `node scripts/typecheck-ratchet.mjs --update`.
//
// A comparação é por arquivo + código do erro (sem número de linha), para não
// quebrar quando uma linha muda de lugar.
//
// Roda só no CI ou na sessão remota (CLAUDE.md, execução exclusivamente remota).
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const BASELINE = new URL("./typecheck-baseline.json", import.meta.url);
const PROJECTS = ["tsconfig.json", "tsconfig.server.json"];

function collect(project) {
  let out = "";
  try {
    out = execFileSync("pnpm", ["exec", "tsc", "-p", project, "--noEmit"], { encoding: "utf8" });
  } catch (error) {
    out = `${error.stdout ?? ""}${error.stderr ?? ""}`;
  }
  const counts = {};
  for (const m of out.matchAll(/^(.+?)\(\d+,\d+\): error (TS\d+):/gm)) {
    const key = `${m[1]} ${m[2]}`;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

const current = Object.fromEntries(PROJECTS.map((p) => [p, collect(p)]));
const total = (c) => Object.values(c).reduce((a, b) => a + b, 0);

if (process.argv.includes("--update")) {
  writeFileSync(BASELINE, `${JSON.stringify(current, null, 2)}\n`);
  for (const p of PROJECTS) console.log(`${p}: ${total(current[p])} erros gravados na linha de base`);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(BASELINE, "utf8"));
let novos = 0;
for (const p of PROJECTS) {
  const base = baseline[p] ?? {};
  const cur = current[p];
  console.log(`${p}: ${total(cur)} erros (linha de base: ${total(base)})`);
  for (const [key, n] of Object.entries(cur)) {
    const extra = n - (base[key] ?? 0);
    if (extra > 0) {
      novos += extra;
      console.error(`  NOVO: ${key} (+${extra})`);
    }
  }
  for (const [key, n] of Object.entries(base)) {
    if ((cur[key] ?? 0) < n) console.log(`  corrigido: ${key} (-${n - (cur[key] ?? 0)}); atualize a linha de base`);
  }
}
if (novos > 0) {
  console.error(`\n${novos} erro(s) de TypeScript novo(s) em relação à linha de base.`);
  process.exit(1);
}
console.log("\nNenhum erro de TypeScript novo.");
