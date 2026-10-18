# ADR-0004: Motor de scan determinístico

- **Status:** Aceito
- **Data:** 2026-10-18
- **Decisores:** Guilherme (decisão final), Luna (revisão), Claude (proposta)

## Contexto
O scanner gerava falsos positivos graves (ex.: "fourteen" classificava um
site como infantil; caixa de busca virava "roach motel"). Foram discutidas
alternativas com navegador headless e com revisão por IA.

## Decisão
- O núcleo do scanner é **análise estática e determinística** do HTML.
- Não há navegador headless nem IA no caminho crítico, no build ou no
  cálculo do score.
- Texto analisado é o texto visível (sem `script`, `style`, `noscript`,
  `template`), com correspondência por palavra inteira.
- Menção não é mecanismo: citar algo na página não prova que exista.
- Fixtures positivas e negativas versionadas são **requisito para toda
  regra nova ou alterada**. Em 18/10/2026, nem todas as regras existentes
  têm essa cobertura; ela é incorporada à medida que cada regra é revisada.

## Consequências
Resultados reproduzíveis e auditáveis; aceita-se que comportamentos
renderizados por JavaScript fiquem fora do alcance, registrados como
limitação ou resultado inconclusivo.

## Alternativas consideradas
Headless no caminho principal (custo e latência em serverless) e IA como
árbitro (não reproduzível, mascara defeitos de regra).

## Revisão
Validação funcional com navegador pode entrar como etapa complementar
separada, por ADR próprio.
