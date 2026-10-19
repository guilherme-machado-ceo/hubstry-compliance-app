# ADR-0012: Operar como beta gratuito e adiar a cobrança

- **Status:** Aceito (hospedagem para o beta externo: pendente)
- **Data:** 2026-10-19
- **Decisores:** Guilherme (decisão final), Luna (revisão), Claude (proposta)

## Contexto
- Fundador solo, sem orçamento para despesas recorrentes de infraestrutura e
  sem clientes ou leads próximos da compra (relato do Guilherme, 19/10/2026).
- O app já tem planos, cota de scans (`scansPerMonth`/`scansUsedThisMonth`
  em `api/_server/routers.ts`) e checkout pelo Stripe, mas a demanda ainda
  não foi validada.
- O ADR-0002 prevê migrar para o plano Pro da Vercel (US$ 20/mês, segundo a
  Luna em 19/10/2026) antes de qualquer uso comercial. Os termos da Vercel
  restringem o plano Hobby a uso pessoal ou não comercial; um beta gratuito
  para validar um produto comercial pode não se enquadrar nessa condição.
  Isso é questão de interpretação dos termos, ainda não esclarecida.

## Decisão
- **Adiar a cobrança.** O produto opera como **"beta gratuito"**, não como
  "sempre grátis": o nome não promete gratuidade permanente.
- **Não contratar o Vercel Pro agora** e não investir em novos recursos de
  pagamento até haver usuários que demonstrem disposição para pagar.
- **Preservar o Stripe.** Código, segredos, variáveis e configurações não
  são apagados; o checkout fica desabilitado na interface **e** no servidor.
- **Cota gratuita generosa, mas finita**, para evitar abuso e consumo
  inesperado de recursos.
- **Prioridades da fase beta, nesta ordem:**
  1. confiabilidade do scan (nenhuma auditoria presa em `pending` nem
     resultado perdido em silêncio);
  2. modo beta (identificação na interface, cota, checkout desligado);
  3. termos de uso, política de privacidade e exclusão de conta, revisados
     antes de convidar usuários externos;
  4. decisão de hospedagem antes de ampliar o acesso externo.
- **Hospedagem comercial: pendente.** O Guilherme pedirá à Vercel
  confirmação por escrito sobre o uso de um beta gratuito no plano Hobby.
  Em paralelo, prepara-se uma estimativa de custo do Cloud Run para o app
  inteiro (frontend, API, cron, tráfego de saída, logs, builds), considerando
  os créditos da GCP. Nenhuma das opções é apresentada como custo zero antes
  dessa verificação, e não há migração até a decisão. Estimativa em
  [`docs/hospedagem/estimativa-cloud-run.md`](../hospedagem/estimativa-cloud-run.md).

## Consequências
- O caixa é preservado e o esforço vai para precisão, confiabilidade e
  aprendizado com usuários.
- Não haverá receita na fase beta; sinais de demanda (uso recorrente,
  pedidos de piloto, conversas sobre preço) decidem quando reativar a
  cobrança.
- Reativar a cobrança não exige reestruturação: basta reabrir o checkout e
  ajustar as cotas por plano.
- Enquanto a hospedagem estiver pendente, o acesso externo fica restrito a
  testes controlados.

## Alternativas consideradas
- **Contratar o Vercel Pro agora:** descartada por falta de orçamento e de
  demanda validada.
- **Migrar já para o Cloud Run:** adiada; falta estimar o custo e definir a
  hospedagem da interface React, não só da API.
- **"Sempre grátis":** descartada; cria uma expectativa difícil de reverter.

## Relação com outros ADRs
O ADR-0002 continua como registro da decisão anterior de hospedagem. Sua
condição de revisão ("migrar para um plano que permita uso comercial antes
do lançamento") segue válida e passa a ser resolvida pela decisão de
hospedagem pendente neste ADR.

## Revisão
- Quando a Vercel responder sobre o uso no plano Hobby ou a estimativa do
  Cloud Run estiver pronta.
- Quando houver sinais concretos de disposição para pagar.
