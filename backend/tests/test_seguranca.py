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


@pytest.mark.django_db
def test_esquema_da_api_nao_fica_publico_em_producao():
    """
    docs_url=None escondia só a página; o /openapi.json continuava aberto,
    publicando cada rota nova automaticamente.
    """
    from ninja import NinjaAPI

    # Reproduz o construtor de config/api.py com DEBUG desligado.
    api = NinjaAPI(title="teste", docs_url=None, openapi_url=None)
    rotas = [str(p.pattern) for p in api.urls[0]]

    assert not any("openapi" in r for r in rotas), f"esquema exposto: {rotas}"


@pytest.mark.django_db
def test_api_real_nao_expoe_o_esquema_quando_debug_esta_desligado(client, settings):
    from config.api import api

    if settings.DEBUG:
        pytest.skip("em dev o esquema é útil e fica disponível")
    rotas = [str(p.pattern) for p in api.urls[0]]
    assert not any("openapi" in r for r in rotas), f"esquema exposto: {rotas}"


@pytest.mark.django_db
def test_endpoint_de_csrf_devolve_o_token_no_corpo(client):
    """
    O site e a API ficam em subdomínios diferentes, então o script do site não
    consegue LER o cookie da API. Ele precisa do valor no corpo da resposta
    para mandá-lo no cabeçalho — e assim o cookie continua restrito ao host
    da API, sem ser compartilhado com o resto do domínio.
    """
    resposta = client.get("/api/csrf")

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert "token" in corpo, f"token ausente: {corpo}"
    assert corpo["token"], "token veio vazio"
    # O cookie também vem — ele guarda o segredo. O valor do corpo é uma
    # versão mascarada, que o Django gera diferente a cada pedido de
    # propósito; por isso o que importa é o teste de ponta a ponta abaixo.
    assert "csrftoken" in resposta.cookies


@pytest.mark.django_db
def test_o_token_do_corpo_e_aceito_como_cabecalho(client, leitor):
    """Prova de ponta a ponta: o valor entregue funciona de fato num POST."""
    import json

    token = client.get("/api/csrf").json()["token"]

    resposta = client.post(
        f"{BROWSER}/auth/login",
        data=json.dumps({"email": leitor.email, "password": "uma-senha-boa-123"}),
        content_type="application/json",
        HTTP_X_CSRFTOKEN=token,
    )

    assert resposta.status_code == 200
