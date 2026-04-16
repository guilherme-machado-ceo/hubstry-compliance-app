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

## Stack Tecnológico

- **Frontend**: React 19 + Vite 5 + Tailwind CSS 4 + shadcn/ui
- **Backend**: Express 5 + tRPC 11 + Prisma 6
- **Banco de dados**: MySQL (produção) / SQLite (desenvolvimento)
- **Pagamentos**: Stripe
- **Deploy**: Vercel (frontend + API serverless)
- **Autenticação**: OAuth

---

## Desenvolvimento Local

### Pré-requisitos
- Node.js 22+
- pnpm 10+

### Instalação

```bash
git clone https://github.com/guilherme-machado-ceo/hubstry-compliance-app.git
cd hubstry-compliance-app
pnpm install
pnpm db:push:dev   # cria banco SQLite local com todas as tabelas
pnpm dev           # sobe frontend em :5173 e API em :3001
```

Acesse em **http://localhost:5173** — nenhuma configuração adicional necessária
para avaliação local.

### Variáveis de ambiente (produção)

Copie `.env.production.example` e preencha com suas credenciais:

```bash
cp .env.production.example .env.local
```

---

## Licença

Este software é distribuído sob a **Elastic License 2.0 (ELv2)**.

Uso pessoal, avaliação e contribuições são permitidos. É **proibido** oferecer
este software como serviço gerenciado (SaaS) sem autorização expressa da Hubstry.

Para licenciamento comercial, parcerias ou uso enterprise:
📧 guilhermemachado@hubstry.onmicrosoft.com

---

© 2025 Hubstry Deep Tech · Guilherme Gonçalves Machado · Rio de Janeiro, Brasil
