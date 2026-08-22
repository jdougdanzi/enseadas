"""
O painel da redação: o admin do Django, em português e com a cara da revista.

Mora em /redacao/ (config/urls.py) — o caminho padrão /admin/ não existe.
"""

from django.contrib.admin.apps import AdminConfig


class RedacaoAdminConfig(AdminConfig):
    default_site = "redacao.admin_site.PainelDaRedacao"
