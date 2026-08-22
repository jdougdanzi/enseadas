"""
Produção no VPS, atrás do Caddy.

Regra deste arquivo: o que estiver errado tem de estourar **aqui**, no
arranque — nunca diante do primeiro leitor. Por isso não há valor padrão
para nada que dependa do ambiente.
"""

from urllib.parse import urlparse

from django.core.exceptions import ImproperlyConfigured

from .base import *  # noqa: F403
from .base import ORIGENS_SITE, SITE_URL, env

DEBUG = False

API_HOST = env("API_HOST", default="api.enseadas.com.br")
ALLOWED_HOSTS = [API_HOST]

# ---------------------------------------------------------------------------
# Conferências de arranque
#
# Cada uma corresponde a uma falha que, sem isto, só apareceria em produção:
# e-mail com link para localhost, site recusado por CORS, cookie descartado
# pelo navegador, 500 no primeiro cadastro.
# ---------------------------------------------------------------------------

if SITE_URL.startswith("http://localhost") or SITE_URL.startswith("http://127."):
    raise ImproperlyConfigured(
        "SITE_URL ainda aponta para localhost. Em produção ele precisa ser o "
        "endereço público do site (ex.: https://enseadas.com.br) — é o que vai "
        "nos links dos e-mails de verificação e de nova senha."
    )

if any(o.startswith("http://localhost") or o.startswith("http://127.") for o in ORIGENS_SITE):
    raise ImproperlyConfigured(
        "ORIGENS_SITE ainda contém localhost. Em produção liste a origem "
        "pública do site — é ela que passa no CORS e no CSRF."
    )

if not env("EMAIL_HOST_PASSWORD", default=""):
    raise ImproperlyConfigured(
        "EMAIL_HOST_PASSWORD está vazia. Sem a chave do Resend a API sobe, mas "
        "o primeiro cadastro devolve 500 com a conta já criada e sem e-mail."
    )


# Site e API precisam do mesmo domínio registrável: é o que faz o Safari
# tratar o cookie como de primeira parte (ITP).
def _dominio_registravel(host: str) -> str:
    """enseadas.com.br → enseadas.com.br · api.enseadas.com.br → enseadas.com.br"""
    partes = host.split(".")
    # Domínios brasileiros têm três níveis (algo.com.br); os demais, dois.
    if len(partes) >= 3 and partes[-2] in {"com", "net", "org", "gov", "edu"}:
        return ".".join(partes[-3:])
    return ".".join(partes[-2:])


_dominio_site = _dominio_registravel(urlparse(SITE_URL).hostname or "")
_dominio_api = _dominio_registravel(API_HOST)

if _dominio_site != _dominio_api:
    raise ImproperlyConfigured(
        f"O site ({_dominio_site}) e a API ({_dominio_api}) estão em domínios "
        "diferentes. A sessão por cookie não sobrevive a isso no Safari: o "
        "leitor faria login e continuaria deslogado."
    )

# ---------------------------------------------------------------------------
# Cookies
# ---------------------------------------------------------------------------

# Sem Domain na sessão: o cookie host-only da API já viaja em requisição do
# mesmo site, e pôr o domínio mandaria o identificador do leitor para todo
# subdomínio — inclusive o GitHub Pages, que serve as páginas.
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
# O CSRF precisa do domínio: é o script do site que lê este cookie.
CSRF_COOKIE_DOMAIN = f".{_dominio_api}"

SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 365
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"

# ---------------------------------------------------------------------------
# E-mail
# ---------------------------------------------------------------------------

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.resend.com"
EMAIL_PORT = 465
EMAIL_USE_SSL = True
EMAIL_HOST_USER = "resend"
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")
# O allauth envia dentro da requisição: sem limite, um SMTP travado prende o
# worker do gunicorn até o timeout de 30 s matá-lo. Dois cadastros assim
# derrubariam a API.
EMAIL_TIMEOUT = 10
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="EnseadaS <revista@enseadas.com.br>")
SERVER_EMAIL = DEFAULT_FROM_EMAIL
ADMINS = [("Douglas Danzi", env("ADMIN_EMAIL", default="douglas@danzi.com.br"))]
