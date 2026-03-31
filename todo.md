# Hubstry Compliance - TODO

## Fase 1: Banco de Dados e Esquema
- [x] Criar tabelas: audits, scan_results, violations, user_subscriptions
- [x] Definir relacionamentos entre tabelas
- [x] Executar migrações SQL

## Fase 2: Landing Page
- [x] Design elegante com hero section
- [x] Seção de benefícios (ISO, LGPD, ética digital)
- [x] Pricing cards com planos (Free, Pro, Enterprise)
- [x] CTAs para registro e login
- [x] Rodapé com links

## Fase 3: Autenticação e Dashboard
- [x] Integrar OAuth Manus
- [x] Criar página de dashboard do usuário
- [x] Histórico de auditorias com filtros
- [x] Estatísticas de conformidade
- [x] Navegação e layout do app

## Fase 4: Scanner de URLs
- [x] Implementar scanner backend (dark patterns, autoplay, infinite scroll, rastreadores, lootboxes, privacidade)
- [x] Validação de URLs
- [x] Limite de scans por plano
- [x] Fila de processamento de scans (async)
- [x] Armazenamento de resultados

## Fase 5: Relatórios Detalhados
- [x] Página de relatório com violações encontradas
- [x] Elementos problemáticos identificados
- [x] Recomendações de correção
- [x] Score de conformidade
- [ ] Comparação com padrões ISO/LGPD (em progresso)

## Fase 6: Integração Stripe
- [x] Configurar Stripe API
- [x] Criar checkout para planos Pro e Enterprise
- [x] Gerenciar subscrições
- [x] Atualizar limites de scans por plano
- [ ] Webhook de pagamento (em progresso)

## Fase 7: PDF e Notificações
- [ ] Exportar relatórios em PDF
- [ ] Sistema de notificação ao owner (novos usuários, upgrades)
- [ ] Email de confirmação de registro
- [ ] Notificação de scan completado

## Fase 8: Testes e Deploy
- [x] Testes unitários (vitest) - 10/10 testes passando
- [ ] Testes de integração
- [ ] Validação de fluxos
- [ ] Deploy no Vercel
- [ ] Configuração de domínio customizado
