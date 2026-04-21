# Local Setup

> **AVISO DE SEGURANÇA:** `BYPASS_AUTH=true` é **exclusivo de desenvolvimento local**.
> Nunca configure esta variável no Vercel, Railway, Heroku ou qualquer ambiente de
> staging/produção. Em produção, o servidor lança erro fatal se detectar `BYPASS_AUTH=true`.

## Quick Start (BYPASS_AUTH — sem OAuth)

```bash
pnpm install
pnpm db:setup:dev        # cria dev.db com seed
pnpm dev                 # usa .env.development com BYPASS_AUTH=true
```

Acesse `http://localhost:5173` — dashboard carrega diretamente como `dev@hubstry.local`.

---

## Configurando GitHub OAuth (Login Real)

1. Acesse: github.com → Settings → Developer settings → OAuth Apps → **New OAuth App**
2. Preencha:
   - **Application name**: `Hubstry Compliance (Dev)`
   - **Homepage URL**: `http://localhost:5173`
   - **Authorization callback URL**: `http://localhost:3001/api/oauth/callback`
3. Clique em **Register application**
4. Copie o **Client ID** e gere um **Client Secret**
5. Adicione em `.env.development` (ou crie `.env.local` para não commitar):
   ```env
   GITHUB_CLIENT_ID=seu_client_id
   GITHUB_CLIENT_SECRET=seu_client_secret
   BYPASS_AUTH=false
   ```
6. Reinicie: `pnpm dev`
7. Acesse `http://localhost:5173` e clique em **Entrar**

Após o login, o usuário é criado no banco com `loginMethod: "github"`.
