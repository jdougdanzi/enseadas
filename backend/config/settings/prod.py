"""Produção no VPS, atrás do Caddy."""

from .base import *  # noqa: F403
from .base import env

DEBUG = False

API_HOST = env("API_HOST", default="api.enseadas.com.br")
ALLOWED_HOSTS = [API_HOST]

# Site e API no mesmo domínio registrável: o cookie vale para os dois
# subdomínios e o Safari o trata como primeira parte (ITP).
SESSION_COOKIE_DOMAIN = ".enseadas.com.br"
CSRF_COOKIE_DOMAIN = ".enseadas.com.br"
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Quem termina o TLS é o Caddy; ele informa o protocolo original.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 365
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"
X_FRAME_OPTIONS = "DENY"

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = "smtp.resend.com"
EMAIL_PORT = 465
EMAIL_USE_SSL = True
EMAIL_HOST_USER = "resend"
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD")
DEFAULT_FROM_EMAIL = env("DEFAULT_FROM_EMAIL", default="EnseadaS <revista@enseadas.com.br>")
SERVER_EMAIL = DEFAULT_FROM_EMAIL
ADMINS = [("Douglas Danzi", env("ADMIN_EMAIL", default="douglas@danzi.com.br"))]
