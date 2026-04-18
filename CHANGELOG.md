# Changelog

Todas as mudanças notáveis neste projeto são documentadas aqui.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.0.0-dev] - 2026-04-18

### Adicionado

- Scanner estático de conformidade com o ECA Digital (Lei 15.211/2025)
- 8 pilares de análise com score ponderado (0–100):
  - Dark Patterns (roach motel, misdirection)
  - Autoplay e Estímulo Excessivo
  - Scroll Infinito
  - Rastreadores de Publicidade
  - Verificação de Idade
  - Política de Privacidade
  - Consentimento Explícito (LGPD)
  - Acessibilidade Básica (WCAG)
- Auth via OAuth (plataforma Manus)
- **Modo dev com `BYPASS_AUTH=true`** — login automático como dev@hubstry.local
- Dashboard de histórico de auditorias com scores e violações
- Planos Free (3 scans/mês), Pro (ilimitado) e Enterprise
- Integração Stripe para pagamentos e assinaturas
- Banco de dados SQLite para desenvolvimento (zero-config)
- Script `pnpm db:setup:dev` — setup completo com dados de exemplo
- `DevBanner` visual para identificar modo de desenvolvimento
- Seed com 5 auditorias de exemplo (globo.com, g1, uol, estadao, folha)
- README com instruções de setup em 5 minutos

### Stack

- React 19 + Vite 5 + Tailwind CSS 4 + shadcn/ui
- Express 5 + tRPC 11 + Drizzle ORM
- SQLite (dev) / MySQL (prod)
- TypeScript strict mode

---

*Versões anteriores não documentadas (bootstrap inicial).*
