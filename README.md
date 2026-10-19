<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="client/public/brand/hubstry-logo-light.png">
    <img src="client/public/brand/hubstry-logo.png" alt="Hubstry" width="360">
  </picture>
</p>

<h1 align="center">Hubstry Compliance</h1>

<p align="center">
  Triagem automática de sites frente ao ECA Digital (Lei 15.211/2025) e à LGPD.<br>
  <a href="https://hubstry-compliance-app.vercel.app">Abrir o app</a> ·
  <a href="https://hubstry-compliance-app.vercel.app/sobre">Sobre a Hubstry</a>
</p>

---

## O produto

O Hubstry Compliance analisa o **HTML inicial retornado pelo servidor** de uma
página pública e aponta sinais que merecem revisão, com uma recomendação para
cada um. Conteúdo carregado depois por JavaScript não entra na análise.

**É** uma triagem técnica automática e reproduzível, para mostrar onde vale
olhar primeiro. **Não é** parecer jurídico: os achados indicam pontos para
revisão humana, e a conformidade depende de contexto que nenhuma ferramenta
automática enxerga sozinha.

### O que a análise cobre

Padrões de design manipulativo, reprodução automática de mídia, rolagem
infinita, rastreadores de publicidade, sinais de público infantojuvenil,
política de privacidade, consentimento e controle de cookies, e acessibilidade
básica.

Essa é a organização própria do produto para a triagem, não uma lista oficial
da lei. A revisão das regras do motor (níveis de evidência, redução de falsos
positivos) está em andamento — ver o [roadmap](docs/ROADMAP.md).

### Uso gratuito

O app é gratuito ([ADR-0012](docs/adr/0012-app-gratuito-na-vercel-hobby.md)):
não há planos pagos nem cobrança, e não é pedido cartão de crédito. Basta
entrar com uma conta do GitHub.

| | |
|---|---|
| Preço | R$ 0 |
| Análises por mês | 30 por conta; o saldo reinicia no dia 1º de cada mês |
| Cobrança | desativada; o código de pagamento está congelado, não removido |

Dúvidas, feedback ou necessidade de mais análises: pelo e-mail
guilhermemachado@hubstry.onmicrosoft.com.

---

## Privacidade e dados

| Ponto | Situação |
|---|---|
| HTML das páginas analisadas | Processado em memória e descartado; não é armazenado. |
| Retenção de auditorias concluídas (90 dias) | Código e agendamento implementados (cron diário, PR #18); operação em produção ainda em validação. Auditorias `failed`/`pending` não entram nessa regra (decisão pendente, [ADR-0011](docs/adr/0011-dados-de-auditoria-e-html.md)). |
| Exclusão de dados pelo titular | Os endpoints existem (`audits.delete`, `gdpr.deleteAccount`), mas ainda não há interface no app. Até lá, a exclusão é atendida pelo e-mail acima. |

---

## Rodando localmente

Pré-requisitos: **Node.js 22+**, **pnpm 10+** (`npm install -g pnpm`) e **Git**.

```bash
git clone https://github.com/guilherme-machado-ceo/hubstry-compliance-app.git
cd hubstry-compliance-app
pnpm install
pnpm db:setup:dev   # cria o banco SQLite local
pnpm dev            # frontend (Vite) e backend (tRPC) em modo watch
```

Abra **http://localhost:5173**. Em desenvolvimento, a autenticação é
dispensada (`BYPASS_AUTH=true` em `.env.development`).

Testes: `pnpm test`. A falha conhecida em `auth.logout.test.ts` é
preexistente e está registrada no roadmap.

### Variáveis de ambiente (desenvolvimento)

Crie `.env.development` na raiz com:

```env
NODE_ENV=development
BYPASS_AUTH=true
DATABASE_URL=file:./dev.db
DATABASE_PROVIDER=sqlite
JWT_SECRET=qualquer-string-longa-para-dev
STRIPE_SECRET_KEY=sk_test_placeholder_dev
STRIPE_WEBHOOK_SECRET=whsec_placeholder_dev
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder_dev
VITE_APP_URL=http://localhost:5173
APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001
```

Para testar o login real com GitHub OAuth, consulte
[docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md).

---

## Arquitetura e decisões

- **Stack:** React 19, Vite, Tailwind CSS 4 e shadcn/ui no frontend; tRPC 11
  e Drizzle ORM no backend, em funções serverless na Vercel; banco
  Turso/libsql em produção e SQLite em desenvolvimento; Stripe (congelado,
  checkout desativado); login com
  GitHub OAuth.
- **Decisões de arquitetura:** [`docs/adr/`](docs/adr/README.md).
- **Prioridades:** [`docs/ROADMAP.md`](docs/ROADMAP.md).
- **Regras para agentes de código:** [`CLAUDE.md`](CLAUDE.md).

---

## Sobre a Hubstry

A Hubstry é um operating deep tech venture builder focado em pesquisa,
desenvolvimento e criação de ativos tecnológicos proprietários. Em síntese,
transforma incerteza tecnológica em vantagem competitiva estruturada e de
longo prazo. O posicionamento completo e o manifesto estão em
[hubstry-compliance-app.vercel.app/sobre](https://hubstry-compliance-app.vercel.app/sobre).

<p>
  <img src="client/public/brand/nvidia-inception-program-badge-rgb-for-screen.svg"
       alt="Membro do NVIDIA Inception Program" width="180">
</p>

> A arquitetura original deste produto foi concebida por Guilherme Gonçalves
> Machado e iterada com ferramentas de IA generativa (Claude, Claude Code,
> entre outras). Todo o design estratégico, técnico e comercial é propriedade
> intelectual da Hubstry Deep Tech.

---

## Licença

Distribuído sob a **Elastic License 2.0 (ELv2)**. Uso pessoal, avaliação e
contribuições são permitidos. É **proibido** oferecer este software como
serviço gerenciado (SaaS) sem autorização expressa da Hubstry.

Licenciamento comercial, parcerias ou uso enterprise:
guilhermemachado@hubstry.onmicrosoft.com

© 2026 Hubstry Deep Tech · Guilherme Gonçalves Machado · Rio de Janeiro, Brasil
