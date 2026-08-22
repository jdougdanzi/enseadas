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


@pytest.mark.django_db
def test_recadastro_de_e_mail_existente_fala_como_a_revista(client, leitor):
    """
    Com a prevenção de enumeração ligada, quem tenta se cadastrar de novo
    recebe um aviso de conta existente — que estava saindo no texto padrão
    do allauth, sem a voz da revista.
    """
    from django.core.cache import cache

    cache.clear()  # o allauth tem carência de reenvio por endereço
    resposta = post(
        client,
        f"{BROWSER}/auth/signup",
        {
            "email": leitor.email,
            "password": "outra-senha-boa-456",
        },
    )

    # A resposta é idêntica à de um cadastro novo: é isso que impede
    # descobrir quem já tem conta.
    assert resposta.status_code == 401
    mensagem = mail.outbox[0]
    assert "EnseadaS" in mensagem.subject
    assert "EnseadaS" in mensagem.body


@pytest.mark.django_db
def test_confirmar_o_e_mail_ja_deixa_o_leitor_logado(client):
    """
    Quem clica no link de confirmação espera estar dentro. Sem isto, a página
    diz 'confirmado' e o leitor continua deslogado, sem entender por quê.
    """
    import re
    from urllib.parse import unquote

    post(
        client,
        f"{BROWSER}/auth/signup",
        {
            "email": "novo@exemplo.com.br",
            "password": "uma-senha-boa-123",
        },
    )
    chave = unquote(re.search(r"\?key=([^\s]+)", mail.outbox[0].body).group(1))

    confirmacao = post(client, f"{BROWSER}/auth/email/verify", {"key": chave})

    assert confirmacao.status_code == 200, "confirmar não abriu a sessão"
    assert client.get(f"{BROWSER}/auth/session").status_code == 200
