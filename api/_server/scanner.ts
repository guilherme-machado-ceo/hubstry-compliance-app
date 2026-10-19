/**
 * Web Scanner for compliance violations
 * Detects dark patterns, autoplay, infinite scroll, ad trackers, lootboxes, and privacy policy issues
 *
 * NOTE: JSDOM is lazy-imported inside scanHtmlForViolations() so that
 * serverless environments (Vercel) don't crash at module-load time if
 * jsdom cannot resolve its optional native bindings.
 */

import { ECA_PILLARS } from "../_shared/pillars.js";
import { safeFetchText } from "./safe-fetch.js";

export interface ScanResult {
  violations: ViolationDetail[];
  complianceScore: number;
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
}

/**
 * Aviso anexado a todo achado heuristico (ADR-0005): a regra le apenas o HTML
 * inicial, sem executar JavaScript, e nao comprova violacao legal.
 */
const LIMITACAO_HEURISTICA =
  "Analise heuristica do HTML inicial: conteudo carregado por JavaScript, outras paginas do site e o funcionamento real nao foram verificados, e o resultado pode ser um falso positivo. Este achado nao comprova violacao legal.";

export interface ViolationDetail {
  type: string;
  severity: "critical" | "warning" | "info";
  title: string;
  description: string;
  recommendation: string;
  elementSelector?: string;
}

/**
 * Scan HTML content for compliance violations
 */
