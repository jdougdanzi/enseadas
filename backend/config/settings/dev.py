"""Desenvolvimento no Mac. Nada aqui vale em produção."""

from .base import *  # noqa: F403
from .base import ORIGENS_SITE, env

DEBUG = True

# O IP da LAN entra para testar no iPhone (npm run dev -- --host).
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "[::1]", "*"]

# Sem Secure/Domain: em http://localhost o navegador recusaria o cookie.
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Em dev os e-mails saem no terminal — nada é enviado de verdade.
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="EnseadaS <revista@localhost>")

CORS_ALLOWED_ORIGIN_REGEXES = [r"^http://192\.168\.\d+\.\d+:4321$"]
CSRF_TRUSTED_ORIGINS = [*ORIGENS_SITE, "http://localhost:4321", "http://127.0.0.1:4321"]
