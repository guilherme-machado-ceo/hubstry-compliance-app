import { describe, it, expect } from "vitest";
import { scanHtmlForViolations, type ViolationDetail } from "./scanner.js";

/**
 * Linguagem dos achados heurísticos (ADR-0005).
 *
 * Cada caso usa um HTML que ACIONA a regra (o teste falha se a regra não
 * disparar) e verifica que o texto do achado:
 * - não afirma violação legal nem exigência legal;
 * - explicita que a análise é do HTML inicial e pode ser falso positivo;
 * - não recomenda Datavalid ou biometria;
 * - não usa severidade `critical`.
 *
 * O score esperado foi medido na `main` antes da mudança de texto: a correção
 * de linguagem não pode alterar a detecção nem o score.
 */

const FOOTER_PRIVACIDADE = `<footer><a href="/privacidade">Politica de privacidade</a></footer>`;

const page = (body: string, head = "") =>
  `<html lang="pt-BR"><head>${head}</head><body>${body}</body></html>`;

const textOf = (v: ViolationDetail) => `${v.title} ${v.description} ${v.recommendation}`;

const AFIRMACAO_LEGAL =
  /violando|viola a lgpd|viola o eca|isso viola|exigid[oa] pel[oa]|conforme exigido|em desacordo com a lei|ilegal/i;
const SOLUCAO_PROIBIDA = /datavalid|biometri|serpro|gov\.br/i;

function expectLinguagemHeuristica(v: ViolationDetail) {
  const texto = textOf(v);
  expect(v.severity, v.title).not.toBe("critical");
  expect(texto, v.title).not.toMatch(AFIRMACAO_LEGAL);
  expect(texto, v.title).not.toMatch(SOLUCAO_PROIBIDA);
  expect(v.description, v.title).toMatch(/HTML inicial/i);
  expect(v.description, v.title).toMatch(/falso positivo/i);
}

interface Caso {
  regra: string;
  html: string;
  match: (v: ViolationDetail) => boolean;
  severidade: ViolationDetail["severity"];
  score: number;
}

const CASOS: Caso[] = [
  {
    regra: "afericao de idade (publico infantojuvenil)",
    html: page(`<h1>Jogo infantil</h1><p>Divirta-se.</p>${FOOTER_PRIVACIDADE}`),
    match: (v) => v.type === "age_verification",
    severidade: "info",
    score: 85,
  },
  {
    regra: "consentimento",
    // "dados" satisfaz a regra de politica de privacidade, mas nao a de
    // consentimento: isola o achado de consentimento.
    html: page(`<h1>Loja Exemplo</h1><footer><a href="/dados">Uso de dados</a></footer>`),
    match: (v) => /consentimento/i.test(v.title),
    severidade: "warning",
    score: 95,
  },
  {
    regra: "loot box (caixa + comprar)",
    html: page(`<h1>Abra a caixa misteriosa</h1><button>Comprar agora</button>${FOOTER_PRIVACIDADE}`),
    match: (v) => v.type === "lootbox",
    severidade: "warning",
    score: 90,
  },
  {
    regra: "loot box (gacha + buy)",
    html: page(`<h1>Gacha pull</h1><a href="/shop">Buy gems</a>${FOOTER_PRIVACIDADE}`),
    match: (v) => v.type === "lootbox",
    severidade: "warning",
    score: 90,
  },
  {
    regra: "politica de privacidade",
    // "termos" satisfaz a regra de consentimento: isola o achado de privacidade.
    html: page(`<h1>Loja Exemplo</h1><footer><a href="/termos">Termos de uso</a></footer>`),
    match: (v) => v.type === "missing_privacy_policy",
    severidade: "warning",
    score: 90,
  },
  {
    regra: "misdirection",
    html: page(
      `<button style="opacity:0.4">Recusar</button><button>Aceitar</button>${FOOTER_PRIVACIDADE}`,
    ),
    match: (v) => v.type === "dark_pattern" && /misdirection/i.test(v.title),
    severidade: "warning",
    score: 80,
  },
  {
    regra: "roach motel",
    html: page(`<form><input name="email"><button type="submit">Assinar</button></form>${FOOTER_PRIVACIDADE}`),
    match: (v) => v.type === "dark_pattern" && /roach motel/i.test(v.title),
    severidade: "warning",
    score: 80,
  },
  {
    regra: "rolagem infinita",
    html: page(`<div class="infinite-feed">Conteudo</div>${FOOTER_PRIVACIDADE}`),
    match: (v) => v.type === "infinite_scroll",
    severidade: "warning",
    score: 90,
  },
  {
    regra: "rastreadores de anuncios",
    html: page(
      FOOTER_PRIVACIDADE,
      `<script src="https://www.googleadservices.com/pagead/conversion.js"></script>`,
    ),
    match: (v) => v.type === "ad_tracker",
    severidade: "warning",
    score: 85,
  },
];

