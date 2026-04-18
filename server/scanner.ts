/**
 * Web Scanner for compliance violations
 * Detects dark patterns, autoplay, infinite scroll, ad trackers, lootboxes, and privacy policy issues
 */

import { JSDOM } from "jsdom";

export interface ScanResult {
  violations: ViolationDetail[];
  complianceScore: number;
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
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
  htmlContent: string
): Promise<ScanResult> {
  const violations: ViolationDetail[] = [];

  try {
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
  } catch (error) {
    console.error("Error scanning HTML:", error);
    violations.push({
      type: "other",
      severity: "warning",
      title: "Erro ao analisar página",
      description: `Ocorreu um erro durante a análise: ${error instanceof Error ? error.message : "Erro desconhecido"}`,
      recommendation: "Verifique se a URL é válida e acessível.",
    });
  }

  // Calculate compliance score
  const criticalCount = violations.filter((v) => v.severity === "critical").length;
  const warningCount = violations.filter((v) => v.severity === "warning").length;
  const infoCount = violations.filter((v) => v.severity === "info").length;

  // Score calculation: 100 - (critical * 10 + warning * 5 + info * 1)
  const complianceScore = Math.max(
    0,
    100 - (criticalCount * 10 + warningCount * 5 + infoCount * 1)
  );

  return {
    violations,
    complianceScore: Math.round(complianceScore),
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
        title: "Vídeo com Autoplay Detectado",
        description:
          "Vídeos com autoplay podem prejudicar a experiência do usuário e consumir dados desnecessariamente, especialmente para usuários menores de idade.",
        recommendation:
          "Remova o atributo 'autoplay' ou implemente um controle de consentimento do usuário antes de reproduzir automaticamente.",
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
  const elements = document.querySelectorAll("[class*='infinite'], [class*='endless'], [data-infinite-scroll]");

  if (elements.length > 0) {
    violations.push({
      type: "infinite_scroll",
      severity: "warning",
      title: "Rolagem Infinita Detectada",
      description:
        "A rolagem infinita pode ser uma prática de dark pattern que mantém usuários engajados indefinidamente, especialmente prejudicial para menores.",
      recommendation:
        "Implemente paginação explícita ou adicione um aviso claro sobre o conteúdo infinito com opção de parar.",
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
    const submitButtons = form.querySelectorAll("button[type='submit'], input[type='submit']");
    const cancelButtons = form.querySelectorAll(
      "button[onclick*='cancel'], button[onclick*='close'], a[href*='cancel']"
    );

    if (submitButtons.length > 0 && cancelButtons.length === 0) {
      violations.push({
        type: "dark_pattern",
        severity: "warning",
        title: "Padrão de Roach Motel Detectado",
        description:
          "Formulário sem opção clara de cancelamento ou saída, tornando difícil para usuários se desinscreverem.",
        recommendation:
          "Adicione um botão de cancelamento ou voltar com a mesma proeminência do botão de envio.",
      });
    }
  });

  // Check for misdirection (misleading buttons)
  const buttons = document.querySelectorAll("button, a[role='button']");
  buttons.forEach((button) => {
    const text = button.textContent?.toLowerCase() || "";
    const opacityAttr = button.getAttribute("style") || "";

    if (
      (text.includes("não") || text.includes("recusar")) &&
      opacityAttr.includes("opacity")
    ) {
      violations.push({
        type: "dark_pattern",
        severity: "critical",
        title: "Misdirection Detectada",
        description:
          "Botões de recusa estão visualmente desfavorecidos em relação aos botões de aceitação.",
        recommendation:
          "Certifique-se de que os botões de recusa têm a mesma proeminência visual que os de aceitação.",
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
        "Múltiplos rastreadores de anúncios foram encontrados na página, potencialmente coletando dados de usuários.",
      recommendation:
        "Revise a política de privacidade e implemente consentimento explícito antes de carregar rastreadores, especialmente para menores.",
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
    "prêmio",
    "gacha",
    "loot",
    "roulette",
    "spin",
  ];

  const bodyText = document.body.textContent?.toLowerCase() || "";
  const hasLootboxPattern = lootboxPatterns.some((pattern) =>
    bodyText.includes(pattern)
  );

  // Check for payment buttons near lootbox indicators
  const paymentPatterns = ["comprar", "pagar", "crédito", "buy", "pay"];
  const hasPaymentPattern = paymentPatterns.some((pattern) =>
    bodyText.includes(pattern)
  );

  if (hasLootboxPattern && hasPaymentPattern) {
    violations.push({
      type: "lootbox",
      severity: "critical",
      title: "Possível Mecânica de Lootbox Detectada",
      description:
        "A página pode conter mecanismos de sorteio ou caixas mistério com pagamento, o que é prejudicial para menores.",
      recommendation:
        "Implemente controles de idade robustos e avisos claros sobre mecânicas de sorteio. Considere remover essas funcionalidades para usuários menores.",
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
    "política",
    "policy",
    "dados",
    "dados pessoais",
  ];

  const bodyText = document.body.textContent?.toLowerCase() || "";
  const footerText = document.querySelector("footer")?.textContent?.toLowerCase() || "";
  const headerText = document.querySelector("header")?.textContent?.toLowerCase() || "";

  const hasPrivacyPolicy = privacyPatterns.some(
    (pattern) =>
      bodyText.includes(pattern) ||
      footerText.includes(pattern) ||
      headerText.includes(pattern)
  );

  if (!hasPrivacyPolicy) {
    violations.push({
      type: "missing_privacy_policy",
      severity: "critical",
      title: "Política de Privacidade Não Encontrada",
      description:
        "Nenhuma referência a política de privacidade foi encontrada na página. Isso viola LGPD e regulamentações de proteção de dados.",
      recommendation:
        "Adicione um link para a política de privacidade no rodapé ou cabeçalho da página, tornando-o facilmente acessível.",
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
    "criança",
    "kid",
    "infantil",
    "jovem",
    "teen",
  ];

  const bodyText = document.body.textContent?.toLowerCase() || "";
  const targetsChildren = childTargetingPatterns.some((pattern) =>
    bodyText.includes(pattern)
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
    bodyText.includes(pattern)
  );

  if (targetsChildren && !hasAgeGate) {
    violations.push({
      type: "age_verification",
      severity: "critical",
      title: "Verificação de Idade Ausente",
      description:
        "A página parece ser direcionada a menores, mas não possui mecanismo de verificação de idade conforme exigido pelo ECA Digital.",
      recommendation:
        "Implemente um sistema robusto de verificação de idade usando APIs oficiais como Datavalid (Serpro/Gov.br) antes de permitir acesso.",
    });
  }

  return violations;
}

/**
 * Fetch and scan a URL
 */
export async function scanUrl(url: string): Promise<ScanResult> {
  try {
    // Validate URL
    const urlObj = new URL(url);

    // Fetch the page
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const htmlContent = await response.text();

      // Scan for violations
      const result = await scanHtmlForViolations(htmlContent);

      return result;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    throw error;
  }
}
