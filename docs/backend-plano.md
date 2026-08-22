# Backend da EnseadaS — Django + PostgreSQL, arquitetura híbrida

> O plano anterior (site estático + redação via Claude Code) foi executado e está no ar.
> Este plano cobre a próxima etapa: o backend. Primeiro passo da implementação: salvar uma
> cópia deste plano em `docs/backend-plano.md` no repositório, para as sessões futuras.

## Contexto

A EnseadaS é um site 100% estático (Astro **7.2**) no GitHub Pages, operado por skills do
Claude Code que escrevem markdown. Douglas quer o que um site estático não faz sozinho:
**contas de leitor**, **comentários moderados**, **newsletter**, **painel editorial (CMS)** e
**apoio/assinatura paga**. Decisão: arquitetura **híbrida** — a revista continua estática,
rápida e gratuita; um backend Django + PostgreSQL num **VPS próprio** serve só o que exige
servidor, em `api.enseadas.com.br`.

## Decisões fechadas com o Douglas

| Tema | Decisão |
|---|---|
| Usuários | Leitores (site público) **e** redação (painel) |
| Recursos | Comentários · Newsletter · CMS editorial · Apoio/assinatura — todos, em fases |
| Hospedagem | VPS próprio, já contratado (o `~/.ssh/config` tem `oracle-server` e uma chave Hostinger — confirmar qual é, IP e SO na etapa 1G) |
| Arquitetura | Híbrida: Astro estático no GitHub Pages + Django como API/painel |
| Domínio | `enseadas.com.br` já é dele → site em `enseadas.com.br`, API em `api.enseadas.com.br` |
| E-mail transacional | Resend (conta dele; me passa a chave) |

## Fatos conferidos que moldam o plano

- **Cookies entre origens**: site em `jdougdanzi.github.io` + API em outro domínio → o Safari
  do iPhone bloqueia o cookie de sessão (ITP). Site e API no mesmo domínio registrável
  (`enseadas.com.br` / `api.enseadas.com.br`, cookie `Domain=.enseadas.com.br`, `SameSite=Lax`)
  resolve. **A Fase 0 (domínio) é pré-requisito de lançar contas para leitores.**
- `scripts/publicar-site.mjs` **apaga** a `gh-pages` a cada publicação → o `CNAME` do domínio
  tem de viver em `public/`.
- Token do `gh` sem escopo `workflow` → deploy do backend por **SSH**, não por Actions.
- Mac: Python **3.13.5** já instalado (além do 3.14), `uv`, PostgreSQL 17 (Homebrew, parado),
  **sem Docker**. Django 5.2 LTS + Python 3.13 é a combinação mais testada do ecossistema.
- Três textos do site hoje dizem "não temos login/comentários/cadastro" ([BarraLeitor](src/components/BarraLeitor.astro),
  [privacidade](src/pages/privacidade.astro), [salvos](src/pages/salvos.astro)) → reescrever na Fase 1.
- A caixa "Espalhe a boa notícia" (`CaixaDestaque`, na capa e nos cadernos) é o lugar natural do
  formulário de newsletter. A coleção `cartas` (vazia) deixa a porta aberta para "comentário
  vira carta da comunidade".

## Arquitetura

```
leitor ──HTTPS──▶ enseadas.com.br        (GitHub Pages · Astro estático · como hoje)
   │                 └── scripts vanilla TS chamam a API com credentials: 'include'
   └──HTTPS──▶ api.enseadas.com.br       (VPS Ubuntu 24.04 · Docker Compose)
                   ├── Caddy    — TLS automático, proxy reverso, HSTS
                   ├── Django   — gunicorn · Django Ninja · allauth headless · admin /redacao/
                   └── Postgres 17 — volume persistente · pg_dump diário
                                        └──▶ Resend (SMTP) — e-mails de conta e newsletter
```

