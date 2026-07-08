# Regras de Negócio — Hubstry Compliance

Este documento formaliza as regras de negócio (RN) que governam a auditoria de
conformidade com a **ECA Digital (Lei 15.211/2025)**.

---

## 1. Os 8 Pilares da ECA Digital

O score de conformidade é calculado sobre 8 pilares, cada um com um peso relativo.
A soma dos pesos é **1.0 (100%)**.

| Pilar | ID | Peso | O que avalia |
|-------|----|------|--------------|
| Dark Patterns | `dark_pattern` | 0,20 | Padrões enganosos (roach motel, misdirection, urgência falsa). |
| Autoplay e Estímulo Excessivo | `autoplay` | 0,15 | Reprodução automática de mídia sem consentimento. |
| Rastreadores de Publicidade | `ad_tracker` | 0,15 | Trackers de anúncios sem consentimento explícito. |
| Verificação de Idade | `age_verification` | 0,15 | Age gate ausente em conteúdo voltado a menores. |
| Lootboxes e Sorteios | `lootbox` | 0,10 | Mecânicas de azar associadas a pagamento. |
| Scroll Infinito | `infinite_scroll` | 0,10 | Rolagem infinita como mecanismo de retenção. |
| Política de Privacidade | `missing_privacy_policy` | 0,10 | Ausência de política de privacidade acessível. |
| Consentimento e Acessibilidade | `other` | 0,05 | Ausência de CMP e problemas básicos de acessibilidade. |

> **RN-PESO**: Os pesos são fixos nesta versão. Qualquer alteração de peso é uma
> mudança de regra de negócio e deve ser versionada.

---

## 2. Cálculo do Score

**RN-SCORE-01**: O score inicia em 0 e cada pilar **sem violação** soma
`peso × 100` ao total.

**RN-SCORE-02**: Um pilar é considerado **reprovado** se houver ao menos uma
violação cujo `type` corresponda ao `id` do pilar.

**RN-SCORE-03**: O score final é arredondado para o inteiro mais próximo e
sempre pertence ao intervalo fechado `[0, 100]`.

**RN-SCORE-04**: Classificação qualitativa do score:

| Faixa | Classificação |
|-------|---------------|
| 90–100 | Conforme |
| 70–89 | Conformidade parcial |
| 40–69 | Risco elevado |
| 0–39 | Não conforme |

---

## 3. Severidade das Violações

**RN-SEV-01**: Toda violação possui exatamente uma severidade:
`critical` (crítica), `warning` (alerta) ou `info` (informação).

**RN-SEV-02**: Violações críticas indicam risco regulatório direto
(ex.: ausência de verificação de idade em conteúdo infantil, lootbox pago,
ausência de política de privacidade, ausência de mecanismo de consentimento).

**RN-SEV-03**: A severidade **não** altera o peso do pilar no score; ela orienta
a priorização das correções pelo usuário.

---

## 4. Regras de Detecção por Pilar

**RN-DET-DARK**: Detecta *roach motel* (formulário com botão de envio, mas sem
opção clara de cancelar/sair) e *misdirection* (botões de recusa visualmente
desfavorecidos via opacidade).

**RN-DET-AUTOPLAY**: Detecta elementos `<video>` com atributo `autoplay` ou
`data-autoplay`.

**RN-DET-INFINITE**: Detecta elementos com classes/atributos que indiquem scroll
infinito (`infinite`, `endless`, `data-infinite-scroll`).

**RN-DET-TRACKER**: Detecta scripts de rastreadores conhecidos
(Google Analytics, Facebook Pixel, DoubleClick, Google Ads, Amazon Ads, Criteo,
Bing Ads).

**RN-DET-LOOTBOX**: Sinaliza violação **crítica** apenas quando há
simultaneamente indícios de mecânica de sorteio (caixa, sorteio, prêmio, gacha,
loot, roleta, spin) **e** indícios de pagamento (comprar, pagar, crédito).

**RN-DET-PRIVACY**: Sinaliza violação **crítica** quando nenhuma referência a
política de privacidade é encontrada no corpo, cabeçalho ou rodapé.

**RN-DET-AGE**: Sinaliza violação **crítica** quando o conteúdo aparenta ser
voltado a menores (jogo, game, criança, infantil, jovem, teen) **e** não há
mecanismo de verificação de idade (incluindo integrações oficiais como
Datavalid/Serpro/Gov.br).

**RN-DET-CONSENT**: Sinaliza violação **crítica** quando não há mecanismo de
consentimento textual nem script de CMP conhecido (Cookiebot, OneTrust,
CookiePro, Didomi).

**RN-DET-A11Y**: Sinaliza violações **informativas** para imagens sem `alt` e
para ausência do atributo `lang` no elemento `<html>`.

---

## 5. Regras de Segurança e Privacidade

**RN-SEC-01 (SSRF)**: É proibido auditar URLs que apontem para `localhost`,
`0.0.0.0`, `::1`, faixas de rede privadas (`10.*`, `172.16–31.*`, `192.168.*`,
`169.254.*`, `fc00::`, `fe80::`) ou endpoints de metadados de nuvem
(`169.254.169.254`, `metadata.google.internal`).

**RN-SEC-02 (Protocolo)**: Apenas os protocolos `http:` e `https:` são aceitos.

**RN-SEC-03 (Timeout)**: O fetch da página é abortado após 10 segundos.

**RN-PRIV-01 (Sem retenção)**: A URL, o HTML e o resultado da análise são
processados em memória e descartados ao final da requisição. Nada é persistido.

**RN-PRIV-02 (Sem rastreamento)**: A aplicação não usa cookies de rastreamento
nem coleta dados pessoais do usuário que faz a auditoria.

---

## 6. Regras de Uso

**RN-USO-01**: Nesta versão não há limite de scans, pois não há contas de
usuário. Limites por plano (Free = 3/mês, Pro = ilimitado) são regras previstas
para evolução futura com autenticação.
