#!/usr/bin/env tsx
/**
 * Seed script para desenvolvimento local.
 * Cria usuário dev, subscription Pro e auditorias de exemplo.
 * Executar via: pnpm db:seed:dev
 */

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import {
  users,
  subscriptions,
  audits,
  violations,
} from "../drizzle/schema.sqlite";

const dbUrl = process.env.DATABASE_URL ?? "file:./dev.db";
const client = createClient({ url: dbUrl });
const db = drizzle(client);

const SAMPLE_AUDITS = [
  {
    url: "https://www.globo.com",
    domain: "globo.com",
    score: 72,
    violations: [
      {
        type: "ad_tracker" as const,
        severity: "warning" as const,
        title: "3 Rastreadores de Anúncios Detectados",
        description: "Google Analytics, DoubleClick e outros rastreadores encontrados.",
        recommendation: "Implemente consentimento explícito antes de carregar rastreadores.",
      },
      {
        type: "autoplay" as const,
        severity: "warning" as const,
        title: "Vídeo com Autoplay Detectado",
        description: "Vídeos reproduzindo automaticamente sem consentimento do usuário.",
        recommendation: "Remova o atributo autoplay ou solicite consentimento.",
      },
    ],
  },
  {
    url: "https://www.g1.globo.com",
    domain: "g1.globo.com",
    score: 81,
    violations: [
      {
        type: "ad_tracker" as const,
        severity: "warning" as const,
        title: "2 Rastreadores de Anúncios Detectados",
        description: "Google Analytics e Facebook Pixel encontrados.",
        recommendation: "Adicione banner de consentimento LGPD-compliant.",
      },
    ],
  },
  {
    url: "https://www.uol.com.br",
    domain: "uol.com.br",
    score: 55,
    violations: [
      {
        type: "dark_pattern" as const,
        severity: "critical" as const,
        title: "Misdirection Detectada",
        description: "Botões de recusa visualmente desfavorecidos.",
        recommendation: "Garanta igual proeminência visual para botões de aceitar e recusar.",
      },
      {
        type: "ad_tracker" as const,
        severity: "warning" as const,
        title: "4 Rastreadores Detectados",
        description: "Múltiplos rastreadores de publicidade encontrados.",
        recommendation: "Implemente CMP (Consent Management Platform) compatível com LGPD.",
      },
      {
        type: "infinite_scroll" as const,
        severity: "warning" as const,
        title: "Rolagem Infinita Detectada",
        description: "Feed sem paginação explícita identificado.",
        recommendation: "Adicione paginação ou botão 'Carregar mais'.",
      },
    ],
  },
  {
    url: "https://www.estadao.com.br",
    domain: "estadao.com.br",
    score: 88,
    violations: [
      {
        type: "ad_tracker" as const,
        severity: "warning" as const,
        title: "1 Rastreador Detectado",
        description: "Google Analytics encontrado sem consentimento explícito.",
        recommendation: "Revise o banner de cookies para solicitar consentimento antes do carregamento.",
      },
    ],
  },
  {
    url: "https://www.folha.uol.com.br",
    domain: "folha.uol.com.br",
    score: 65,
    violations: [
      {
        type: "missing_privacy_policy" as const,
        severity: "critical" as const,
        title: "Link de Política de Privacidade Não Encontrado",
        description: "Nenhum link visível para política de privacidade na página inicial.",
        recommendation: "Adicione link para política de privacidade no rodapé da página.",
      },
      {
        type: "ad_tracker" as const,
        severity: "warning" as const,
        title: "2 Rastreadores Detectados",
        description: "Scripts de rastreamento carregando antes do consentimento.",
        recommendation: "Bloqueie rastreadores até obter consentimento explícito.",
      },
    ],
  },
];

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Upsert dev user
  await db
    .insert(users)
    .values({
      openId: "dev-user-001",
      name: "Dev User",
      email: "dev@hubstry.local",
      loginMethod: "bypass",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    })
    .onConflictDoUpdate({
      target: users.openId,
      set: { lastSignedIn: new Date() },
    });

  const [devUser] = await db
    .select()
    .from(users)
    .where(eq(users.openId, "dev-user-001"))
    .limit(1);

  if (!devUser) throw new Error("Dev user not found after insert");

  console.log(`✅ Usuário dev criado (id=${devUser.id})`);

  // Upsert Pro subscription
  const existingSub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, devUser.id))
    .limit(1);

  if (existingSub.length === 0) {
    await db.insert(subscriptions).values({
      userId: devUser.id,
      plan: "free",
      scansPerMonth: 5,
      scansUsedThisMonth: 0,
      status: "active",
    });
    console.log("✅ Subscription Free criada");
  } else {
    console.log("ℹ️  Subscription já existe, pulando");
  }

  // Insert sample audits
  for (const sample of SAMPLE_AUDITS) {
    const existing = await db
      .select()
      .from(audits)
      .where(eq(audits.url, sample.url))
      .limit(1);

    if (existing.length > 0) {
      console.log(`ℹ️  Auditoria já existe para ${sample.domain}, pulando`);
      continue;
    }

    const [audit] = await db
      .insert(audits)
      .values({
        userId: devUser.id,
        url: sample.url,
        domain: sample.domain,
        status: "completed",
        complianceScore: sample.score,
        totalViolations: sample.violations.length,
        criticalViolations: sample.violations.filter((v) => v.severity === "critical").length,
        warningViolations: sample.violations.filter((v) => v.severity === "warning").length,
        infoViolations: 0,
      })
      .returning({ id: audits.id });

    for (const v of sample.violations) {
      await db.insert(violations).values({
        auditId: audit.id,
        type: v.type,
        severity: v.severity,
        title: v.title,
        description: v.description,
        recommendation: v.recommendation,
      });
    }

    console.log(`✅ Auditoria criada: ${sample.domain} (score=${sample.score})`);
  }

  console.log("\n🎉 Seed concluído com sucesso!");
  console.log("   → Acesse http://localhost:5173 após rodar pnpm dev");
  console.log("   → Login: dev@hubstry.local (automático com BYPASS_AUTH=true)");

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Seed falhou:", err);
  process.exit(1);
});
