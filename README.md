# 🛡️ Hubstry Compliance - Scanner de Conformidade Digital

Uma plataforma elegante e profissional para auditar sites e verificar conformidade com padrões de ética digital, LGPD e ISO.

## 🎯 Funcionalidades

### Scanner de Conformidade
- ✅ Detecção de **dark patterns** (roach motel, misdirection)
- ✅ Detecção de **autoplay** em vídeos
- ✅ Detecção de **infinite scroll**
- ✅ Detecção de **rastreadores de anúncios**
- ✅ Detecção de **lootboxes**
- ✅ Verificação de **políticas de privacidade**
- ✅ Verificação de **age verification** para conteúdo infantil

### Dashboard
- 📊 Histórico completo de auditorias
- 📈 Score de conformidade por site
- 🔍 Detalhes de cada violação encontrada
- 💾 Armazenamento seguro de resultados

### Monetização
- 🆓 Plano Free: 3 scans/mês
- 💎 Plano Pro: Scans ilimitados + PDF
- 🏢 Plano Enterprise: API access + suporte prioritário
- 💳 Integração com Stripe para pagamentos

## 🚀 Deploy no Vercel

### Pré-requisitos
- Conta no [Vercel](https://vercel.com)
- Conta no [GitHub](https://github.com)
- Banco de dados MySQL (recomendado: [PlanetScale](https://planetscale.com))
- Chaves Stripe (recomendado: [Stripe Dashboard](https://dashboard.stripe.com))

### Passo 1: Conectar GitHub ao Vercel

1. Acesse https://vercel.com/dashboard
2. Clique em **"Add New..."** → **"Project"**
3. Selecione **"Import Git Repository"**
4. Procure por `hubstry-compliance-app`
5. Clique em **"Import"**

### Passo 2: Configurar Variáveis de Ambiente

No Vercel, adicione as seguintes variáveis de ambiente:

```env
# Database
DATABASE_URL=mysql://user:password@host/database

# JWT & Session
JWT_SECRET=sua_chave_secreta_min_32_caracteres

# OAuth Manus
VITE_APP_ID=seu_app_id_manus
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=seu_owner_id
OWNER_NAME=Seu Nome

# Stripe
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publica
STRIPE_PRICE_PRO=price_pro_id
STRIPE_PRICE_ENTERPRISE=price_enterprise_id

# APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=sua_chave_forge
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=sua_chave_frontend_forge

# App
VITE_APP_TITLE=Hubstry Compliance
VITE_APP_LOGO=https://seu-logo.com/logo.png
```

### Passo 3: Deploy

1. Clique em **"Deploy"**
2. Vercel fará o build automaticamente
3. Seu app estará online em minutos!

### 🔄 Deploy Automático

Cada vez que você fizer `git push` no repositório, o Vercel fará deploy automático!

## 🛠️ Desenvolvimento Local

### Instalação

```bash
# Clonar repositório
git clone https://github.com/seu-usuario/hubstry-compliance-app.git
cd hubstry-compliance-app

# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Editar .env.local com suas credenciais
```

### Executar Localmente

```bash
# Iniciar servidor de desenvolvimento
pnpm dev

# Acessar em http://localhost:3000
```

### Testes

```bash
# Executar testes unitários
pnpm test

# Executar com cobertura
pnpm test -- --coverage
```

### Build para Produção

```bash
# Build
pnpm build

# Iniciar servidor de produção
pnpm start
```

## 📁 Estrutura do Projeto

```
hubstry-compliance-app/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas (Home, Dashboard, Pricing, etc)
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── lib/           # Utilitários (tRPC client)
│   │   └── App.tsx        # Roteamento principal
│   └── public/            # Arquivos estáticos
├── server/                 # Backend Express + tRPC
│   ├── routers.ts         # Definição de procedures tRPC
│   ├── db.ts              # Queries do banco de dados
│   ├── scanner.ts         # Lógica de scanner de conformidade
│   ├── stripe-router.ts   # Procedures Stripe
│   └── stripe-webhook.ts  # Handler de webhooks Stripe
├── drizzle/               # Schema e migrations do banco
├── package.json           # Dependências
└── vercel.json            # Configuração Vercel
```

## 🔐 Segurança

- ✅ Variáveis de ambiente nunca são commitadas
- ✅ Chaves Stripe nunca são expostas no frontend
- ✅ OAuth Manus para autenticação segura
- ✅ Webhooks Stripe verificados com assinatura
- ✅ Proteção de procedures com `protectedProcedure`

## 📊 Arquitetura

### Stack Tecnológico

- **Frontend**: React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend**: Express 4 + tRPC 11
- **Banco de Dados**: MySQL + Drizzle ORM
- **Autenticação**: OAuth Manus
- **Pagamentos**: Stripe
- **Deploy**: Vercel

### Fluxo de Dados

```
User → Frontend (React) → tRPC Client
                           ↓
                    tRPC Router (Express)
                           ↓
                    Database (MySQL)
                           ↓
                    Scanner Backend
                           ↓
                    Stripe API (pagamentos)
```

## 🧪 Testes

O projeto inclui testes unitários com Vitest:

```bash
# Testes do scanner
pnpm test server/scanner.test.ts

# Testes de autenticação
pnpm test server/auth.logout.test.ts

# Todos os testes
pnpm test
```

## 🐛 Troubleshooting

### Erro: "Database connection failed"
- Verifique se `DATABASE_URL` está correto
- Certifique-se de que o banco está acessível
- Teste a conexão: `mysql -u user -p -h host database`

### Erro: "Stripe webhook failed"
- Verifique se `STRIPE_WEBHOOK_SECRET` está correto
- Confirme que o endpoint `/api/stripe/webhook` está registrado no Stripe Dashboard
- Verifique os logs no Stripe Dashboard → Developers → Webhooks

### Erro: "OAuth callback failed"
- Verifique se `VITE_APP_ID` está correto
- Confirme que o redirect URI está registrado no Manus
- Teste o fluxo de login em modo incógnito

## 📝 Roadmap

- [ ] Exportação de relatórios em PDF
- [ ] Notificações por email
- [ ] API pública para integração
- [ ] Dashboard de analytics
- [ ] Suporte a múltiplos idiomas
- [ ] Mobile app

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 📧 Contato

Para suporte ou dúvidas, entre em contato:
- Email: guilhermemachado@hubstry.onmicrosoft.com

## 🔄 Plano de Upgrade do Repositório

### Curto Prazo (1-2 meses)
- [ ] Melhorar cobertura de testes (target: 80%)
- [ ] Implementar logging centralizado
- [ ] Adicionar monitoramento de erros em produção
- [ ] Documentação de API tRPC

### Médio Prazo (3-6 meses)
- [ ] Migração para TypeScript strict mode
- [ ] Refatoração de componentes React para padrões mais modernos
- [ ] Implementação de cache distribuído
- [ ] Dashboard de administração
- [ ] Relatórios de conformidade em PDF

### Longo Prazo (6+ meses)
- [ ] API pública REST para integrações
- [ ] Suporte a múltiplos idiomas
- [ ] Mobile app (iOS/Android)
- [ ] Sistema de notifications em tempo real
- [ ] Machine learning para detecção de padrões
- [ ] CLI para auditorias automatizadas

---

**Desenvolvido com ❤️ para conformidade digital**
