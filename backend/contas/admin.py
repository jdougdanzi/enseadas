from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ("email", "nome", "cidade", "is_active", "is_staff", "criado_em")
    list_filter = ("is_active", "is_staff", "criado_em")
    search_fields = ("email", "nome", "cidade")
    ordering = ("-criado_em",)
    readonly_fields = ("criado_em", "last_login", "consentimento_em", "consentimento_versao")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Quem é", {"fields": ("nome", "cidade")}),
        ("Acesso", {"fields": ("is_active", "is_staff", "is_superuser", "groups")}),
        (
            "Registros",
            {"fields": ("criado_em", "last_login", "consentimento_em", "consentimento_versao")},
        ),
    )
    add_fieldsets = ((None, {"classes": ("wide",), "fields": ("email", "password1", "password2")}),)
