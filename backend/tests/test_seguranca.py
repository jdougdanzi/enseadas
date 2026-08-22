"""Sessão, CSRF e CORS: o que protege a conta do leitor."""

import json

import pytest

BROWSER = "/_allauth/browser/v1"


@pytest.mark.django_db
def test_endpoint_de_csrf_entrega_o_cookie(client):
    """O site precisa do cookie para poder mandar o cabeçalho X-CSRFToken."""
    resposta = client.get("/api/csrf")

    assert resposta.status_code == 200
    assert "csrftoken" in resposta.cookies, "nenhum cookie csrftoken foi enviado"
    assert resposta.cookies["csrftoken"].value


@pytest.mark.django_db
def test_cookie_de_sessao_e_httponly_e_lax(client, leitor):
    client.post(
        f"{BROWSER}/auth/login",
        data=json.dumps({"email": leitor.email, "password": "uma-senha-boa-123"}),
        content_type="application/json",
    )

    cookie = client.cookies["enseadas_sessao"]
    assert cookie["httponly"], "a sessão precisa ser HttpOnly (fora do alcance de scripts)"
    assert cookie["samesite"].lower() == "lax"


@pytest.mark.django_db
def test_origem_estranha_nao_recebe_liberacao_de_cors(client):
    resposta = client.get("/api/saude", HTTP_ORIGIN="https://site-invasor.example")

    assert "Access-Control-Allow-Origin" not in resposta


@pytest.mark.django_db
def test_origem_do_site_recebe_cors_com_credenciais(client, settings):
    origem = settings.ORIGENS_SITE[0]

    resposta = client.get("/api/saude", HTTP_ORIGIN=origem)

    assert resposta["Access-Control-Allow-Origin"] == origem
    assert resposta["Access-Control-Allow-Credentials"] == "true"