| Tema | Decisão | Por quê |
|---|---|---|
| Repositório | **Monorepo**: `backend/` dentro de `jdougdanzi/enseadas` | Um só CLAUDE.md e uma só sessão vendo API e cliente; `gh-pages` só recebe `dist/`. Repo é público: segredos só em `.env` (ignorado) e no VPS. |
| Python/Django | **3.13** (`uv python pin 3.13`) + **Django 5.2 LTS** (suporte até 2028) | Já instalado; imagem `python:3.13-slim`; Django 6.x não é LTS (próximo LTS: 6.2, abril/2027). |
| API/auth | **django-allauth (headless)** + **Django Ninja**. Sem DRF. | allauth já entrega cadastro, verificação, reset, rate limit, depois login social e MFA. Ninja: função + schema Pydantic, OpenAPI grátis, `csrf=True`, integração oficial com allauth. ~10 endpoints não justificam DRF. |
| Sessão | Cookie do Django: `SameSite=Lax`, `Domain=.enseadas.com.br`, `Secure`, `HttpOnly` | Same-site para o Safari. Dev: `localhost:4321` ↔ `localhost:8000` compartilham cookie. **Fallback** se o domínio atrasar: allauth em modo `app` (`X-Session-Token`), isolado numa constante do `api.ts`. |
| Banco | PostgreSQL 17 (container no VPS; Homebrew no Mac) | Mesma major nos dois ambientes. |
| Servidor | Docker Compose: `postgres:17-alpine` + Django/gunicorn + `caddy:2-alpine` | Padrão de um servidor só. Local: uv + Postgres do Homebrew, sem Docker. |
| Deploy | `scripts/deploy-backend.sh` por SSH (pull → build → up → migrate → saúde), com "sim" explícito | Mesma filosofia do `/publicar`: o Mac é o ponto de controle. |
| E-mail | Resend via SMTP (backend nativo do Django) | Free: 3.000/mês, 100/dia — sobra para transacional; a newsletter (Fase 2) decide plano. |
| Painel | Django admin em `/redacao/`, pt-BR, com a cara da marca | CMS completo é a Fase 3. |
| Conteúdo | **Fase 1 não toca no pipeline de markdown.** O backend guarda um *espelho* (`conteudo.Materia`) lido de um `conteudo.json` que o build do Astro gera. | Comentário precisa apontar para matéria real; na Fase 3 o espelho vira a fonte da verdade. |

## Fases

| Fase | Entrega visível | Depende de | Esforço |
|---|---|---|---|
| **0 · Domínio** | Revista em `https://enseadas.com.br`; URL antiga redireciona; e-mails `redacao@`/`cartas@` existindo | DNS | 1 sessão |
| **1 · Fundação** | "Entrar / Minha conta"; cadastro com verificação; perfil; exportar/excluir dados; **comentários pré-moderados** ao pé das matérias; caixa "Receba a edição por e-mail" (double opt-in); painel `/redacao/` | Fase 0, VPS, Resend | 6–9 sessões |
| **2 · Newsletter** | Toda sexta, após `/publicar`, a edição vai por e-mail; descadastro em um clique | Fase 1 | 2–3 |
| **3 · CMS** | Postgres vira fonte da verdade; painel edita/aprova/publica; build lê a API; skills gravam via API | Fase 1; `gh auth refresh -s workflow` ou builder no VPS | 8–12 |
| **4 · Apoio** | "Apoie a EnseadaS" (Pix/cartão), recorrência, área de apoiadores | Fase 1; conta Mercado Pago/Stripe | 4–6 |
| **5 · Extras** | Login Google, 2FA no painel, salvos na nuvem, respostas a comentários | Fase 1 | 1–2 cada |

**Este plano detalha as Fases 0 e 1.** As seguintes ganham plano próprio na hora (CMS e
pagamento merecem conversa própria). Tudo sob YAGNI: a Fase 1 fecha com a lista acima.

## Fase 0 — domínio próprio

**DNS** (painel do registro.br ou onde estiver o domínio):

| Nome | Tipo | Valor | Para |
|---|---|---|---|
| `@` | A ×4 | `185.199.108.153`, `.109.153`, `.110.153`, `.111.153` | GitHub Pages |
| `@` | AAAA ×4 | `2606:50c0:8000::153` … `8003::153` | GitHub Pages (IPv6) |
| `www` | CNAME | `jdougdanzi.github.io` | www → apex |
| `api` | A | IP do VPS | backend (Fase 1) |
| — | TXT/CNAME/MX | os que o painel do Resend mostrar (SPF/DKIM/DMARC) | e-mail (Fase 1) |
| — | MX ou redirecionamento | Zoho Mail free / Cloudflare Email Routing → Gmail dele | `redacao@`, `cartas@` |

**Repo**: `public/CNAME` (`enseadas.com.br`); `astro.config.mjs` → `site: 'https://enseadas.com.br'`,
`base: '/'`; [src/lib/url.ts](src/lib/url.ts) (origem padrão); `public/manifest.webmanifest` e
`public/robots.txt` (sem `/enseadas`); `publicar-site.mjs` passa a **recusar** `dist/` sem
`CNAME` (como já faz com `.nojekyll`); URLs em `CLAUDE.md` e na skill `/publicar`.

**Marco**: `dig +short enseadas.com.br` devolve os 4 IPs; `https://enseadas.com.br/` 200 com
cadeado ("Enforce HTTPS" no Pages; verificar o domínio na conta GitHub); URL antiga → 301;
feed/sitemap/OG com URLs novas; crawler de links com zero quebrados; Search Console nova
propriedade (Douglas). Se o domínio atrasar, a Fase 1 segue em dev — mas **não se lança
para leitores no github.io** (trocar o modo de sessão depois derrubaria todo mundo).

