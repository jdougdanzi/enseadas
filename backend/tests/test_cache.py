"""
O cache é infraestrutura de que o allauth depende em todo login e cadastro.
Se a tabela não existir, o primeiro leitor recebe 500 — e nada avisa antes.
"""

import pytest
from django.core.cache import cache


def test_o_cache_responde():
    cache.set("sonda", "vale", 5)

    assert cache.get("sonda") == "vale"


@pytest.mark.django_db
def test_a_verificacao_do_django_avisa_quando_falta_a_tabela_do_cache(settings):
    """
    `manage.py check` precisa acusar a tabela ausente. Sem isso o deploy passa
    verde e só o leitor descobre.
    """
    from django.core.checks import run_checks

    settings.CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.db.DatabaseCache",
            "LOCATION": "tabela_que_nao_existe",
        }
    }

    avisos = [a for a in run_checks() if "tabela_que_nao_existe" in str(a)]

    assert avisos, "nenhuma checagem acusou a tabela de cache ausente"
