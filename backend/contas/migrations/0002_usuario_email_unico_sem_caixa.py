"""
Passa os e-mails existentes para minúsculas e proíbe duplicata por caixa.

A ordem importa: a restrição não entra num banco que já tenha
"Marina@..." e "marina@..." convivendo.
"""

import django.db.models.functions.text
from django.db import migrations, models


def normalizar(apps, schema_editor):
    """Baixa a caixa de quem foi criado antes desta regra."""
    Usuario = apps.get_model("contas", "Usuario")
    for usuario in Usuario.objects.all().iterator():
        minusculo = usuario.email.lower()
        if usuario.email != minusculo:
            usuario.email = minusculo
            usuario.save(update_fields=["email"])

    # Também alinha os endereços do allauth, que já os guarda em minúsculas.
    try:
        EmailAddress = apps.get_model("account", "EmailAddress")
    except LookupError:
        return
    for endereco in EmailAddress.objects.all().iterator():
        minusculo = endereco.email.lower()
        if endereco.email != minusculo:
            endereco.email = minusculo
            endereco.save(update_fields=["email"])


def nada(apps, schema_editor):
    """Não há como desfazer: a caixa original se perdeu."""


class Migration(migrations.Migration):
    dependencies = [
        ("account", "0001_initial"),
        ("auth", "0012_alter_user_first_name_max_length"),
        ("contas", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(normalizar, nada),
        migrations.AddConstraint(
            model_name="usuario",
            constraint=models.UniqueConstraint(
                django.db.models.functions.text.Lower("email"),
                name="email_unico_sem_caixa",
            ),
        ),
    ]
