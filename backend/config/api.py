"""
API pública da revista, servida pelo Django Ninja.

CSRF: a partir do Ninja 1.0 a proteção é ligada sozinha nos endpoints que usam
autenticação por cookie (django_auth) — não existe mais o antigo `csrf=True`.
Endpoints públicos declaram `auth=None` explicitamente.
"""

from django.conf import settings
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from ninja import NinjaAPI, Schema
from ninja.security import django_auth

api = NinjaAPI(
    title="API da EnseadaS",
    version="1.0.0",
    description="Contas, comentários e newsletter da revista.",
    auth=django_auth,
    # Em produção o esquema não vai ao ar: `docs_url=None` esconderia só a
    # página, mas o /openapi.json continuaria aberto — publicando cada rota
    # nova (contas, comentários, newsletter) para qualquer um, sem ninguém
    # precisar lembrar disso.
    docs_url="/docs" if settings.DEBUG else None,
    openapi_url="/openapi.json" if settings.DEBUG else None,
)


class Saude(Schema):
    ok: bool
    versao: str
    hora: str


@api.get("/saude", response=Saude, auth=None, tags=["serviço"])
def saude(request):
    """Diz que a API está de pé. Usado pelo deploy e pelo site."""
    return {"ok": True, "versao": api.version, "hora": timezone.now().isoformat()}


@api.get("/csrf", auth=None, tags=["serviço"])
def csrf(request):
    """
    Entrega o token CSRF para o site.

    O valor vai no corpo, não só no cookie: site e API ficam em hosts
    diferentes, então o script do site não consegue ler o cookie da API. Com o
    token no corpo, o cookie continua restrito ao host da API — sem precisar
    espalhá-lo pelo domínio inteiro, onde outras aplicações o receberiam.
    """
    return JsonResponse({"token": get_token(request)})