## Fase 1 — detalhamento

### Árvore de `backend/`

```
backend/
├── pyproject.toml · uv.lock · .python-version (3.13) · .env.example · manage.py
├── Dockerfile              # python:3.13-slim + uv, `uv sync --frozen --no-dev`, collectstatic, não-root
├── config/
│   ├── settings/ base.py · dev.py · prod.py · test.py
│   ├── urls.py             # /redacao/ (admin) · /_allauth/ · /api/
│   ├── api.py              # NinjaAPI(csrf=True) + routers
│   └── wsgi.py
├── contas/      models · admin · api · schemas · forms (CadastroForm) · adapter · services
│                management/commands/lgpd.py          # exportar <email> | excluir <email> | limpar
├── conteudo/    models · admin · services · management/commands/sincronizar_conteudo.py
├── comentarios/ models · admin · api · schemas · services · management/commands/comentarios.py  # listar | aprovar | rejeitar | limpar
├── newsletter/  models · admin · api · views (form sem JS) · schemas · services · emails
│                management/commands/newsletter.py    # situacao | exportar
├── redacao/     admin_site.py · templates/admin/{base_site,index}.html · static/redacao/admin.css
├── templates/   account/email/ (allauth em pt-BR) · newsletter/email/
├── tests/       conftest.py · test_saude · test_contas · test_comentarios · test_newsletter · test_conteudo · test_seguranca
└── deploy/      compose.yml · Caddyfile · gunicorn.conf.py · backup.sh · vps-setup.sh
```

Raiz do repo: `scripts/deploy-backend.sh`, `scripts/vps.sh` (atalho SSH para `manage.py` /
`compose` / `logs`), `.gitignore` (`backend/.env`, `backend/.venv/`, `backend/staticfiles/`,
`__pycache__/`), scripts no `package.json` (`api`, `api:test`, `deploy-backend`, `vps`).

### Modelos

| App | Modelo | Campos | Regras |
|---|---|---|---|
| contas | `Usuario` (`AUTH_USER_MODEL`, `AbstractBaseUser` + `PermissionsMixin`) | `email` (único, é o login), `nome` (80), `cidade` (60, opcional), `is_active`, `is_staff`, `criado_em`, `consentimento_em`, `consentimento_versao` | Sem `username`. Verificação de e-mail no `EmailAddress` do allauth. Minimização: nada além disso. |
| conteudo | `Materia` | `slug` (único), `titulo`, `linha_fina`, `tipo`, `caderno`, `cidade`, `data`, `edicao`, `url`, `publicada`, `sincronizada_em` | Espelho de `https://enseadas.com.br/conteudo.json`; `publicada=False` quando some do índice (comentários ficam, mas fecham). |
| comentarios | `Comentario` | `materia` FK (PROTECT), `autor` FK (CASCADE), `texto` (≤ 1.000, texto puro), `status` pendente/aprovado/rejeitado, `criado_em`, `moderado_em`, `moderado_por` (SET_NULL), `nota_moderacao` | Índice `(materia, status, criado_em)`. Sem IP no banco. Sem threads (campo `resposta_a` cabe depois). |
| newsletter | `Assinante` | `email` (único), `nome`, `cidade`, `status` pendente/confirmada/cancelada, `origem`, `criado_em`, `confirmada_em`, `cancelada_em`, `consentimento_versao`, `usuario` FK opcional | Tokens **não ficam no banco**: `TimestampSigner` com salt por ação (confirmar vale 48 h; sair não expira). |

### Endpoints

**allauth headless — `/_allauth/browser/v1/`** (cliente só precisa de `credentials: 'include'` + `X-CSRFToken`):

| Método | Rota | Uso |
|---|---|---|
| GET | `config` · `auth/session` | métodos habilitados · sessão atual (200 logado / 401) |
| DELETE | `auth/session` | sair |
| POST | `auth/signup` | `{email, password, nome, cidade?, aceite: true}` → fluxo `verify_email` pendente |
| POST | `auth/login` · `auth/email/verify` · `auth/password/request` · `auth/password/reset` | login · `{key}` do link `/conta/verificar/?key=` · `{email}` · `{key, password}` do link `/conta/redefinir/?key=` |
| POST | `account/password/change` · `auth/reauthenticate` | trocar senha · reautenticar antes de operação sensível |

Campos extras do cadastro via `ACCOUNT_SIGNUP_FORM_CLASS = 'contas.forms.CadastroForm'` —
**conferir no marco 1B** se o headless da versão instalada honra o form; fallback:
`PATCH /api/conta` logo após o cadastro, com `aceite` gravado pelo adapter.

