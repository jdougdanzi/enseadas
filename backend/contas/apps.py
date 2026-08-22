from django.apps import AppConfig


class ContasConfig(AppConfig):
    name = "contas"
    verbose_name = "Leitores"

    def ready(self):
        # Registra as verificações do `manage.py check`.
        from . import checks  # noqa: F401
