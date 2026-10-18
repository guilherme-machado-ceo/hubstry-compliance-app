# ADR-0007: IA apenas em experimento fora do produto

- **Status:** Aceito
- **Data:** 2026-10-18
- **Decisores:** Guilherme (decisão final), Luna (revisão), Claude (proposta)

## Contexto
Foi proposta uma camada de revisão contextual com modelo de linguagem
(Nemotron), e há créditos em AWS e GCP. Ainda não existe conjunto de sites
reais rotulados para medir ganho.

## Decisão
- Ordem: (1) motor corrigido; (2) base local de 30–50 sites reais
  rotulados por humanos; (3) experimento com Nemotron no Amazon Bedrock via
  `scripts/ai-eval.ts`; (4) Vertex AI só para avaliar justificativas, depois.
- O critério de verdade é o rótulo humano, nunca a concordância entre
  modelos.
- Enviar só trechos mínimos de evidência, sem HTML integral nem dados
  pessoais; conferir elegibilidade dos créditos e limites de gasto antes.
- Entrada em produção só com ganho mensurável, como camada opcional
  desativada por padrão, sem alterar score nem apagar achados.

## Consequências
Nenhum custo ou dependência de IA no produto até haver evidência.
Enviar conteúdo de clientes a provedores exigirá revisão de política de
privacidade e de transferência internacional.

## Revisão
Após o experimento do item 3.