**API própria — Django Ninja, `/api/`** (`csrf=True`):

| Método | Rota | Auth | Contrato |
|---|---|---|---|
| GET | `saude` | público | `{ok, versao, hora}` — deploy e "API fora do ar" no site |
| GET | `csrf` | público | garante o cookie `csrftoken`, devolve `{token}` |
| GET/PATCH | `conta` | sessão | perfil `{email, nome, cidade, email_verificado, criado_em, newsletter}` / `{nome?, cidade?}` |
| GET | `conta/exportar` | sessão | JSON (perfil + comentários + newsletter), `Content-Disposition: attachment` |
| POST | `conta/excluir` | sessão | `{senha}` → apaga comentários, cancela assinante do mesmo e-mail, apaga usuário, encerra sessão → 204 |
| GET | `comentarios?materia=<slug>` | público (sessão opcional) | `{materia, comentarios:[aprovados], meus_pendentes:[…]}` |
| POST | `comentarios` | sessão + **e-mail verificado** | `{materia, texto}` → 201 `{id, status:'pendente'}`; 404 slug desconhecido (após ressincronizar, cache 10 min); 403 despublicada; 429 acima de 5/10 min |
| DELETE | `comentarios/{id}` | autor | 204 |
| POST | `newsletter/inscrever` | público; JSON **e** form-urlencoded (sem JS redireciona para `/newsletter/confirme/`) | `{email, nome?, origem?, site:''}` (honeypot) → **sempre 202**; 5/h por IP; logado com e-mail verificado igual → confirma direto |
| POST | `newsletter/confirmar` · `newsletter/sair` | público | `{token}` → 200 / 400 expirado |

Painel: `/redacao/`. Em dev: `/api/docs` (OpenAPI) e `/_allauth/openapi.html`.

### Configuração

`base.py`: `AUTH_USER_MODEL`; Argon2 primeiro; `pt-br`, `America/Sao_Paulo`, `USE_TZ`;
apps `allauth`, `allauth.account`, `allauth.headless`, `corsheaders`, `ninja` + os cinco;
middleware Security → WhiteNoise → **Cors (antes do Common)** → Session → Common → Csrf →
Auth → Messages → `allauth.account.middleware.AccountMiddleware`; allauth:
`ACCOUNT_USER_MODEL_USERNAME_FIELD = None`, `ACCOUNT_LOGIN_METHODS = {'email'}`,
`ACCOUNT_SIGNUP_FIELDS = ['email*', 'password1*']`, `ACCOUNT_EMAIL_VERIFICATION = 'mandatory'`,
`ACCOUNT_ADAPTER`, rate limits padrão; headless: `HEADLESS_ONLY`, `HEADLESS_CLIENTS = ('browser',)`,
`HEADLESS_FRONTEND_URLS` → `/conta/verificar/?key={key}`, `/conta/redefinir/?key={key}`,
`/conta/cadastro/`; CORS: origens do `.env`, `CORS_ALLOW_CREDENTIALS`, cabeçalhos extras
(`x-csrftoken`, `x-email-verification-key`, `x-password-reset-key`, `x-session-token`);
`CSRF_TRUSTED_ORIGINS`; `CSRF_COOKIE_HTTPONLY = False`; sessão 30 dias; cache `DatabaseCache`
(`createcachetable`; compartilhado entre workers, sem Redis); logs em stdout, sem corpo de requisição.

`prod.py`: `DEBUG=False`; `ALLOWED_HOSTS=['api.enseadas.com.br']`; `SESSION/CSRF_COOKIE_DOMAIN='.enseadas.com.br'`;
`*_COOKIE_SECURE`; `SECURE_PROXY_SSL_HEADER`; HSTS; SMTP `smtp.resend.com:465` (usuário `resend`,
senha = API key); `DEFAULT_FROM_EMAIL = 'EnseadaS <revista@enseadas.com.br>'`; `ADMINS` = Douglas.
`dev.py`: `DEBUG`; hosts `localhost`, `127.0.0.1` e IP da LAN (iPhone); e-mail no console;
origens `http://localhost:4321` etc.; cookies sem `Secure`/`Domain`.

`.env` (VPS, `chmod 600`): `DJANGO_SETTINGS_MODULE`, `SECRET_KEY`, `DATABASE_URL`,
`POSTGRES_PASSWORD`, `SITE_URL`, `ORIGENS_SITE`, `API_HOST`, `EMAIL_HOST_PASSWORD`,
`DEFAULT_FROM_EMAIL`, `ADMIN_EMAIL`. `.env.example` documenta cada uma.

Astro: `astro.config.mjs` ganha `env.schema.PUBLIC_API_URL` (client/public; default
`http://localhost:8000` em dev, `https://api.enseadas.com.br` em produção).