describe("Scanner — linguagem dos achados heurísticos (ADR-0005)", () => {
  for (const caso of CASOS) {
    describe(caso.regra, () => {
      it("aciona a regra com a severidade acordada", async () => {
        const { violations } = await scanHtmlForViolations(caso.html);
        const achados = violations.filter(caso.match);
        expect(achados.length, "a regra deveria disparar").toBeGreaterThan(0);
        for (const v of achados) expect(v.severity).toBe(caso.severidade);
      });

      it("não afirma violação, explicita limitações e não recomenda Datavalid/biometria", async () => {
        const { violations } = await scanHtmlForViolations(caso.html);
        const achados = violations.filter(caso.match);
        expect(achados.length, "a regra deveria disparar").toBeGreaterThan(0);
        achados.forEach(expectLinguagemHeuristica);
      });

      it("mantém o score medido antes da mudança de texto", async () => {
        const { complianceScore } = await scanHtmlForViolations(caso.html);
        expect(complianceScore).toBe(caso.score);
      });
    });
  }

  it("idade: recomendação não indica método nem fornecedor de aferição", async () => {
    const { violations } = await scanHtmlForViolations(CASOS[0].html);
    const idade = violations.find((v) => v.type === "age_verification");
    expect(idade).toBeDefined();
    expect(idade!.recommendation).not.toMatch(SOLUCAO_PROIBIDA);
    expect(idade!.recommendation).not.toMatch(/reconhecimento facial|documento oficial/i);
  });

  it("consentimento: não presume que consentimento seja a única base legal", async () => {
    const { violations } = await scanHtmlForViolations(CASOS[1].html);
    const consentimento = violations.find((v) => /consentimento/i.test(v.title));
    expect(consentimento).toBeDefined();
    expect(consentimento!.description).toMatch(/base legal/i);
  });

  it("página que aciona todas as regras heurísticas não gera nenhum achado critical", async () => {
    const html = `<html><head>
      <script src="https://www.googleadservices.com/pagead/conversion.js"></script>
    </head><body>
      <h1>Jogo infantil: abra a caixa e ganhe premio</h1>
      <button>Comprar</button>
      <button style="opacity:0.3">Nao, obrigado</button>
      <form><button type="submit">Enviar</button></form>
      <div class="infinite-list">Itens</div>
      <video autoplay src="v.mp4"></video>
      <img src="a.png">
    </body></html>`;
    const result = await scanHtmlForViolations(html);
    const tipos = new Set(result.violations.map((v) => v.type));
    for (const t of [
      "age_verification",
      "lootbox",
      "dark_pattern",
      "infinite_scroll",
      "ad_tracker",
      "missing_privacy_policy",
      "autoplay",
      "other",
    ]) {
      expect(tipos.has(t), t).toBe(true);
    }
    expect(result.violations.some((v) => /consentimento/i.test(v.title))).toBe(true);
    expect(result.summary.critical).toBe(0);
    for (const v of result.violations) {
      expect(textOf(v), v.title).not.toMatch(AFIRMACAO_LEGAL);
      expect(textOf(v), v.title).not.toMatch(SOLUCAO_PROIBIDA);
    }
    // Todos os pilares acionados: score 0, igual ao da versão anterior.
    expect(result.complianceScore).toBe(0);
  });
});
