# Documento de Requisitos — Hubstry Compliance

> Scanner de conformidade digital para a era da **ECA Digital (Lei 15.211/2025)**.
> Produto da **Hubstry Deep Tech**.

---

## 1. Visão Geral

O Hubstry Compliance é uma aplicação web que audita sites e aplicações digitais
contra os **8 pilares da ECA Digital (Lei 15.211/2025)** — o Estatuto da Criança
e do Adolescente no ambiente digital, com prazo de conformidade obrigatória
regulada pela ANPD. O usuário informa uma URL e recebe, em segundos, um relatório
de conformidade com score ponderado, violações detectadas e recomendações de
correção.

### 1.1 Objetivos de produto

- Democratizar o diagnóstico de conformidade digital para times de produto,
  jurídico e compliance.
- Antecipar riscos regulatórios antes da fiscalização.
- Oferecer recomendações acionáveis, não apenas apontar problemas.

### 1.2 Escopo desta versão (MVP v3)

- Aplicação **stateless**: sem cadastro, sem login e **sem retenção de dados** do
  usuário nem do conteúdo analisado.
- Análise **real** de HTML por heurísticas (server-side).
- Relatório exibido imediatamente na tela, sem persistência.

### 1.3 Fora de escopo (evoluções futuras)

- Autenticação e contas de usuário.
- Histórico de auditorias e persistência em banco.
- Planos pagos (Free/Pro/Enterprise) e cobrança via Stripe.
- Exportação de relatório em PDF.
- Acesso via API pública.
- Análise assistida por IA (camada semântica).

---

## 2. Requisitos Funcionais (RF)

| ID | Requisito | Prioridade |
|----|-----------|------------|
| RF01 | O sistema deve permitir que o usuário informe uma URL para auditoria. | Alta |
| RF02 | O sistema deve validar a URL (formato, protocolo http/https). | Alta |
| RF03 | O sistema deve bloquear URLs que apontem para redes internas/privadas (proteção contra SSRF). | Alta |
| RF04 | O sistema deve buscar o HTML da URL informada com timeout máximo de 10s. | Alta |
| RF05 | O sistema deve analisar o HTML contra os 8 pilares da ECA Digital. | Alta |
| RF06 | O sistema deve calcular um score de conformidade ponderado (0–100). | Alta |
| RF07 | O sistema deve listar cada violação com severidade, descrição e recomendação. | Alta |
| RF08 | O sistema deve agrupar violações por pilar e por severidade (crítica/alerta/informação). | Média |
| RF09 | O sistema deve apresentar o resultado individual de cada um dos 8 pilares (aprovado/reprovado). | Alta |
| RF10 | O sistema deve exibir estados de carregamento e de erro de forma clara. | Alta |
| RF11 | O sistema deve funcionar sem exigir login ou cadastro. | Alta |
| RF12 | O sistema não deve armazenar a URL, o HTML nem o resultado da análise. | Alta |
| RF13 | O sistema deve ser responsivo (mobile-first). | Média |
| RF14 | O sistema deve apresentar conteúdo institucional sobre a ECA Digital e a Hubstry. | Baixa |

---

## 3. Requisitos Não Funcionais (RNF)

| ID | Requisito | Métrica / Critério |
|----|-----------|--------------------|
| RNF01 | **Desempenho**: uma auditoria deve concluir em tempo aceitável. | < 30s no p95 (limitado pelo fetch externo). |
| RNF02 | **Disponibilidade**: arquitetura serverless nativa na Vercel. | Sem servidor de estado; escala automática. |
| RNF03 | **Privacidade (LGPD)**: nenhum dado do usuário é persistido. | Processamento em memória e descarte imediato. |
| RNF04 | **Segurança**: proteção contra SSRF e entradas maliciosas. | Bloqueio de IPs privados, metadata endpoints e protocolos não-http. |
| RNF05 | **Acessibilidade**: conformidade com boas práticas WCAG. | HTML semântico, contraste adequado, navegação por teclado. |
| RNF06 | **Manutenibilidade**: arquitetura orientada a domínio (DDD). | Domínio isolado de infraestrutura e apresentação. |
| RNF07 | **Portabilidade**: rodar em qualquer ambiente Node 20+/Edge compatível. | Sem dependências nativas obrigatórias. |
| RNF08 | **Observabilidade**: erros de análise reportados sem vazar dados sensíveis. | Logs estruturados server-side. |
| RNF09 | **SEO**: metadados adequados para a landing institucional. | `metadata` e `viewport` no App Router. |
| RNF10 | **Internacionalização**: interface em português (pt-BR). | Copy e mensagens em pt-BR. |

---

## 4. Personas

- **Ana — Product Manager**: quer saber se o produto dela está em risco antes do
  prazo regulatório.
- **Carlos — Advogado/Compliance**: precisa de evidências objetivas de violações
  para orientar o time técnico.
- **Governo/B2G**: avalia conformidade de plataformas que atendem menores.

---

## 5. Métricas de Sucesso

- Tempo médio de auditoria abaixo de 15s.
- Taxa de erro de análise (fetch/parse) abaixo de 5%.
- Zero incidentes de retenção indevida de dados (garantido por arquitetura).
