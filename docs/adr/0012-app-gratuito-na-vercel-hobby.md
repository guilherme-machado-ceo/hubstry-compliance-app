# ADR-0012: Manter o app gratuito na Vercel Hobby e congelar a cobrança

- **Status:** Aceito
- **Data:** 2026-10-19
- **Decisores:** Guilherme (decisão final), Luna (revisão), Claude (proposta)

## Contexto
- Fundador solo, sem orçamento para despesas recorrentes de infraestrutura e
  sem clientes ou leads próximos da compra (relato do Guilherme, 19/10/2026).
- O app já tem planos, cota de scans (`scansPerMonth`/`scansUsedThisMonth`
  em `api/_server/routers.ts`) e checkout pelo Stripe.
- O ADR-0002 previa migrar para o plano Pro da Vercel antes de qualquer uso
  comercial. O Guilherme decidiu não ter despesa recorrente com hospedagem.

## Decisão
- **O app é gratuito por tempo indeterminado.**
- **A hospedagem continua na Vercel, plano Hobby.** Não contratar o Pro, não
  migrar para o Cloud Run nem para outra plataforma e não abrir consulta à
  Vercel sobre o tema. A hospedagem **não é decisão pendente**.
- **Cobrança congelada.** O código do Stripe, dos planos pagos e da cobrança
  futura fica no repositório, junto com segredos, variáveis e configurações,
  mas não é apagado, ampliado nem recebe investimento. O checkout fica
  desativado na interface **e** no servidor.
- **Cota mensal finita por conta** (limite operacional), para conter abuso e
  consumo de recursos. O acesso é aberto: qualquer pessoa pode se cadastrar
  e usar, sem convite.
- **Prioridade:** manter o que existe funcionando, corrigir problemas
  relevantes e evitar novos custos e trabalho desnecessário. Ordem:
  1. confiabilidade do scan (estado final confiável, sem resultados
     contraditórios nem achados parciais exibidos como concluídos);
  2. modo gratuito (interface, cota finita, checkout desativado);
  3. termos de uso, política de privacidade e exclusão de conta, com as
     pendências de informação e a revisão jurídica concluídas antes de sair
     do rascunho.

## Risco conhecido e aceito
Os termos da Vercel reservam o plano Hobby ao uso pessoal ou não comercial e
definem uso comercial de forma abrangente
([Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines)).
Manter o app na conta Hobby, mesmo sem cobrar dos usuários, não garante, por
si só, conformidade com esses termos. O Guilherme aceita esse risco. Ele
**não** abre projeto de migração nem consulta à Vercel. Se a Vercel se
manifestar ou o uso mudar (por exemplo, cobrança), reavaliar.

## Consequências
- Sem despesa recorrente; o esforço vai para confiabilidade e precisão.
- Sem receita. Retomar a cobrança no futuro exigiria nova decisão (ADR),
  reabrir o checkout e revisar a hospedagem.
- Limitações do Hobby continuam: logs de runtime por 1 hora e limite de
  duração das funções (ver ADR-0002).

## Alternativas consideradas
- **Contratar o Vercel Pro:** descartada; despesa recorrente sem receita.
- **Migrar para o Cloud Run:** descartada; esforço de migração e custo
  incerto, sem necessidade comprovada.
- **"Beta fechado" com convite:** descartada; o app é aberto e gratuito.

## Relação com outros ADRs
Substitui a condição de revisão do ADR-0002 ("migrar para um plano que
permita uso comercial antes do lançamento"). O restante do ADR-0002 (Vercel
como hospedagem) continua válido.

## Revisão
- Se a Vercel contestar o uso no plano Hobby.
- Se houver decisão de cobrar ou mudança relevante de uso ou custo.
