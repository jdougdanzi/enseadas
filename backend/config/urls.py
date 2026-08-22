from django.contrib import admin
from django.urls import include, path

from .api import api

urlpatterns = [
    # O painel não fica em /admin/: caminho previsível é alvo de varredura.
    path("redacao/", admin.site.urls),
    path("_allauth/", include("allauth.headless.urls")),
    path("api/", api.urls),
]
