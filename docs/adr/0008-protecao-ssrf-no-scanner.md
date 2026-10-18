# ADR-0008: Proteção contra SSRF no scanner

- **Status:** Aceito (implementado no PR-4, PR #17; validação em runtime real pendente)
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
- Portas de destino restritas às portas efetivas 80 e 443, validadas também
  a cada redirecionamento.
- Testes só com DNS, sockets e respostas simulados.

## Implementação (PR #17)
`api/_server/safe-fetch.ts`, usado por `scanUrl` em `api/_server/scanner.ts`:
- Faixas bloqueadas conforme os registros IANA de endereços de uso especial
  (IPv4 e IPv6, atualizados em 2025-10-09, consultados em 2026-10-18) e
  multicast. IPv6 só é aceito dentro de `2000::/3`.
- `lookup` próprio valida todos os A/AAAA e só entrega endereços validados
  ao socket; o hostname é preservado.
- No máximo 3 redirecionamentos, cada `Location` revalidado (inclusive porta).
- Prazo de 10 s até o fim do corpo; limite de 5 MB sobre os bytes
  descomprimidos.
- Cobertura: testes com DNS e `request` simulados (sem rede real).

**Ainda não verificado:** que o `lookup` customizado é honrado pelo
`https.request` no runtime da Vercel, SNI/TLS reais, um scan real e o
bloqueio de um alvo interno real. Isso depende de validação em preview.

## Consequências
Reduz o risco de SSRF por meio das proteções especificadas, sujeito à
validação da implementação e dos casos de teste. Algumas URLs legítimas
atrás de muitos redirecionamentos, ou em portas diferentes de 80/443,
passam a ser recusadas.

## Revisão
Se o scanner passar a usar navegador headless, aplicar as mesmas regras.
