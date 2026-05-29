# 🛡️ Hubstry Compliance

**Scanner de conformidade digital para a era da ECA Digital (Lei 15.211/2025)**

Desenvolvido por [Hubstry Deep Tech](https://hubstry.dev) — deep tech estratégica
brasileira com foco em soberania tecnológica, IA simbólica e compliance digital.

---

## Sobre a Hubstry

A **Hubstry Deep Tech** é uma startup de tecnologia profunda fundada por
Guilherme Gonçalves Machado, com sede no Rio de Janeiro. Desenvolvemos
tecnologias proprietárias de alto impacto, posicionadas como ativos de
soberania tecnológica nacional.

Atuamos em três frentes:

**B2B — Inovação Corporativa com Propósito**
Empresas de tecnologia, educação e segurança contratam a Hubstry para desenvolver
IA simbólica e interpretação semântica, criar soluções de interoperabilidade entre
linguagens e sistemas, e formar equipes com pensamento interdisciplinar.

**B2G — Soberania Tecnológica e Inovação Pública**
Governos e instituições estratégicas contam com a Hubstry para desenvolver
tecnologia nacional com identidade própria, fortalecer a educação técnica e
acelerar a transformação digital com ética e profundidade.

**P&D — Hub de Tecnologia Proprietária**
Atuamos na antecipação de rotas tecnológicas em horizontes de 3 a 5 anos,
reduzindo risco, custo e tempo no desenvolvimento de tecnologias emergentes
antes que se tornem padrão de mercado.

> A arquitetura original deste produto foi concebida por Guilherme Gonçalves
> Machado e iterada com ferramentas de IA generativa (Claude, Claude Code,
> entre outras). Todo o design estratégico, técnico e comercial é propriedade
> intelectual da Hubstry Deep Tech.

---

## O Produto

O Hubstry Compliance é um scanner SaaS que audita sites e aplicações digitais
contra os 8 pilares da ECA Digital (Lei 15.211/2025), com prazo de conformidade
obrigatória até janeiro de 2027 (ANPD).

### Funcionalidades

- Detecção de dark patterns (roach motel, misdirection, urgência falsa)
- Detecção de autoplay, infinite scroll e rastreadores de anúncios
- Verificação de políticas de privacidade e age verification
- Score de conformidade por domínio auditado
- Histórico completo de auditorias com detalhamento de violações
- Relatórios exportáveis (plano Pro)

### Planos

| | Free | Pro | Enterprise |
|---|---|---|---|
| Scans/mês | 3 | Ilimitado | Ilimitado |
| Relatório PDF | — | ✓ | ✓ |
| Acesso API | — | — | ✓ |
| Suporte | — | Email | Prioritário |

---

## Teste em 3 Passos (via Terminal)

### Pré-requisitos

- **Node.js 22+** — [nodejs.org](https://nodejs.org)
- **pnpm 10+** — instale com: `npm install -g pnpm`
- **Git** — [git-scm.com](https://git-scm.com)
- **~1 GB** de espaço em disco

### Passo 1 — Clone o repositório

```bash
git clone https://github.com/guilherme-machado-ceo/hubstry-compliance-app.git
cd hubstry-compliance-app
```

### Passo 2 — Instale e rode

```bash
pnpm install
pnpm db:setup:dev
pnpm dev
```

> O comando `pnpm db:setup:dev` cria o banco SQLite local automaticamente.
> O comando `pnpm dev` sobe o frontend na porta **5173** e o backend na porta **3000**.
> O modo dev usa autenticação bypassada (`BYPASS_AUTH=true`) — nenhum login necessário.

### Passo 3 — Abra no navegador

Acesse **http://localhost:5173**

Cole a URL do site que deseja auditar e clique em **"Escanear"**.
A análise leva entre 5 e 30 segundos. O relatório aparece com:

- **Score de conformidade** (0 a 100%)
- **8 pilares da ECA Digital** avaliados individualmente
- **Cada violação** com descrição clara e recomendação de correção

> **Dica:** O plano Free permite 3 scans por mês. Scans reiniciam no dia 1º de cada mês.

---

## Conformidade com a LGPD

O Hubstry Compliance respeita integralmente a LGPD (Lei 13.709/2018):

- **Sem retenção de HTML:** O conteúdo das páginas analisadas é processado em memória
  e descartado após a análise. Nenhum código-fonte de terceiros é armazenado.
- **Retenção automática:** Resultados de auditoria são excluídos automaticamente após
  90 dias (job diário de retenção).
- **Direito ao esquecimento:** O usuário pode excluir qualquer auditoria individual
  ou solicitar a exclusão completa dos seus dados a qualquer momento (Art. 18, III, LGPD).
- **Endpoint de exclusão:** `gdpr.deleteAccount` para exclusão completa dos dados.

---

## Stack Tecnológico

- **Frontend**: React 19 + Vite 5 + Tailwind CSS 4 + shadcn/ui
- **Backend**: Express 5 + tRPC 11 + Drizzle ORM
- **Banco de dados**: SQLite (desenvolvimento)
- **Pagamentos**: Stripe
- **Deploy**: Vercel
- **Autenticação**: GitHub OAuth

---

## Variáveis de ambiente

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

### Login real com GitHub OAuth (opcional)

Para testar o fluxo de autenticação completo,
consulte [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md).

---

## Licença

Este software é distribuído sob a **Elastic License 2.0 (ELv2)**.

Uso pessoal, avaliação e contribuições são permitidos. É **proibido** oferecer
este software como serviço gerenciado (SaaS) sem autorização expressa da Hubstry.

Para licenciamento comercial, parcerias ou uso enterprise:
📧 guilhermemachado@hubstry.onmicrosoft.com

---

© 2026 Hubstry Deep Tech · Guilherme Gonçalves Machado · Rio de Janeiro, Brasil
