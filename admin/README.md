# Itaú Calculadora — Admin

Painel administrativo separado para o `itau-calculadora`.

## Regras de arquitetura

- Deploy **somente** em subdomínio administrativo (ex.: `admin.seudominio.com`).
- **Nunca** publicar este painel em rota de path como `seudominio.com/admin`.
- Proteger o projeto com **Cloudflare Access** antes de abrir ao uso.

## Variáveis recomendadas

- `ADMIN_ALLOWED_EMAILS` (opcional): lista separada por vírgula de e-mails autorizados.
  - Exemplo: `admin@empresa.com,financeiro@empresa.com`

## Endpoints

- `GET /api/admin/overview`
- `GET /api/admin/parametros`
- `POST /api/admin/parametros`

Todos os endpoints exigem headers de autenticação do Cloudflare Access.

## Operação em produção (padrão do repositório)

- **GitHub branch:** `main`
- **Cloudflare Pages branch de produção:** `production`
- **Pipeline:** `.github/workflows/deploy.yml` (job único para admin + app principal)

### 1) Criar/ajustar projeto Pages do admin via Wrangler (CLI)

No diretório do admin:

```bash
cd admin
npx wrangler login
npx wrangler pages project create itau-calculadora-admin --production-branch production
npx wrangler pages project list
```

Se o projeto já existir, confirme no `project list` e siga com o deploy automático via CI.

### 2) Deploy automático no GitHub Actions (job único)

O workflow existente em `.github/workflows/deploy.yml` publica:

1. `admin/public` → projeto `itau-calculadora-admin` (branch `production` no Pages)
2. `public` (app principal) → projeto `itau-calculadora` (branch `production` no Pages)

Secrets necessários no repositório:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

### 3) Variável opcional `ADMIN_ALLOWED_EMAILS`

Use para restringir acesso administrativo por e-mail, além do Cloudflare Access.

Formato:

```text
admin@empresa.com,financeiro@empresa.com
```

Comportamento:

- Se definida: apenas e-mails da lista são autorizados.
- Se não definida: qualquer usuário autenticado no Cloudflare Access pode acessar o admin.
