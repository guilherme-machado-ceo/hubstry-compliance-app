# ADR-0010: Uso da marca Hubstry e do selo NVIDIA Inception

- **Status:** Aceito
- **Data:** 2026-10-18
- **Decisores:** Guilherme (decisão final), Luna (revisão), Claude (proposta)

## Contexto
O app usava um ícone genérico e texto como marca. A Hubstry é membro do
NVIDIA Inception, com uso do selo aprovado conforme as diretrizes da NVIDIA.

## Decisão
- Logo Hubstry via componente `BrandLogo`, com variante branca para fundos
  escuros; favicon oficial.
- Selo NVIDIA Inception: arquivo oficial (SVG RGB "for screen") sem
  nenhuma alteração, apenas no rodapé das **páginas institucionais**
  (landing e `/sobre`), dentro das diretrizes aplicáveis da NVIDIA.
  *(Atualizado em 2026-10-18: antes, apenas no rodapé da landing.)*
- O selo nunca aparece em telas de auditoria nem perto de scores, para não
  sugerir endosso da NVIDIA aos relatórios.

## Consequências
Arquivos de marca em `client/public/brand/` não devem ser editados.
