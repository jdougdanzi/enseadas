"""
Configuração comum a todos os ambientes.

O que muda entre dev e produção (domínios, cookies, e-mail) fica em dev.py e
prod.py — aqui só o que vale sempre.
"""

from pathlib import Path

import environ

RAIZ = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
environ.Env.read_env(RAIZ / ".env")

SECRET_KEY = env("SECRET_KEY")
DEBUG = False

DATABASES = {"default": env.db("DATABASE_URL")}
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Endereços do site que consome esta API (origem exata, sem barra final).
# Defaults de desenvolvimento. Em produção, prod.py recusa subir com eles
# — senão os e-mails sairiam com link para localhost e o site real seria
# recusado por CORS, sem nenhum aviso.
SITE_URL = env("SITE_URL", default="http://localhost:4321")
ORIGENS_SITE = env.list("ORIGENS_SITE", default=["http://localhost:4321"])

INSTALLED_APPS = [
    "redacao.apps.RedacaoAdminConfig",  # substitui o admin padrão
    "redacao.apps.RedacaoConfig",  # templates e static do painel
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "allauth",
    "allauth.account",
    "allauth.headless",
    "contas",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    # CorsMiddleware precisa vir antes do CommonMiddleware.
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [RAIZ / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

AUTH_USER_MODEL = "contas.Usuario"

# Argon2 primeiro: é o recomendado pelo Django para senhas novas.
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
    "django.contrib.auth.hashers.ScryptPasswordHasher",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 8},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# Só o backend do allauth: ele herda do ModelBackend e, com login por
# e-mail, também atende o formulário do painel. Com os dois na lista, cada
# senha errada custava dois cálculos de Argon2 (70 ms e 200 MiB por tentativa).
AUTHENTICATION_BACKENDS = [
    "allauth.account.auth_backends.AuthenticationBackend",
]

LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = RAIZ / "staticfiles"
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

# Cache no próprio banco: compartilhado entre os workers do gunicorn, sem Redis.
CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.db.DatabaseCache",
        "LOCATION": "cache_enseadas",
    }
}

SESSION_COOKIE_NAME = "enseadas_sessao"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
SESSION_COOKIE_AGE = 60 * 60 * 24 * 30  # 30 dias

CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_HTTPONLY = False  # o script do site precisa ler para mandar no cabeçalho
CSRF_TRUSTED_ORIGINS = ORIGENS_SITE

CORS_ALLOWED_ORIGINS = ORIGENS_SITE
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = (
    "accept",
    "authorization",
    "content-type",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
    "x-email-verification-key",
    "x-password-reset-key",
    "x-session-token",
)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {"simples": {"format": "{levelname} {asctime} {name} {message}", "style": "{"}},
    "handlers": {"console": {"class": "logging.StreamHandler", "formatter": "simples"}},
    "loggers": {
        # O Django registra todo 4xx como WARNING. O allauth responde 401 para
        # cada visita anônima que pergunta se há sessão — e para um cadastro
        # bem-sucedido com verificação pendente. Sem isto, o log de produção
        # vira ruído e expulsa os erros de verdade da janela de rotação.
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
}


# ---------------------------------------------------------------------------
# Contas (django-allauth em modo headless)
#
# Headless: o allauth não serve página nenhuma — só JSON. Quem desenha as telas
# é o site em Astro; os links dos e-mails apontam para lá (HEADLESS_FRONTEND_URLS).
# ---------------------------------------------------------------------------

ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_LOGIN_METHODS = {"email"}
ACCOUNT_SIGNUP_FIELDS = ["email*", "password1*"]

# Ninguém comenta sem confirmar o e-mail: é o que segura robô e e-mail alheio.
ACCOUNT_EMAIL_VERIFICATION = "mandatory"
# Quem clica no link de confirmação já entra: sem isto a página diria
# "confirmado" e o leitor continuaria deslogado, sem entender por quê.
ACCOUNT_LOGIN_ON_EMAIL_CONFIRMATION = True
ACCOUNT_EMAIL_SUBJECT_PREFIX = ""
ACCOUNT_PREVENT_ENUMERATION = True
ACCOUNT_USER_DISPLAY = "contas.adapter.exibir_leitor"

HEADLESS_ONLY = True
HEADLESS_CLIENTS = ("browser",)
HEADLESS_FRONTEND_URLS = {
    "account_confirm_email": SITE_URL + "/conta/verificar/?key={key}",
    "account_reset_password": SITE_URL + "/conta/senha/",
    "account_reset_password_from_key": SITE_URL + "/conta/redefinir/?key={key}",
    "account_signup": SITE_URL + "/conta/cadastro/",
}
