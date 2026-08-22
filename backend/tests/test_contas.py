"""Cadastro, verificação de e-mail e sessão do leitor."""

import json

import pytest
from django.core import mail

BROWSER = "/_allauth/browser/v1"


def post(client, caminho, dados):
    return client.post(caminho, data=json.dumps(dados), content_type="application/json")


@pytest.mark.django_db
def test_cadastro_cria_leitor_e_manda_e_mail_de_verificacao(client, Usuario):
    resposta = post(
        client,
        f"{BROWSER}/auth/signup",
        {
            "email": "novo@exemplo.com.br",
            "password": "uma-senha-boa-123",
        },
    )

    # Com verificação obrigatória, o allauth responde 401: a sessão só abre
    # depois de confirmar o e-mail.
    assert resposta.status_code == 401
    assert Usuario.objects.filter(email="novo@exemplo.com.br").exists()
    assert len(mail.outbox) == 1
    assert "novo@exemplo.com.br" in mail.outbox[0].to


@pytest.mark.django_db
def test_e_mail_de_verificacao_aponta_para_o_site(client, settings):
    post(
        client,
        f"{BROWSER}/auth/signup",
        {
            "email": "novo@exemplo.com.br",
            "password": "uma-senha-boa-123",
        },
    )

    corpo = mail.outbox[0].body
    assert f"{settings.SITE_URL}/conta/verificar/" in corpo


@pytest.mark.django_db
def test_sessao_anonima_responde_401(client):
    assert client.get(f"{BROWSER}/auth/session").status_code == 401


@pytest.mark.django_db
def test_login_e_sessao_do_leitor_verificado(client, leitor):
    entrada = post(
        client,
        f"{BROWSER}/auth/login",
        {
            "email": leitor.email,
            "password": "uma-senha-boa-123",
        },
    )
    assert entrada.status_code == 200

    sessao = client.get(f"{BROWSER}/auth/session")
    assert sessao.status_code == 200
    assert sessao.json()["data"]["user"]["email"] == leitor.email


@pytest.mark.django_db
def test_leitor_sem_verificar_nao_abre_sessao(client, sem_verificar):
    resposta = post(
        client,
        f"{BROWSER}/auth/login",
        {
            "email": sem_verificar.email,
            "password": "uma-senha-boa-123",
        },
    )

    assert resposta.status_code == 401


@pytest.mark.django_db
def test_sair_encerra_a_sessao(client, leitor):
    post(client, f"{BROWSER}/auth/login", {"email": leitor.email, "password": "uma-senha-boa-123"})

    saida = client.delete(f"{BROWSER}/auth/session")
    assert saida.status_code == 401  # o allauth devolve o estado "deslogado"

    assert client.get(f"{BROWSER}/auth/session").status_code == 401


@pytest.mark.django_db
def test_e_mail_de_verificacao_fala_como_a_revista(client):
    """O leitor recebe um e-mail da EnseadaS, não do nome do servidor."""
    post(
        client,
        f"{BROWSER}/auth/signup",
        {
            "email": "novo@exemplo.com.br",
            "password": "uma-senha-boa-123",
        },
    )

    mensagem = mail.outbox[0]
    assert "EnseadaS" in mensagem.subject
    assert "EnseadaS" in mensagem.body
    # "testserver" é o host do cliente de teste; em produção seria o da API.
    assert "testserver" not in mensagem.body
    assert "Confirme" in mensagem.subject or "confirme" in mensagem.subject


@pytest.mark.django_db
def test_pedido_de_nova_senha_manda_e_mail_com_link_do_site(client, leitor, settings):
    resposta = post(client, f"{BROWSER}/auth/password/request", {"email": leitor.email})

    assert resposta.status_code in (200, 401)
    assert len(mail.outbox) == 1
    corpo = mail.outbox[0].body
    assert f"{settings.SITE_URL}/conta/redefinir/" in corpo
    assert "testserver" not in corpo