export async function scanHtmlForViolations(
  htmlContent: string,
): Promise<ScanResult> {
  const violations: ViolationDetail[] = [];

  try {
    // Lazy import — avoids top-level crash in Vercel serverless
    const { JSDOM } = await import("jsdom");
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;

    // Check for autoplay videos
    violations.push(...detectAutoplay(document));

    // Check for infinite scroll
    violations.push(...detectInfiniteScroll(document));

    // Check for dark patterns
    violations.push(...detectDarkPatterns(document));

    // Check for ad trackers
    violations.push(...detectAdTrackers(document));

    // Check for lootboxes
    violations.push(...detectLootboxes(document));

    // Check for privacy policy
    violations.push(...detectPrivacyPolicy(document));

    // Check for age verification
    violations.push(...detectAgeVerification(document));

    // Check for consent mechanisms
    violations.push(...detectConsent(document));

    // Check for basic accessibility
    violations.push(...detectAccessibility(document));
  } catch (error) {
    console.error("Error scanning HTML:", error);
    violations.push({
      type: "other",
      severity: "warning",
      title: "Erro ao analisar pagina",
      description: `Ocorreu um erro durante a analise: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      recommendation: "Verifique se a URL e valida e acessivel.",
    });
  }

  // Score ponderado pelos 8 pilares ECA Digital
  const complianceScore = Math.round(
    ECA_PILLARS.reduce((acc, pillar) => {
      const hasViolation = violations.some((v) => v.type === pillar.id);
      return acc + (hasViolation ? 0 : pillar.weight * 100);
    }, 0),
  );

  const criticalCount = violations.filter(
    (v) => v.severity === "critical",
  ).length;
  const warningCount = violations.filter(
    (v) => v.severity === "warning",
  ).length;
  const infoCount = violations.filter((v) => v.severity === "info").length;

  return {
    violations,
    complianceScore,
    summary: {
      critical: criticalCount,
      warning: warningCount,
      info: infoCount,
    },
  };
}

/**
 * Detect autoplay videos
 */
function detectAutoplay(document: Document): ViolationDetail[] {
  const violations: ViolationDetail[] = [];
  const videos = document.querySelectorAll("video");

  videos.forEach((video) => {
    if (
      video.hasAttribute("autoplay") ||
      video.hasAttribute("data-autoplay")
    ) {
      violations.push({
        type: "autoplay",
        severity: "warning",
        title: "Video com Autoplay Detectado",
        description:
          "Videos com autoplay podem prejudicar a experiencia do usuario e consumir dados desnecessariamente, especialmente para usuarios menores de idade.",
        recommendation:
          "Remova o atributo 'autoplay' ou implemente um controle de consentimento do usuario antes de reproduzir automaticamente.",
        elementSelector: "video[autoplay]",
      });
    }
  });

  return violations;
}

/**
 * Detect infinite scroll patterns
 */
function detectInfiniteScroll(document: Document): ViolationDetail[] {
  const violations: ViolationDetail[] = [];
  const elements = document.querySelectorAll(
    "[class*='infinite'], [class*='endless'], [data-infinite-scroll]",
  );

  if (elements.length > 0) {
    violations.push({
      type: "infinite_scroll",
      severity: "warning",
      title: "Possivel Rolagem Infinita",
      description:
        `Ha elementos com classe ou atributo contendo 'infinite' ou 'endless'. O nome da classe nao demonstra que a rolagem infinita esteja ativa nem avalia seu efeito sobre o usuario. ${LIMITACAO_HEURISTICA}`,
      recommendation:
        "Verifique se a pagina carrega conteudo continuamente sem acao do usuario. Se carregar, considere paginacao explicita ou pontos de parada, especialmente em servicos de acesso provavel por criancas e adolescentes.",
      elementSelector: "[class*='infinite']",
    });
  }

  return violations;
}

/**
 * Detect dark patterns
 */
function detectDarkPatterns(document: Document): ViolationDetail[] {
  const violations: ViolationDetail[] = [];

  // Check for roach motel (hard to unsubscribe)
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    const submitButtons = form.querySelectorAll(
      "button[type='submit'], input[type='submit']",
    );
    const cancelButtons = form.querySelectorAll(
      "button[onclick*='cancel'], button[onclick*='close'], a[href*='cancel']",
    );

    if (submitButtons.length > 0 && cancelButtons.length === 0) {
      violations.push({
        type: "dark_pattern",
        severity: "warning",
        title: "Possivel Padrao de Roach Motel",
        description:
          `Um formulario com botao de envio nao tem botao ou link de cancelamento reconhecido pela regra. Formularios comuns, como busca ou contato, tambem acionam este achado; a regra nao avalia fluxos de assinatura ou cancelamento. ${LIMITACAO_HEURISTICA}`,
        recommendation:
          "Se o formulario fizer parte de um fluxo de assinatura ou cadastro, verifique se cancelar ou sair e tao facil quanto aderir.",
      });
    }
  });

  // Check for misdirection (misleading buttons)
  const buttons = document.querySelectorAll("button, a[role='button']");
  buttons.forEach((button) => {
    const text = button.textContent?.toLowerCase() || "";
    const opacityAttr = button.getAttribute("style") || "";

    if (
      (text.includes("nao") || text.includes("recusar")) &&
      opacityAttr.includes("opacity")
    ) {
      violations.push({
        type: "dark_pattern",
        severity: "warning",
        title: "Possivel Misdirection em Botao de Recusa",
        description:
          `Um botao com texto de recusa (como 'nao' ou 'recusar') tem 'opacity' no estilo inline, o que pode indicar destaque visual menor que o da opcao de aceitar. O valor da opacidade, as folhas de estilo e a aparencia final nao foram avaliados. ${LIMITACAO_HEURISTICA}`,
        recommendation:
          "Compare visualmente as opcoes de aceitar e recusar e, se houver diferenca de destaque, de a mesma proeminencia a ambas.",
      });
    }
  });

  return violations;
}

/**
 * Detect ad trackers
 */
function detectAdTrackers(document: Document): ViolationDetail[] {
  const violations: ViolationDetail[] = [];

  // Common ad tracker patterns
  const trackerPatterns = [
    "google-analytics",
    "facebook.com/tr",
    "doubleclick.net",
    "googleadservices",
    "amazon-adsystem",
    "criteo.com",
    "bing.com/ads",
  ];

  const scripts = document.querySelectorAll("script");
  let trackerCount = 0;

  scripts.forEach((script) => {
    const src = script.src || script.textContent || "";
    if (trackerPatterns.some((pattern) => src.includes(pattern))) {
      trackerCount++;
    }
  });

  if (trackerCount > 0) {
    violations.push({
      type: "ad_tracker",
      severity: "warning",
      title: `${trackerCount} Rastreador(es) de Anuncios Detectado(s)`,
      description:
        `Scripts associados a servicos de publicidade ou medicao de audiencia foram encontrados. A presenca do script nao demonstra quais dados sao coletados nem se o carregamento ocorre antes da escolha do usuario. ${LIMITACAO_HEURISTICA}`,
      recommendation:
        "Verifique quais dados esses servicos coletam e a base legal adotada para cada um; se a base for o consentimento, confirme que o carregamento respeita a escolha do usuario. Dedique atencao especial a criancas e adolescentes.",
    });
  }

  return violations;
}

/**
 * Detect lootbox patterns
 */
function detectLootboxes(document: Document): ViolationDetail[] {
  const violations: ViolationDetail[] = [];

  // Look for gambling-like mechanics
  const lootboxPatterns = [
    "caixa",
    "sorteio",
    "premio",
    "gacha",
    "loot",
    "roulette",
    "spin",
  ];

  const bodyText = document.body.textContent?.toLowerCase() || "";
  const hasLootboxPattern = lootboxPatterns.some((pattern) =>
    bodyText.includes(pattern),
  );

  // Check for payment buttons near lootbox indicators
  const paymentPatterns = [
    "comprar",
    "pagar",
    "credito",
    "buy",
    "pay",
  ];
  const hasPaymentPattern = paymentPatterns.some((pattern) =>
    bodyText.includes(pattern),
  );

  if (hasLootboxPattern && hasPaymentPattern) {
    violations.push({
      type: "lootbox",
      severity: "warning",
      title: "Possivel Mecanica de Lootbox ou Sorteio Pago",
      description:
        `O texto da pagina contem termos associados a sorteios ou caixas de recompensa (como 'caixa', 'premio' ou 'loot') e termos de pagamento (como 'comprar'). A presenca simultanea desses termos e um indicio fraco: nao demonstra que exista caixa de recompensa paga nem que ela esteja disponivel a criancas e adolescentes. ${LIMITACAO_HEURISTICA}`,
      recommendation:
        "Verifique manualmente se ha itens de recompensa aleatoria adquiridos com dinheiro real ou moeda virtual e se o servico e direcionado ou de acesso provavel por criancas e adolescentes. Se houver, avalie o recurso a luz da Lei 15.211/2025 (ECA Digital) com apoio juridico.",
    });
  }

  return violations;
}

/**
 * Detect missing privacy policy
 */
function detectPrivacyPolicy(document: Document): ViolationDetail[] {
  const violations: ViolationDetail[] = [];

  const privacyPatterns = [
    "privacidade",
    "privacy",
    "politica",
    "policy",
    "dados",
    "dados pessoais",
  ];

  const bodyText = document.body.textContent?.toLowerCase() || "";
  const footerText =
    document.querySelector("footer")?.textContent?.toLowerCase() || "";
  const headerText =
    document.querySelector("header")?.textContent?.toLowerCase() || "";

  const hasPrivacyPolicy = privacyPatterns.some(
    (pattern) =>
      bodyText.includes(pattern) ||
      footerText.includes(pattern) ||
      headerText.includes(pattern),
  );

  if (!hasPrivacyPolicy) {
    violations.push({
      type: "missing_privacy_policy",
      severity: "warning",
      title: "Referencia a Politica de Privacidade Nao Encontrada",
      description:
        `Nenhum termo associado a politica de privacidade (como 'privacidade', 'privacy' ou 'politica') foi encontrado no texto da pagina. Isso nao demonstra que o site nao tenha politica de privacidade: ela pode estar em outra pagina, em menu carregado por JavaScript ou em texto sem esses termos. ${LIMITACAO_HEURISTICA}`,
      recommendation:
        "Confirme se a politica de privacidade existe e se esta facilmente acessivel a partir desta pagina, por exemplo por link no rodape ou cabecalho.",
    });
  }

  return violations;
}

/**
 * Detect age verification
 */
function detectAgeVerification(document: Document): ViolationDetail[] {
  const violations: ViolationDetail[] = [];

  // Check if page targets minors but has no age gate
  const childTargetingPatterns = [
    "jogo",
    "game",
    "crianca",
    "kid",
    "infantil",
    "jovem",
    "teen",
  ];

  const bodyText = document.body.textContent?.toLowerCase() || "";
  const targetsChildren = childTargetingPatterns.some((pattern) =>
    bodyText.includes(pattern),
  );

  // Check for age verification mechanisms
  const ageGatePatterns = [
    "verificar idade",
    "age verification",
    "confirm age",
    "datavalid",
    "gov.br",
    "serpro",
  ];

  const hasAgeGate = ageGatePatterns.some((pattern) =>
    bodyText.includes(pattern),
  );

  if (targetsChildren && !hasAgeGate) {
    violations.push({
      type: "age_verification",
      severity: "info",
      title: "Possivel Publico Infantojuvenil sem Afericao de Idade Identificada",
      description:
        `O texto da pagina contem termos associados a publico infantojuvenil (como 'jogo' ou 'infantil') e nenhum termo associado a afericao de idade. Mencionar esses termos nao demonstra que o servico seja direcionado ou de acesso provavel por criancas e adolescentes, e a ausencia de termos nao demonstra ausencia de mecanismo. ${LIMITACAO_HEURISTICA}`,
      recommendation:
        "Avalie se o servico e direcionado ou de acesso provavel por criancas e adolescentes. Se for, documente o mecanismo de afericao de idade adotado e sua proporcionalidade ao risco, considerando a Lei 15.211/2025 (ECA Digital), o Decreto 12.880/2026 e as orientacoes da ANPD. Esta analise nao indica metodo nem fornecedor de afericao.",
    });
  }

  return violations;
}

/**
 * Detect missing consent mechanism
 */
function detectConsent(document: Document): ViolationDetail[] {
  const violations: ViolationDetail[] = [];

  const consentPatterns = [
    "aceitar",
    "aceito",
    "concordo",
    "consentimento",
    "consent",
    "cookies",
    "lgpd",
    "aceitar cookies",
    "cookiebot",
    "onetrust",
    "privacidade",
    "termos",
  ];

  const bodyText = document.body?.textContent?.toLowerCase() ?? "";
  const hasConsentMechanism = consentPatterns.some((p) =>
    bodyText.includes(p),
  );

  // Check for scripts that are typical CMPs
  const scripts = document.querySelectorAll("script[src]");
  const cmpScripts = Array.from(scripts).some((s) => {
    const src = s.getAttribute("src") ?? "";
    return (
      src.includes("cookiebot") ||
      src.includes("onetrust") ||
      src.includes("cookiepro") ||
      src.includes("didomi")
    );
  });

  if (!hasConsentMechanism && !cmpScripts) {
    violations.push({
      type: "other",
      severity: "warning",
      title: "Mecanismo de Consentimento Nao Identificado",
      description:
        `Nenhum termo associado a banner de consentimento (como 'cookies' ou 'aceitar') nem script de plataforma de gestao de consentimento (CMP) conhecida foi encontrado. Isso nao indica irregularidade por si so: o consentimento nao e a unica base legal possivel e pode nao ser necessario se a pagina nao usar cookies ou rastreadores nao essenciais. ${LIMITACAO_HEURISTICA}`,
      recommendation:
        "Verifique quais cookies e rastreadores a pagina carrega e a base legal de cada tratamento. Se a base for o consentimento, confirme que ele e obtido e registrado antes do carregamento dos itens nao essenciais (ver Guia Orientativo de Cookies da ANPD, de carater orientativo).",
    });
  }

  return violations;
}

/**
 * Detect basic accessibility issues
 */
function detectAccessibility(document: Document): ViolationDetail[] {
  const violations: ViolationDetail[] = [];

  // Check for images without alt text
  const images = document.querySelectorAll("img");
  let imagesWithoutAlt = 0;
  images.forEach((img) => {
    const alt = img.getAttribute("alt");
    if (alt === null || alt === undefined) {
      imagesWithoutAlt++;
    }
  });

  if (imagesWithoutAlt > 0) {
    violations.push({
      type: "other",
      severity: "info",
      title: `${imagesWithoutAlt} Imagem(ns) sem Texto Alternativo`,
      description:
        "Imagens sem atributo alt dificultam o acesso por pessoas com deficiencia visual, impactando a acessibilidade digital.",
      recommendation:
        "Adicione o atributo alt descritivo a todas as imagens. Use alt=\"\" para imagens decorativas.",
      elementSelector: "img:not([alt])",
    });
  }

  // Check for missing lang attribute on <html>
  const htmlEl = document.querySelector("html");
  if (htmlEl && !htmlEl.getAttribute("lang")) {
    violations.push({
      type: "other",
      severity: "info",
      title: "Idioma da Pagina Nao Declarado",
      description:
        "O atributo lang nao esta definido no elemento <html>, dificultando leitores de tela.",
      recommendation:
        "Adicione lang=\"pt-BR\" ao elemento <html> para indicar o idioma da pagina.",
      elementSelector: "html:not([lang])",
    });
  }

  return violations;
}

/**
 * Fetch and scan a URL
 *
 * A validacao de destino (SSRF), redirects, prazo e limite de tamanho ficam em
 * safe-fetch.ts.
 */
export async function scanUrl(url: string): Promise<ScanResult> {
  const htmlContent = await safeFetchText(url);
  return scanHtmlForViolations(htmlContent);
}
