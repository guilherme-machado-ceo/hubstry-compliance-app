# Arquitetura & DDD — Hubstry Compliance

## 1. Stack Tecnológico

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Framework | **Next.js 16 (App Router)** | Full-stack unificado, SSR + Route Handlers na mesma base; deploy nativo na Vercel elimina o servidor Express separado (causa do erro 500 na versão anterior). |
| Runtime | **Node.js 20+** | Suporte a `fetch` nativo e `AbortController`. |
| Linguagem | **TypeScript** (strict) | Segurança de tipos no domínio e nas fronteiras. |
| UI | **React 19.2** | Server Components por padrão; Client Components apenas onde há interação. |
| Estilo | **Tailwind CSS v4** | Design system via tokens em `globals.css`. |
| Parsing HTML | **node-html-parser** | Parser leve, sem dependências nativas — evita o crash de `jsdom` em ambiente serverless. |
| Ícones | **lucide-react** | Biblioteca de ícones consistente. |

### Por que essa stack resolve o erro 500?

A versão anterior rodava um **servidor Express + tRPC** empacotado como função
serverless na Vercel. Esse padrão sofria com resolução de rotas, cold-start e
o carregamento de `jsdom` (que depende de bindings nativos) no momento de import.
A reconstrução usa **Route Handlers nativos do Next.js** e um parser puro em JS,
eliminando a camada Express e a dependência nativa.

---

## 2. Domain-Driven Design (DDD)

O projeto isola o **domínio** (regras da ECA Digital) da **infraestrutura**
(fetch HTTP, parsing) e da **apresentação** (UI Next.js).

### 2.1 Linguagem Ubíqua

| Termo | Significado |
|-------|-------------|
| **Auditoria (Audit)** | Processo completo de análise de uma URL. |
| **Pilar (Pillar)** | Uma das 8 dimensões da ECA Digital com um peso. |
| **Violação (Violation)** | Ocorrência de não conformidade detectada. |
| **Severidade (Severity)** | Gravidade de uma violação (crítica/alerta/info). |
| **Score de Conformidade** | Nota 0–100 ponderada pelos pilares. |
| **Relatório (Report)** | Resultado agregado de uma auditoria. |

### 2.2 Estrutura de Pastas (Bounded Context: Compliance)

```
lib/
  domain/                      # Núcleo — regras de negócio puras, sem I/O
    pillars.ts                 # Definição dos 8 pilares e pesos (Value Objects)
    violation.ts               # Tipos Violation / Severity
    compliance-report.ts       # Entidade de relatório + cálculo de score + classificação
    detectors/                 # Serviços de domínio: cada detector é uma regra
      index.ts                 # Orquestra todos os detectores
      dark-patterns.ts
      autoplay.ts
      infinite-scroll.ts
      ad-trackers.ts
      lootboxes.ts
      privacy-policy.ts
      age-verification.ts
      consent.ts
      accessibility.ts
  infrastructure/              # Adaptadores para o mundo externo
    url-guard.ts               # Regra de segurança SSRF (RN-SEC)
    page-fetcher.ts            # Busca HTML com timeout
    html-document.ts           # Abstração de parsing (node-html-parser)
  application/                 # Casos de uso (orquestração)
    audit-url.ts               # Use case: recebe URL -> retorna Report

app/
  api/audit/route.ts           # Route Handler (fronteira HTTP) -> chama o use case
  page.tsx / ...               # Apresentação
```

### 2.3 Camadas e Dependências

```
Apresentação (app/)  ->  Aplicação (use cases)  ->  Domínio (regras puras)
                                  |
                                  v
                         Infraestrutura (fetch, parser, url-guard)
```

- O **domínio não importa nada** de infraestrutura nem de apresentação.
- Os **detectores** recebem um documento já parseado (abstração `HtmlDocument`),
  então não conhecem `node-html-parser` diretamente — facilita testes e troca de
  parser.
- O **use case** (`audit-url.ts`) orquestra: valida URL (url-guard) → busca HTML
  (page-fetcher) → parseia (html-document) → roda detectores → monta o relatório.

### 2.4 Objetos de Domínio

- **Value Objects**: `Pillar` (id, nome, peso), `Severity`.
- **Entidade/Agregado**: `ComplianceReport` (violações, score, classificação,
  resultado por pilar). É o agregado raiz do resultado de uma auditoria.
- **Serviços de Domínio**: os `detectors`, que encapsulam cada regra de detecção
  (RN-DET-*).

---

## 3. Fluxo de uma Auditoria

1. Usuário envia URL pelo formulário (Client Component).
2. `POST /api/audit` recebe a URL.
3. `auditUrl(url)` (use case):
   1. `assertSafeUrl(url)` — aplica RN-SEC-01/02.
   2. `fetchPage(url)` — aplica RN-SEC-03 (timeout 10s).
   3. `parseHtml(html)` — cria `HtmlDocument`.
   4. `runDetectors(doc)` — executa as regras RN-DET-*.
   5. `ComplianceReport.from(violations)` — aplica RN-SCORE-*.
4. Route Handler retorna o relatório em JSON.
5. UI renderiza score, pilares e violações.
6. Nada é persistido (RN-PRIV-01).
