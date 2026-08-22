"""O painel da redação: força bruta, templates da marca e app instalado."""

import pytest
from django.apps import apps


@pytest.mark.django_db
def test_login_do_painel_bloqueia_forca_bruta(client, Usuario):
    """
    O rate limit do allauth só cobre a API. O formulário do painel chamava
    authenticate() direto — e o e-mail do editor é público.
    """
    Usuario.objects.create_superuser(email="editor@exemplo.com.br", password="uma-senha-boa-123")

    codigos = []
    for _ in range(12):
        r = client.post(
            "/redacao/login/",
            {"username": "editor@exemplo.com.br", "password": "chute-errado"},
        )
        codigos.append(r.status_code)

    assert 429 in codigos, f"nenhuma tentativa foi barrada: {codigos}"


def test_app_da_redacao_esta_instalado():
    """
    Sem o app instalado, templates e static em backend/redacao/ são ignorados
    em silêncio — e é ali que entra a cara da marca no painel.
    """
    config = apps.get_app_config("redacao")

    assert config.path.endswith("/redacao")


@pytest.mark.django_db
def test_bloqueio_do_painel_vale_mesmo_com_a_senha_certa(client, Usuario):
    """De nada adianta contar tentativas se a senha certa passa no meio."""
    Usuario.objects.create_superuser(email="editor@exemplo.com.br", password="uma-senha-boa-123")

    for _ in range(12):
        client.post(
            "/redacao/login/",
            {"username": "editor@exemplo.com.br", "password": "chute-errado"},
        )

    certa = client.post(
        "/redacao/login/",
        {"username": "editor@exemplo.com.br", "password": "uma-senha-boa-123"},
    )

    assert certa.status_code == 429, "a senha certa entrou apesar do bloqueio"


@pytest.mark.django_db
def test_editor_legitimo_entra_sem_estorvo(client, Usuario):
    """O limite não pode atrapalhar quem acerta de primeira."""
    Usuario.objects.create_superuser(email="editor@exemplo.com.br", password="uma-senha-boa-123")

    resposta = client.post(
        "/redacao/login/",
        {"username": "editor@exemplo.com.br", "password": "uma-senha-boa-123"},
    )

    assert resposta.status_code == 302
