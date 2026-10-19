# Estimativa de custo: Cloud Run para o beta (ADR-0012)

- **Data:** 2026-10-19
- **Status:** estimativa para decisão. **Não é promessa de custo zero.**
- **Autor:** Claude (proposta). Revisão: Luna. Decisão: Guilherme.

## 1. O que precisa ser hospedado
Levantado no código em 19/10/2026:

| Parte | Hoje (Vercel) | No Cloud Run |
|---|---|---|
| Interface React (build do Vite, ~1,1 MB em `dist/`, 524 KB de JS sem compressão) | arquivos estáticos + rewrite para `index.html` | servida pelo mesmo contêiner (Express `static` + fallback da SPA) |
| API tRPC (`/api/trpc`) | função `api/trpc/[trpc].ts` | já existe em `api/_server/_core/dev-server.ts` |
| Login GitHub (`/api/oauth`) | função `api/oauth/[oauth].ts` | já existe no `dev-server.ts` |
| `/api/auth` | função `api/auth/[auth].ts` | **falta** no `dev-server.ts` |
| Webhook do Stripe (`/api/stripe`) | função `api/stripe/[stripe].ts` | **falta** (inativo no beta, mas deve continuar existindo) |
| Limpeza diária (`/api/cron/cleanup`) | Vercel Cron às 03:00 UTC | **falta**: rota + Cloud Scheduler chamando com `CRON_SECRET` |
| Banco | Turso (libsql) | sem mudança |

Conclusão: o `dev-server.ts` cobre só parte da API. A migração exige um servidor
de produção que junte interface, API, `/api/auth`, webhook e cron.

## 2. Preços de referência (verificados em 19/10/2026)
Fonte: [Cloud Run pricing](https://cloud.google.com/run/pricing),
[Free Tier](https://docs.cloud.google.com/free/docs/free-cloud-features).
Cobrança **por requisição** (CPU só durante as requisições), região **Tier 1**
(ex.: `us-central1`):

| Item | Gratuito por mês | Acima disso |
|---|---|---|
| CPU | 180.000 vCPU-s | US$ 0,000024 por vCPU-s |
| Memória | 360.000 GiB-s | US$ 0,0000025 por GiB-s |
| Requisições | 2 milhões | US$ 0,40 por milhão |

- A cota gratuita é somada por conta de faturamento, reinicia todo mês e é
  aplicada como **desconto calculado com preços Tier 1**. Isso vale cerca de
  US$ 6/mês (180.000 × 0,000024 + 360.000 × 0,0000025 + 2 × 0,40).
- **São Paulo (`southamerica-east1`) é Tier 2:** os preços são mais altos e o
  mesmo desconto cobre menos uso. Não encontrei os valores exatos; verificar na
  tabela regional.
- **Outros serviços:**
  - Cloud Build: 2.500 min/mês em e2-standard-2 (cota promocional).
  - Artifact Registry: 0,5 GB de armazenamento.
  - Cloud Logging: 50 GiB/projeto/mês.
  - Cloud Scheduler: tem cota gratuita, mas **não confirmei o número de jobs**.
- **Tráfego de saída para a internet:** a única franquia encontrada (1 GiB/mês)
  vale para a América do Norte. **Não confirmei o preço por GiB para usuários no
  Brasil**; verificar em [Network pricing](https://cloud.google.com/vpc/network-pricing).

## 3. Cenários
Premissas, **todas hipóteses a validar no preview**:
- instância de 1 vCPU e 1 GiB;
- cada scan ocupa ~10 s de CPU (busca da página até 10 s + JSDOM);
- cada visita ao painel gera ~30 requisições de ~0,1 s;
- 1.000 partidas a frio por mês de ~4 s cada (escala a zero).

| Cenário | Scans/mês | Visitas/mês | vCPU-s (≈ GiB-s) | Requisições | Dentro da cota gratuita? |
|---|---|---|---|---|---|
| A. Beta pequeno (20 usuários) | 300 | 600 | ~3.000 + 1.800 + 4.000 ≈ **8.800** | ~20 mil | sim, com folga |
| B. Beta ampliado (200 usuários) | 3.000 | 6.000 | ~30.000 + 18.000 + 4.000 ≈ **52.000** | ~200 mil | sim |
| C. Teto da cota (200 × 30 scans) | 6.000 | 6.000 | ~60.000 + 18.000 + 4.000 ≈ **82.000** | ~200 mil | sim, em Tier 1 |

O limite da cota gratuita fica em torno de **18.000 scans de 10 s por mês** em
Tier 1, sem contar o resto. Em Tier 2, menos.

**Custos que a cota de computação não cobre:**
- tráfego de saída (interface ~1 MB por visitante novo, sem cache; preço não confirmado);
- armazenamento de imagens acima de 0,5 GB (manter só a imagem atual, com política de limpeza);
- logs acima de 50 GiB (improvável no beta);
- domínio próprio, se houver;
- Turso, que não muda em relação a hoje (custo atual não verificado).

**Créditos da GCP:** segundo a Luna, valem até agosto de 2027. **Não verifiquei**
saldo, validade nem quais serviços eles cobrem; conferir no console de faturamento.

## 4. Proteções obrigatórias se migrar
- Alerta de orçamento (ex.: US$ 5/mês) na conta de faturamento.
- `max-instances` baixo (ex.: 2 ou 3) para limitar o custo no pior caso.
- Cobrança por requisição e `min-instances = 0` (aceita partida a frio).
- Imagens antigas apagadas automaticamente (Artifact Registry).

## 5. Esforço de migração (estimado)
2 a 3 PRs:
1. servidor de produção (interface + fallback da SPA + tRPC + oauth + auth +
   webhook + cron) e `Dockerfile`;
2. deploy (Cloud Build), segredos (Secret Manager), Cloud Scheduler e URL de
   retorno do OAuth no GitHub;
3. validação em ambiente de teste e virada de DNS (se houver domínio).

## 6. Comparação

| Opção | Custo mensal | Esforço | Risco principal |
|---|---|---|---|
| Vercel Hobby | US$ 0 | nenhum | termos: uso comercial exige Pro ([Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines)); aguardando resposta escrita da Vercel |
| Vercel Pro | US$ 20 + uso acima de US$ 20 em créditos (segundo a Luna) | nenhum | custo fixo sem receita |
| Cloud Run (Tier 1) | provavelmente US$ 0 em computação nos cenários A–C; tráfego de saída e outros itens a confirmar | 2–3 PRs | estimativa depende das premissas; partida a frio; custos fora da cota |

## 7. Próximos passos para fechar a estimativa
1. Medir no preview o tempo real de um scan e de uma visita ao painel.
2. Consultar a tabela regional (Tier 1 vs. São Paulo) e o preço de saída para o Brasil.
3. Confirmar saldo, validade e escopo dos créditos da GCP.
4. Aguardar a resposta da Vercel e decidir.
