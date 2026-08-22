"""Nada que identifique o leitor vaza para o público."""

import json

import pytest

BROWSER = "/_allauth/browser/v1"


@pytest.mark.django_db
def test_nome_exibido_nunca_revela_o_e_mail(Usuario):
    """
    Sem nome preenchido, o rótulo público não pode ser a parte local do
    e-mail: 'maria.silva.1987@gmail.com' viraria 'maria.silva.1987'.
    """
    usuario = Usuario.objects.create_user(
        email="maria.silva.1987@exemplo.com.br", password="uma-senha-boa-123"
    )

    exibido = usuario.nome_exibido

    assert "maria.silva" not in exibido
    assert "@" not in exibido
    assert exibido, "precisa haver algum rótulo"


@pytest.mark.django_db
def test_nome_exibido_usa_o_nome_quando_existe(Usuario):
    usuario = Usuario.objects.create_user(
        email="marina@exemplo.com.br", password="uma-senha-boa-123", nome="Marina Lopes"
    )

    assert usuario.nome_exibido == "Marina Lopes"


@pytest.mark.django_db
def test_sessao_nao_devolve_o_e_mail_como_nome_de_exibicao(client, leitor):
    """O 'display' do allauth ia para a interface — e era o e-mail cru."""
    client.post(
        f"{BROWSER}/auth/login",
        data=json.dumps({"email": leitor.email, "password": "uma-senha-boa-123"}),
        content_type="application/json",
    )

    dados = client.get(f"{BROWSER}/auth/session").json()["data"]["user"]

    assert dados["display"] == leitor.nome
    assert dados["display"] != leitor.email
