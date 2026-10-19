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
 * Aviso anexado a todo achado das regras de deteccao (ADR-0005): as regras
 * leem apenas o HTML inicial, sem executar JavaScript, e nao comprovam
 * violacao legal. Aplicado por comLimitacao(), nunca escrito em cada regra.
 */
export const LIMITACAO_HEURISTICA =
  "Análise heurística do HTML inicial: o scanner não executa JavaScript nem verifica outras páginas do site, e o resultado pode ser um falso positivo. Este achado não comprova violação legal.";

function comLimitacao(findings: ViolationDetail[]): ViolationDetail[] {
  return findings.map((v) =>
    v.description.includes(LIMITACAO_HEURISTICA)
      ? v
      : { ...v, description: `${v.description} ${LIMITACAO_HEURISTICA}` },
  );
}

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
    violations.push(...comLimitacao(detectAutoplay(document)));

    // Check for infinite scroll
    violations.push(...comLimitacao(detectInfiniteScroll(document)));

    // Check for dark patterns
    violations.push(...comLimitacao(detectDarkPatterns(document)));

    // Check for ad trackers
    violations.push(...comLimitacao(detectAdTrackers(document)));

    // Check for lootboxes
    violations.push(...comLimitacao(detectLootboxes(document)));

    // Check for privacy policy
    violations.push(...comLimitacao(detectPrivacyPolicy(document)));

    // Check for age verification
    violations.push(...comLimitacao(detectAgeVerification(document)));

    // Check for consent mechanisms
    violations.push(...comLimitacao(detectConsent(document)));

    // Check for basic accessibility
    violations.push(...comLimitacao(detectAccessibility(document)));
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
        title: "Vídeo com Reprodução Automática (autoplay)",
        description:
          "Um elemento <video> tem o atributo 'autoplay' ou 'data-autoplay'. A reprodução automática pode prejudicar a experiência de uso e consumir dados móveis, especialmente de crianças e adolescentes. O atributo não garante a reprodução: navegadores podem bloqueá-la.",
        recommendation:
          "Avalie remover o atributo 'autoplay' ou exigir uma ação do usuário antes de iniciar a reprodução.",
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
      title: "Possível Rolagem Infinita",
      description:
        "Há elementos com classe ou atributo contendo 'infinite' ou 'endless'. O nome da classe não demonstra que a rolagem infinita esteja ativa nem avalia seu efeito sobre quem usa a página.",
      recommendation:
        "Verifique se a página carrega conteúdo continuamente sem ação do usuário. Se carregar, considere paginação explícita ou pontos de parada, especialmente em serviços de acesso provável por crianças e adolescentes.",
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
        severity: "info",
        title: "Possível Padrão de Roach Motel",
        description:
          "Um formulário com botão de envio não tem botão ou link de cancelamento reconhecido pela regra. Formulários comuns, como os de busca ou contato, também acionam este achado; a regra não avalia fluxos de assinatura ou cancelamento.",
        recommendation:
          "Se o formulário fizer parte de um fluxo de assinatura ou cadastro, verifique se cancelar ou sair é tão fácil quanto aderir.",
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
        title: "Possível Misdirection em Botão de Recusa",
        description:
          "Um botão com texto de recusa (a regra procura 'nao' e 'recusar') tem a propriedade 'opacity' no estilo inline, o que pode indicar destaque visual menor que o da opção de aceitar. O valor da opacidade, as folhas de estilo e a aparência final não foram avaliados.",
        recommendation:
          "Compare visualmente as opções de aceitar e recusar e, se houver diferença de destaque, dê a mesma proeminência a ambas.",
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
      title: `${trackerCount} Rastreador(es) de Anúncios Detectado(s)`,
      description:
        "Foram encontrados scripts associados a serviços de publicidade ou de medição de audiência. A presença do script não demonstra quais dados são coletados nem se o carregamento ocorre antes da escolha do usuário.",
      recommendation:
        "Verifique quais dados esses serviços coletam e a base legal adotada para cada um; se a base for o consentimento, confirme que o carregamento respeita a escolha do usuário. Dê atenção especial a crianças e adolescentes.",
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
      title: "Possível Mecânica de Loot Box ou Sorteio Pago",
      description:
        "O texto da página contém termos associados a sorteios ou caixas de recompensa (como 'caixa', 'gacha' ou 'loot') e termos de pagamento (como 'comprar'). A presença simultânea desses termos é um indício fraco: não demonstra que exista caixa de recompensa paga nem que ela esteja disponível para crianças e adolescentes.",
      recommendation:
        "Verifique manualmente se há itens de recompensa aleatória adquiridos com dinheiro real ou moeda virtual e se o serviço é direcionado a crianças e adolescentes ou de acesso provável por eles. Se houver, avalie o recurso à luz da Lei 15.211/2025 (ECA Digital), com apoio jurídico.",
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
      title: "Referência à Política de Privacidade Não Encontrada",
      description:
        "Nenhum termo associado a política de privacidade (como 'privacidade', 'privacy' ou 'policy') foi encontrado no texto da página. Isso não demonstra que o site não tenha política de privacidade: ela pode estar em outra página, em um menu carregado por JavaScript ou em um texto sem esses termos.",
      recommendation:
        "Confirme se a política de privacidade existe e se está facilmente acessível a partir desta página, por exemplo por um link no rodapé ou no cabeçalho.",
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
      title: "Possível Público Infantojuvenil sem Aferição de Idade Identificada",
      description:
        "O texto da página contém termos associados ao público infantojuvenil (como 'jogo' ou 'infantil') e nenhum termo associado à aferição de idade. A menção a esses termos não demonstra que o serviço seja direcionado a crianças e adolescentes ou de acesso provável por eles, e a ausência de termos não demonstra a ausência de mecanismo.",
      recommendation:
        "Avalie se o serviço é direcionado a crianças e adolescentes ou de acesso provável por eles. Se for, documente o mecanismo de aferição de idade adotado e sua proporcionalidade ao risco, considerando a Lei 15.211/2025 (ECA Digital), o Decreto 12.880/2026 e as orientações da ANPD. Esta análise não indica método nem fornecedor de aferição.",
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
      title: "Mecanismo de Consentimento Não Identificado",
      description:
        "Não foram encontrados termos associados a banner de consentimento (como 'cookies' ou 'aceitar') nem script de plataforma de gestão de consentimento (CMP) conhecida. Isso não indica irregularidade por si só: o consentimento não é a única base legal possível e pode não ser necessário se a página não usar cookies ou rastreadores não essenciais.",
      recommendation:
        "Verifique quais cookies e rastreadores a página carrega e a base legal de cada tratamento. Se a base for o consentimento, confirme que ele é obtido e registrado antes do carregamento dos itens não essenciais (ver o Guia Orientativo sobre Cookies e Proteção de Dados da ANPD, de caráter orientativo).",
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
        "Imagens sem atributo alt dificultam o acesso de pessoas com deficiência visual que usam leitores de tela.",
      recommendation:
        "Adicione um atributo alt descritivo às imagens informativas. Use alt=\"\" para imagens decorativas.",
      elementSelector: "img:not([alt])",
    });
  }

  // Check for missing lang attribute on <html>
  const htmlEl = document.querySelector("html");
  if (htmlEl && !htmlEl.getAttribute("lang")) {
    violations.push({
      type: "other",
      severity: "info",
      title: "Idioma da Página Não Declarado",
      description:
        "O atributo lang não está definido no elemento <html>, o que dificulta a leitura correta por leitores de tela.",
      recommendation:
        "Adicione lang=\"pt-BR\" (ou o idioma correspondente) ao elemento <html>.",
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
