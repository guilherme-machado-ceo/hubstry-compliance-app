import { describe, it, expect } from "vitest";
import {
  LIMITACAO_HEURISTICA,
  scanHtmlForViolations,
  type ViolationDetail,
} from "./scanner.js";

/**
 * Linguagem dos achados heurísticos (ADR-0005).
 *
 * Cada caso usa um HTML que ACIONA a regra (o teste falha se a regra não
 * disparar) e verifica que o texto do achado:
 * - não afirma violação legal nem exigência legal;
 * - traz, uma única vez, a ressalva de análise heurística do HTML inicial;
 * - não recomenda Datavalid, Serpro, Gov.br ou biometria;
 * - não usa severidade `critical`;
 * - não contém palavras comuns sem acento.
 *
 * O score esperado foi medido na `main` (6ac3136) antes da mudança de texto.
 * Este PR não altera detecção nem score; manter o score atual é restrição de
 * escopo e NÃO implementa a regra do ADR-0005 de que indícios não reduzem o
 * score (fica para PR próprio).
 */

const FOOTER_PRIVACIDADE = `<footer><a href="/privacidade">Politica de privacidade</a></footer>`;

const page = (body: string, head = "") =>
  `<html lang="pt-BR"><head>${head}</head><body>${body}</body></html>`;

const textOf = (v: ViolationDetail) => `${v.title} ${v.description} ${v.recommendation}`;

const AFIRMACAO_LEGAL =
  /violando|viola a lgpd|viola o eca|isso viola|exigid[oa] pel[oa]|conforme exigido|em desacordo com a lei|ilegal/i;
const SOLUCAO_PROIBIDA = /datavalid|biometri|serpro|gov\.br/i;

// Palavras frequentes nos textos que, sem acento, indicam texto não revisado.
// Limites com \p{L} (e não \b) para "pagina" não casar dentro de "paginação".
const SEM_ACENTO =
  /(?<!\p{L})(nao|possivel|analise|heuristica|pagina|paginas|politica|publico|criancas|opcoes|opcao|botao|servico|servicos|referencia|afericao|ha|sao)(?!\p{L})/iu;

const ocorrencias = (texto: string, trecho: string) => texto.split(trecho).length - 1;

function expectLinguagemHeuristica(v: ViolationDetail) {
  const texto = textOf(v);
  expect(v.severity, v.title).not.toBe("critical");
  expect(texto, v.title).not.toMatch(AFIRMACAO_LEGAL);
  expect(texto, v.title).not.toMatch(SOLUCAO_PROIBIDA);
  expect(ocorrencias(v.description, LIMITACAO_HEURISTICA), v.title).toBe(1);
  expect(v.description, v.title).toMatch(/HTML inicial/);
  expect(v.description, v.title).toMatch(/não executa JavaScript/);
  expect(v.description, v.title).toMatch(/outras páginas/);
  expect(v.description, v.title).toMatch(/falso positivo/);
  expect(v.description, v.title).toMatch(/não comprova violação legal/);
  // O texto entre aspas simples cita termos literais da regra (ex.: 'nao').
  expect(texto.replace(/'[^']*'/g, ""), v.title).not.toMatch(SEM_ACENTO);
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
    // ADR-0005: "assinatura" é info.
    severidade: "info",
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
  {
    regra: "autoplay",
    html: page(`<video autoplay src="v.mp4"></video>${FOOTER_PRIVACIDADE}`),
    match: (v) => v.type === "autoplay",
    severidade: "warning",
    score: 85,
  },
  {
    regra: "acessibilidade: imagem sem alt",
    html: page(`<img src="a.png">${FOOTER_PRIVACIDADE}`),
    match: (v) => v.type === "other" && /texto alternativo/i.test(v.title),
    severidade: "info",
    score: 95,
  },
  {
    regra: "acessibilidade: idioma não declarado",
    html: `<html><body><h1>Loja Exemplo</h1>${FOOTER_PRIVACIDADE}</body></html>`,
    match: (v) => v.type === "other" && /idioma/i.test(v.title),
    severidade: "info",
    score: 95,
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

  it("política de privacidade: diz que não encontrou referência, sem afirmar inexistência", async () => {
    const caso = CASOS.find((c) => c.regra === "politica de privacidade")!;
    const { violations } = await scanHtmlForViolations(caso.html);
    const privacidade = violations.find((v) => v.type === "missing_privacy_policy");
    expect(privacidade).toBeDefined();
    expect(privacidade!.title).toMatch(/^Referência à Política de Privacidade Não Encontrada$/);
    expect(privacidade!.description).toMatch(/foi encontrado no texto da página/);
    expect(privacidade!.description).toMatch(/não demonstra que o site não tenha política de privacidade/);
    expect(textOf(privacidade!)).not.toMatch(/(site|página) não (tem|possui) política|política (de privacidade )?(inexiste|ausente)/i);
  });

  it("consentimento: não presume que consentimento seja a única base legal", async () => {
    const { violations } = await scanHtmlForViolations(CASOS[1].html);
    const consentimento = violations.find((v) => /consentimento/i.test(v.title));
    expect(consentimento).toBeDefined();
    expect(consentimento!.description).toMatch(/base legal/i);
  });

  it("página que aciona todas as regras não gera critical e cada achado traz a ressalva uma vez", async () => {
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
    expect(result.violations.length).toBeGreaterThanOrEqual(11);
    result.violations.forEach(expectLinguagemHeuristica);
    // Todos os pilares acionados: score 0, igual ao da versão anterior.
    expect(result.complianceScore).toBe(0);
  });
});