### VPS: compose, Caddy, hardening, backup

| Serviço | Imagem | Essencial |
|---|---|---|
| `db` | `postgres:17-alpine` | volume `pgdata`; healthcheck `pg_isready`; **sem `ports:`** (porta publicada pelo Docker ignora o ufw) |
| `api` | build `backend/Dockerfile` | `env_file: .env`; gunicorn 2 workers, timeout 30, `forwarded_allow_ips='*'`; só `expose: 8000`; logs json-file 10m×5 |
| `caddy` | `caddy:2-alpine` | 80/443(+udp); `Caddyfile` ro; volumes `caddy_data`/`caddy_config`; `restart: unless-stopped` em todos |

`Caddyfile`: `api.enseadas.com.br { encode zstd gzip; header HSTS / nosniff / Referrer-Policy; -Server; reverse_proxy api:8000; log com rotação 7 dias }` — TLS automático (o `A api` precisa existir antes).

`vps-setup.sh` (uma vez, root): `apt upgrade`; usuário `deploy` (sudo + docker) com a chave do Mac;
`sshd` sem senha e sem root; `ufw` (SSH/80/443); `fail2ban`; `unattended-upgrades`; Docker +
compose; `git clone` do repo público em `/srv/enseadas`; `backend/.env`; `compose up -d`;
`migrate`, `createcachetable`, `createsuperuser`; cron do backup; fuso `America/Sao_Paulo`.

Backups (`backup.sh`, cron 03:30): `pg_dump -Fc` → `/srv/backups/`, retenção 14; `rclone copy`
para B2 (10 GB grátis) ou Google Drive quando configurado; `scripts/backup-backend.sh` traz a
cópia para o Mac; restauração documentada (`pg_restore --clean --if-exists`) e **ensaiada**.
Snapshot do provedor, se houver, ligado também.

### Setup local e deploy

```bash
brew services start postgresql@17 && createuser -s enseadas; createdb -O enseadas enseadas
cd backend && uv python pin 3.13 && uv sync && cp .env.example .env
uv run manage.py migrate && uv run manage.py createcachetable && uv run manage.py createsuperuser
uv run manage.py runserver 8000      # ou npm run api   ·   testes: uv run pytest / npm run api:test
```
iPhone na LAN: `npm run dev -- --host`, `runserver 0.0.0.0:8000`, `PUBLIC_API_URL=http://<ip>:8000`.

`scripts/deploy-backend.sh` (host do `~/.ssh/config`, alias `enseadas-vps`): pré-checagem local
(`pytest`, `check --deploy`, `git status` limpo, `main` empurrada) → SSH: `git pull --ff-only`,
`compose build api`, `backup.sh` **antes** de migrar, `up -d`, `migrate --noinput`,
`check --deploy` → `curl /api/saude` mostra a versão (commit curto). Falha: para, imprime
`logs --tail 100`; rollback = checkout do commit anterior + build/up. Subir backend não
republica o site, e vice-versa.

### Mudanças no site (Astro)

**Novos**

| Arquivo | O quê |
|---|---|
| `src/lib/api.ts` | cliente único: `PUBLIC_API_URL`, `credentials: 'include'`, `X-CSRFToken` (cookie ou `GET /api/csrf`), timeout 6 s, erros tipados, detecção "API indisponível"; modo token atrás de uma constante (fallback) |
| `src/lib/sessao.ts` | `obterSessao()` (uma chamada por página) + evento `enseadas:sessao` |
| `src/components/LinkConta.astro` | "Entrar" estático (funciona sem JS) → script troca por "Minha conta · Nome"; entra na `linha-topo` do Masthead e ao lado da data no HeaderCompacto |
| `src/components/Comentarios.astro` | lista (texto puro, nome · cidade · data) + formulário (contador 1.000, "Enviar para moderação"); estados: carregando / vazio / API fora / não logado (`?proximo=`) / não verificado (reenviar) / "aguarda moderação"; `<noscript>` explica; estilo de fios, sem sombra |
| `src/components/CaixaNewsletter.astro` | substitui o conteúdo padrão da `CaixaDestaque` (capa e cadernos): e-mail, honeypot, consentimento com link para `/privacidade/`; `<form method="post">` funciona sem JS; WhatsApp continua menor abaixo |
| `src/styles/formularios.css` | campos, botões, mensagens — sem raio, sem sombra, fio `--fio`, foco `--azul` |
| `src/pages/conta/{index,entrar,cadastro,verificar,senha,redefinir}.astro` | minha conta (editar, newsletter, meus comentários, baixar dados, excluir com senha, sair) e fluxos; todas `semIndexacao` |
| `src/pages/newsletter/{index,confirme,confirmar,sair}.astro` | assinatura, "confira seu e-mail", confirmação via `?t=`, descadastro |
| `src/pages/termos.astro` | termos da conta e regras dos comentários (pré-moderação, prazos) |
| `src/pages/conteudo.json.ts` | índice gerado no build (`getMaterias()` + edições publicadas): `{geradoEm, edicoes[], materias[{slug, titulo, linhaFina, tipo, caderno, cidade, data, edicao, url}]}` — o que o backend sincroniza |

