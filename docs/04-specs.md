# Especificações (Spec-Driven Development) — Hubstry Compliance

Este documento contém as especificações executáveis do sistema, escritas antes
da implementação (spec-first). Cada spec é rastreável a um requisito (RF/RNF) e a
uma regra de negócio (RN).

---

## SPEC-01 — Contrato da API de Auditoria

### Endpoint

```
POST /api/audit
Content-Type: application/json
```

### Request

```json
{ "url": "https://exemplo.com.br" }
```

### Response 200 (sucesso)

```json
{
  "url": "https://exemplo.com.br",
  "score": 72,
  "classification": "partial",
  "summary": { "critical": 1, "warning": 2, "info": 3 },
  "pillars": [
    { "id": "dark_pattern", "name": "Dark Patterns", "weight": 0.2, "passed": true },
    { "id": "autoplay", "name": "Autoplay e Estímulo Excessivo", "weight": 0.15, "passed": false }
  ],
  "violations": [
    {
      "type": "autoplay",
      "severity": "warning",
      "title": "Vídeo com Autoplay Detectado",
      "description": "…",
      "recommendation": "…",
      "elementSelector": "video[autoplay]"
    }
  ]
}
```

### Respostas de erro

| Status | Quando | Corpo |
|--------|--------|-------|
| 400 | URL ausente, inválida ou bloqueada por RN-SEC | `{ "error": "mensagem" }` |
| 502 | Falha ao buscar a página de destino (timeout, HTTP != 2xx) | `{ "error": "mensagem" }` |
| 500 | Erro inesperado | `{ "error": "mensagem" }` |

**Rastreabilidade**: RF01, RF04, RF05, RF06, RF07, RNF04.

---

## SPEC-02 — Validação e Segurança de URL

- **Given** uma URL com protocolo diferente de http/https
  **When** enviada para auditoria
  **Then** o sistema responde 400 e não faz fetch. *(RN-SEC-02)*

- **Given** uma URL que resolve para `localhost`, IP privado ou metadata endpoint
  **When** enviada para auditoria
  **Then** o sistema responde 400 e não faz fetch. *(RN-SEC-01)*

- **Given** uma URL válida e pública
  **When** enviada para auditoria
  **Then** o sistema busca o HTML com timeout de 10s. *(RN-SEC-03)*

---

## SPEC-03 — Cálculo do Score

- **Given** um conjunto de violações
  **When** o relatório é montado
  **Then** cada pilar sem violação soma `peso × 100` ao score. *(RN-SCORE-01)*

- **Given** um site sem nenhuma violação
  **Then** o score é `100` e a classificação é `compliant`. *(RN-SCORE-03, RN-SCORE-04)*

- **Given** um site com violação em todos os pilares
  **Then** o score é `0` e a classificação é `non_compliant`.

- **Given** um score de 72
  **Then** a classificação é `partial` (faixa 70–89). *(RN-SCORE-04)*

### Tabela de classificação

| Score | classification |
|-------|----------------|
| 90–100 | `compliant` |
| 70–89 | `partial` |
| 40–69 | `high_risk` |
| 0–39 | `non_compliant` |

---

## SPEC-04 — Detectores (resumo dos critérios)

| Detector | Dispara quando | Severidade | RN |
|----------|----------------|------------|----|
| Autoplay | `<video autoplay>` ou `data-autoplay` presente | warning | RN-DET-AUTOPLAY |
| Scroll infinito | classe/atributo `infinite`/`endless`/`data-infinite-scroll` | warning | RN-DET-INFINITE |
| Dark pattern (roach motel) | form com submit e sem botão de cancelar/sair | warning | RN-DET-DARK |
| Dark pattern (misdirection) | botão de recusa com `opacity` reduzida | critical | RN-DET-DARK |
| Ad trackers | script de tracker conhecido presente | warning | RN-DET-TRACKER |
| Lootbox | indício de sorteio **e** de pagamento no texto | critical | RN-DET-LOOTBOX |
| Política de privacidade | nenhuma referência a privacidade encontrada | critical | RN-DET-PRIVACY |
| Verificação de idade | conteúdo infantil **sem** age gate | critical | RN-DET-AGE |
| Consentimento | sem CMP textual nem script de CMP | critical | RN-DET-CONSENT |
| Acessibilidade (alt) | imagens sem atributo `alt` | info | RN-DET-A11Y |
| Acessibilidade (lang) | `<html>` sem atributo `lang` | info | RN-DET-A11Y |

---

## SPEC-05 — Interface do Usuário

- **Given** a página inicial
  **Then** exibe um campo de URL, botão "Escanear" e conteúdo institucional. *(RF01, RF14)*

- **Given** um scan em andamento
  **Then** o botão fica desabilitado e um estado de carregamento é exibido. *(RF10)*

- **Given** um scan concluído com sucesso
  **Then** exibe o score, a classificação, o grid dos 8 pilares e a lista de
  violações agrupadas por severidade. *(RF06, RF07, RF08, RF09)*

- **Given** um erro (URL inválida ou falha de fetch)
  **Then** exibe uma mensagem de erro clara e permite nova tentativa. *(RF10)*

- **Given** qualquer viewport (mobile a desktop)
  **Then** o layout se adapta de forma responsiva. *(RF13, RNF05)*

---

## SPEC-06 — Privacidade

- **Given** qualquer auditoria concluída
  **Then** nenhuma URL, HTML ou resultado é gravado em banco, arquivo ou log
  persistente. *(RF12, RN-PRIV-01)*
