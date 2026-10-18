# ADR-0008: Proteção contra SSRF no scanner

- **Status:** Aceito (implementação no PR-4)
- **Data:** 2026-10-18
- **Decisores:** Guilherme (decisão final), Luna (revisão), Claude (proposta)

## Contexto
O scanner busca URLs fornecidas pelo usuário. A validação existente usava
padrões de texto, seguia redirecionamentos sem revalidar e não limitava
tempo de leitura nem tamanho da resposta.

## Decisão
- Classificação de IPs pelas faixas especiais da IANA (IPv4 e IPv6),
  incluindo IPv4 mapeado em IPv6 e NAT64.
- IPs literais validados antes de qualquer conexão.
- Todas as respostas DNS validadas; conexão fixada em endereço já validado,
  preservando hostname no Host, SNI e TLS.
- Redirecionamentos manuais, limitados e revalidados.
- Timeout até o fim da leitura do corpo e limite de tamanho.
- Testes só com DNS, sockets e respostas simulados.

## Consequências
Reduz o risco de SSRF por meio das proteções especificadas, sujeito à
validação da implementação e dos casos de teste. Algumas URLs legítimas
atrás de muitos redirecionamentos podem ser recusadas. Implementação
pendente (PR-4).

## Revisão
Se o scanner passar a usar navegador headless, aplicar as mesmas regras.
