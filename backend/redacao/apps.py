"""
O painel da redação: o admin do Django, em português e com a cara da revista.

Mora em /redacao/ (config/urls.py) — o caminho padrão /admin/ não existe.
"""

from django.apps import AppConfig
from django.contrib.admin.apps import AdminConfig


class RedacaoAdminConfig(AdminConfig):
    """Substitui o admin padrão pelo painel da redação."""

    default_site = "redacao.admin_site.PainelDaRedacao"


class RedacaoConfig(AppConfig):
    """
    O app em si. Sem ele o Django não enxerga redacao/templates/ nem
    redacao/static/ — e a identidade da marca no painel seria ignorada.
    """

    name = "redacao"
    label = "redacao"
    verbose_name = "Redação"
