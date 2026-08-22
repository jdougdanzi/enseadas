"""Configuração dos testes: rápida e sem tocar em serviço externo."""

from .dev import *  # noqa: F403

# Hash rápido: os testes criam muitos usuários e não medem força de senha.
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Cache em memória: dispensa a tabela e isola cada execução.
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}

# Sem WhiteNoise com manifest: exigiria collectstatic antes de cada teste.
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
