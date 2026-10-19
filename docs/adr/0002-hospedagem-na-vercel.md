# ADR-0002: Manter a hospedagem na Vercel

- **Status:** Aceito (condição de revisão substituída pelo ADR-0012)
- **Data:** 2026-10-18
- **Decisores:** Guilherme (decisão final), Luna (revisão), Claude (proposta)

## Contexto
O incidente `FUNCTION_INVOCATION_FAILED` (18/10/2026) levantou a hipótese de
migrar de hospedagem. O diagnóstico mostrou que a causa era o código (ver
ADR-0003), não a plataforma. Há créditos disponíveis em AWS e GCP.

## Decisão
- Frontend e backend continuam na Vercel.
- Créditos de nuvem são usados para **complementar**, não para migrar: coleta
  de dados de avaliação, experimentos de IA (ADR-0007) e, no futuro, um
  worker de navegador headless (Cloud Run), se aprovado.

## Consequências
- Zero esforço de migração; OAuth, rewrites e deploy continuam como estão.
- Limitações do plano Hobby, segundo a documentação da Vercel: destinado a
  uso pessoal e não comercial, e logs de runtime retidos por 1 hora.

## Alternativas consideradas
Migrar só o backend para um serviço Node ou o app inteiro: descartadas
porque o problema não era de plataforma e o custo recairia sobre o
fundador solo.

## Revisão
> Substituída pelo [ADR-0012](0012-app-gratuito-na-vercel-hobby.md) em
> 2026-10-19: o app permanece gratuito no plano Hobby, sem Pro, com o risco
> dos termos registrado e aceito. Texto original mantido abaixo.

Migrar para o plano Pro (ou equivalente que permita uso comercial) **antes
do lançamento ou de qualquer uso comercial** do app, conforme os termos
vigentes da Vercel — não apenas antes da primeira cobrança. Reavaliar a
hospedagem do backend se um worker em contêiner se tornar central.