**Alterados**: `astro.config.mjs` (env schema); `src/lib/url.ts` (rotas conta/entrar/cadastro/
newsletter/termos); `BarraLeitor.astro` ("Comente abaixo ou mande sua carta", âncora
`#comentarios`); `CaixaDestaque`/`CapaEdicao`/`caderno/[slug]` (caixa vira newsletter;
`destaqueLateral` da edição mantém prioridade); `Masthead`/`HeaderCompacto` (LinkConta);
`Rodape` (Minha conta, Newsletter, Termos); `materia/[slug].astro` (`<Comentarios>` entre
BarraLeitor e LeiaTambem); `privacidade.astro` (reescrita: conta, comentários, newsletter,
operadores GitHub/VPS/Resend com transferência internacional, cookies, direitos, encarregado =
Douglas); `contato.astro` e `salvos.astro` (textos); `.claude/launch.json` (config `api`).

**Degradação**: sem JS ou API fora, a revista é idêntica à de hoje mais um link "Entrar" e
uma caixa de newsletter que posta direto (sem JS) ou avisa "indisponível agora". Nada bloqueia
a leitura; nada mostra número inventado.

### Testes (pytest-django, Postgres local)

| Arquivo | Cobre |
|---|---|
| `test_saude` | `/api/saude` 200; `/redacao/` exige staff; `/admin/` não existe |
| `test_contas` | cadastro → inativo até verificar; e-mail pt-BR com link certo; verificar → sessão; senha errada ×N → 429; reset ponta a ponta; `PATCH conta`; `exportar` completo; `excluir` apaga tudo e exige senha; consentimento gravado |
| `test_comentarios` | anônimo vê só aprovados; 401 / 403 não verificado / 404 slug (e ressincronizou) / 403 despublicada / 422 vazio ou > 1.000 / 429 no 6º; autor vê os próprios pendentes; `aprovar` preenche `moderado_*`; DELETE só autor |
| `test_newsletter` | 202 + pendente + e-mail; repetido → 202 sem duplicar; honeypot → 202 sem registro; confirmar; token expirado → 400; sair; form-urlencoded → redirect; logado verificado confirma direto; rate limit |
| `test_conteudo` | `sincronizar_conteudo` de uma fixture: cria, atualiza, despublica o que sumiu; idempotente |
| `test_seguranca` | POST sem CSRF → 403; CORS só para origens da lista, com credenciais; cookies `HttpOnly`/`Lax`; `check --deploy` limpo |

Frontend: `npm run check` + roteiro manual dos marcos (Playwright fica para depois).

### Etapas e marcos verificáveis

| Etapa | Entrega | Verificação |
|---|---|---|
| **1A Esqueleto** | settings por ambiente, `Usuario`, admin `/redacao/` pt-BR, `/api/saude`, pytest, Dockerfile | `curl localhost:8000/api/saude`; login no admin; `uv run pytest` |
| **1B Auth** | allauth headless, e-mails pt-BR, `CadastroForm`, `/api/conta/*`, LGPD | fluxo por `curl`: signup → link no console → verify → session 200; `test_contas` |
| **1C Site + login** | `api.ts`, `sessao.ts`, `LinkConta`, `/conta/*`, `formularios.css` | navegador: cadastrar, verificar, "Minha conta · Nome" na capa e numa matéria, sair, reset; **iPhone pela LAN** |
| **1D Comentários** | `conteudo.json`, espelho + sincronização, `Comentario`, API, widget, admin com ações | comentar → "aguardando"; aprovar no admin → aparece para anônimo; rejeitar → some; rate limit; sem JS: aviso, página íntegra |
| **1E Newsletter** | `Assinante`, API (JSON e form), `CaixaNewsletter`, `/newsletter/*`, e-mails | inscrever na capa → e-mail → confirmar → `confirmada` no admin; sair; form sem JS |
| **1F Textos e LGPD** | privacidade, termos, contato, salvos, BarraLeitor; checklist abaixo | leitura com o Douglas; links do cadastro certos |
| **1G VPS** | `vps-setup.sh`, compose, Caddy, `.env`, backup cron, `deploy-backend.sh` | `https://api.enseadas.com.br/api/saude` com cadeado; `check --deploy` limpo; SSH só por chave; `ufw status`; `backup.sh` à mão e restauração em `enseadas_teste` |
| **1H Produção** | site com `PUBLIC_API_URL` de produção; Resend verificado | **iPhone Safari no domínio real**: cadastro, e-mail real (`dkim=pass`), login, comentário, fechar/reabrir o Safari (sessão persiste), moderar pelo celular; desktop Chrome/Firefox; `curl` de origem estranha sem CORS |
| **1I Operação** | skills `/moderar`, `/deploy-backend`, `/publicar` atualizado, `CLAUDE.md`, `settings.json` | `/moderar` ponta a ponta; `/deploy-backend` com mudança trivial |

