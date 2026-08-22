"""
Verificações que rodam no `manage.py check` — e, portanto, no deploy.

A ideia é simples: tudo o que hoje só quebraria diante do leitor deve virar
um erro que o `check` acusa antes.
"""

from django.core.cache import caches
from django.core.checks import Error, register
from django.db import connections, router


@register()
def tabela_do_cache_existe(app_configs, **kwargs):
    """
    O allauth consulta o cache no rate limit de todo login e cadastro. Com o
    DatabaseCache e sem `createcachetable`, o primeiro leitor recebe 500 —
    e `migrate` não cria essa tabela.
    """
    problemas = []
    for config in caches.settings.values():
        if "DatabaseCache" not in config.get("BACKEND", ""):
            continue
        tabela = config.get("LOCATION")
        if not tabela:
            continue

        conexao = connections[router.db_for_read(None) or "default"]
        try:
            existentes = conexao.introspection.table_names()
        except Exception:
            # Sem banco disponível não dá para afirmar nada; não é papel do
            # check derrubar por isso.
            continue

        if tabela not in existentes:
            problemas.append(
                Error(
                    f'A tabela de cache "{tabela}" não existe.',
                    hint=(
                        "Rode `manage.py createcachetable`. Sem ela, cadastro e "
                        "login devolvem 500: o allauth consulta o cache antes da view."
                    ),
                    id="contas.E001",
                )
            )
    return problemas
