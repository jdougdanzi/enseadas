from django.contrib.admin import AdminSite
from django.http import HttpResponse

from .forms import excedeu_tentativas


class PainelDaRedacao(AdminSite):
    site_title = "EnseadaS"
    site_header = "EnseadaS · Redação"
    index_title = "O que há para fazer"
    enable_nav_sidebar = True

    def login(self, request, extra_context=None):
        """
        Barra a força bruta antes de conferir a senha.

        Responde 429 (e não a tela de login de novo) para o servidor da frente
        e o fail2ban conseguirem distinguir bloqueio de senha errada.
        """
        if request.method == "POST" and excedeu_tentativas(request, contar=True):
            return HttpResponse(
                "Tentativas demais. Espere alguns minutos antes de tentar de novo.",
                status=429,
                content_type="text/plain; charset=utf-8",
            )
        return super().login(request, extra_context)
