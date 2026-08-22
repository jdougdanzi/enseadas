"""A API responde e o painel da redação está protegido."""


def test_saude_responde_ok(client):
    resposta = client.get("/api/saude")

    assert resposta.status_code == 200
    corpo = resposta.json()
    assert corpo["ok"] is True
    assert "hora" in corpo


def test_painel_da_redacao_exige_login(client):
    resposta = client.get("/redacao/")

    # O admin redireciona anônimo para a própria tela de login.
    assert resposta.status_code == 302
    assert "/redacao/login/" in resposta["Location"]


def test_caminho_padrao_do_admin_nao_existe(client):
    """O admin mora em /redacao/ — /admin/ não deve responder."""
    assert client.get("/admin/").status_code == 404
