"""
Configuração dos testes: rápida, isolada e sem herdar as folgas de dev.

Herdava de dev — e com isso ALLOWED_HOSTS "*" e o CORS por regex da LAN
entravam na suíte, tornando impossível testar recusa de host ou de origem.
"""

import os

# Valores de teste ANTES de importar base: num clone novo o .env não existe
# (é ignorado pelo git), e SECRET_KEY/DATABASE_URL não têm padrão — a suíte
# morria na importação, antes de coletar um único teste.
os.environ.setdefault("SECRET_KEY", "chave-de-teste-sem-valor-nenhum-em-producao")
os.environ.setdefault("DATABASE_URL", "postgres://enseadas@localhost:5432/enseadas")

from .base import *  # noqa: E402, F403

DEBUG = False
ALLOWED_HOSTS = ["testserver", "localhost", "127.0.0.1"]

SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Hash rápido: os testes criam muitos usuários e não medem força de senha.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Cache em memória: dispensa a tabela e isola cada execução.
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

# O manifest do WhiteNoise exigiria collectstatic antes de cada execução.
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
# Sem o WhiteNoise no meio: ele indexa o STATIC_ROOT a cada cliente de teste.
MIDDLEWARE = [m for m in MIDDLEWARE if "whitenoise" not in m]  # noqa: F405