O `/publicar` termina com `scripts/vps.sh manage sincronizar_conteudo`; o backend também
ressincroniza sob demanda — um esquecimento não quebra comentários.

### Checklist de segurança e LGPD (critério de aceite)

**Segurança**: `.env` fora do git (deploy script confere `git ls-files`); cookies
`Secure`/`HttpOnly`/`Lax`; CSRF nos POSTs; CORS com credenciais só para o site; Argon2; rate
limits do allauth + `django-ratelimit` (comentários, newsletter); admin em `/redacao/`, só
Douglas é staff, 2FA na Fase 5; comentário é texto puro (nunca `innerHTML`), sem links
clicáveis, pré-moderado; VPS com SSH por chave, `ufw`, `fail2ban`, atualizações automáticas,
banco sem porta publicada, HSTS, `check --deploy` limpo; backups diários + cópia externa +
restauração ensaiada; `uv.lock` travado (upgrade só em sessão dedicada).

**LGPD**: base legal e finalidade por dado (conta: execução de serviço; newsletter:
consentimento com versão e data; comentários: nome e cidade públicos, dito no cadastro);
direitos pelo próprio site (exportar, excluir) + `manage.py lgpd` para pedidos por e-mail;
minimização (sem IP no banco; logs 7 dias; sem rastreio em e-mails); retenção (pendentes sem
moderação há 90 dias apagados; contas nunca verificadas em 30 dias apagadas); operadores
nomeados na política (GitHub, VPS, Resend); política e termos versionados
(`consentimento_versao`); encarregado: Douglas, pelo e-mail da redação.

## Operação (para o Claude Code continuar sozinho)

| Skill | O que faz |
|---|---|
| `/moderar` (nova) | lista pendentes via `scripts/vps.sh manage comentarios listar`; para cada um, Douglas aprova/rejeita **um a um**; nunca edita texto de leitor |
| `/deploy-backend` (nova) | `pytest` → `check --deploy` → diff do `backend/` → pergunta literal "Subir o backend? (sim/não)" → push → `deploy-backend.sh` → `/api/saude` |
| `/leitores` (opcional) | só números agregados; **nunca lista e-mails** sem pedido explícito e finalidade |
| `/publicar` (alterada) | URLs do domínio novo; sincroniza o conteúdo no fim |
| `/revisar` (alterada) | prévia confere widget de comentários e caixa de newsletter (API local pelo `launch.json`) |

`CLAUDE.md`: seção "Backend" (o que é, ciclo, comandos, ambientes, `.env`) e regras duras
novas — **8. Dados de leitor são sagrados** (não listar/exportar e-mails sem finalidade; nunca
colar dados de leitor em commits ou prévias); **9. `.env` nunca entra no git; migração
destrutiva exige backup e "sim"**; **10. Nunca `docker compose down -v`**.
`.claude/settings.json`: allow para `npm run api*`, `pytest`, `manage.py check/migrate` local,
`vps.sh manage comentarios listar`, `vps.sh ps/logs`; ask para `vps.sh` (resto),
`deploy-backend.sh`, `ssh`, `uv lock`; deny para `compose down`, `down -v`, `manage.py flush`.

## Pré-requisitos que dependem do Douglas

| Quando | O quê |
|---|---|
| Antes de tudo | Acesso ao DNS do `enseadas.com.br` (ou aplicar os registros que eu passar) |
| Semana 1 | **VPS**: qual é (Hostinger? Oracle?), IP, chave SSH, sistema — assumo Ubuntu 24.04, 2 GB bastam (4 GB se o builder da Fase 3 morar lá) |
| Semana 1 | **Resend**: criar conta, adicionar o domínio, criar a chave `enseadas-api`, colar os registros DNS; remetente `revista@enseadas.com.br` |
| Semana 1 | Caixa de e-mail para `redacao@`/`cartas@` (Zoho free, Workspace ou redirecionamento) |
| Marco 1G | Destino dos backups (B2 grátis / Google Drive via rclone) ou snapshot do provedor |
| Marco 1H | 15 minutos com o iPhone; aprovação dos textos de privacidade e termos |
| Fase 2 | Se > ~90 assinantes: plano pago do Resend ou SES |
| Fase 3 | `gh auth refresh -s workflow` + PAT fine-grained (se o build for por Actions) |
| Fase 4 | Conta Mercado Pago e/ou Stripe; CPF vs CNPJ (tema do contador) |

## Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Safari bloqueia cookie entre domínios | Fase 0 obrigatória; teste real no iPhone é marco; fallback token isolado no `api.ts`; nunca lançar no github.io |
| `CNAME` some da `gh-pages` | Em `public/`; `publicar-site.mjs` recusa `dist/` sem ele |
| Headless não honra campos extras | Conferido no 1B; fallback `PATCH /api/conta` + adapter |
| Spam em comentários/newsletter | Verificação, rate limit, honeypot, limite, sem links, pré-moderação; Turnstile só se precisar |
| E-mail no spam | Nunca SMTP direto; Resend + SPF/DKIM/DMARC; testar Gmail e iCloud |
| VPS cai | Site continua; widgets somem com aviso; ping externo grátis (UptimeRobot) avisa o Douglas |
| Perda do banco | pg_dump diário + cópia externa + ensaio; snapshot |
| Segredo vazar (repo público) | `.env` só no VPS/Mac; script confere; chaves geradas no servidor; rotação documentada |
| Admin exposto | `/redacao/`, senha forte, rate limit, HTTPS, 2FA na Fase 5 |
| Migração destrutiva | backup antes do `migrate` no deploy; regra no CLAUDE.md |
| Escopo inflar (threads, likes, avatar) | Fase 1 fecha com a lista acima; extras na Fase 5 |

## Fases seguintes (resumo — cada uma terá seu plano)

- **2 · Newsletter**: `conteudo.Edicao` + `newsletter.Envio`; template de e-mail (tabelas,
  CSS inline) com manchete, laterais, linha inferior e editorial; `List-Unsubscribe`; comando
  `newsletter enviar --edicao N [--teste]` em lotes; sem pixel de abertura; skill `/newsletter`
  (prévia → teste → "sim" → envio → relatório). Limite de 100/dia do Resend free: até ~90
  confirmados fica; acima, Resend Pro (US$ 20/mês) ou SES — trocar é mudar `.env`.
- **3 · CMS**: **Postgres vira a fonte da verdade** (descartada a opção "painel commita
  markdown no GitHub": conflitos, binários, validação tardia). Modelos completos `Materia`,
  `Edicao`, `Foto`, `Fonte`, `Revisao`; `TokenRedacao` para as skills; `/api/redacao/*`
  (CRUD, aprovar, fechar, publicar) e `/api/conteudo/exportar`; loader `src/loaders/enseadas.ts`
  substitui o `glob` mantendo o schema zod (páginas não mudam); `importar_markdown` (uma vez)
  e `exportar_markdown` noturno (backup e `grep`); "Publicar" dispara o build via
  `repository_dispatch` (exige `workflow` scope + PAT) ou um serviço `builder` no compose que
  faz push na `gh-pages`; skills continuam escrevendo markdown em `redacao/rascunhos/` e
  enviam com `scripts/redacao.mjs enviar`. Atalho se a fase atrasar: Decap CMS (git-backed)
  só para corrigir textos pelo celular.
- **4 · Apoio**: começar pelo **apoio avulso via Pix no Mercado Pago** (público local conhece;
  o Pix do Stripe só libera após 60 dias processando); recorrência depois (Mercado Pago se Pix
  recorrente importar; Stripe se a prioridade for cartão + portal). Modelos `Apoio` e
  `Assinatura`; webhook com verificação de assinatura; recibo por e-mail. Aviso ao Douglas:
  "conteúdo exclusivo" num site estático só é real se vier da API — gating só no cliente é
  decorativo.
- **5 · Extras**: login Google (`allauth.socialaccount`; projeto no Google Cloud do Douglas);
  2FA TOTP obrigatório para staff (`allauth.mfa`); `Salvo` (usuário, slug) com fusão do
  `localStorage`; respostas a comentários; comentário aprovado marcado como "carta da comunidade".

## Verificação end-to-end (Fase 1 concluída)

1. `uv run pytest` verde; `npm run check` e `npm run build` verdes; crawler de links zero quebrados.
2. Roteiro local completo (1C–1E) no Chrome e **no iPhone pela LAN**.
3. VPS: `deploy-backend.sh` limpo; `check --deploy` sem avisos; backup gerado e restaurado.
4. Produção no domínio real: cadastro → e-mail com `dkim=pass` → verificação → comentário →
   moderação no `/redacao/` → aparece para anônimo; newsletter double opt-in; exclusão de conta
   anonimiza; sessão persiste ao fechar o Safari; origem estranha sem CORS; site continua
   íntegro com a API derrubada de propósito (`compose stop api`) e volta sozinho.
