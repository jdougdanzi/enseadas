"""
Caixa do e-mail: 'Marina@Exemplo.com.br' e 'marina@exemplo.com.br' são a
mesma pessoa. O allauth busca sempre em minúsculas, então o modelo precisa
guardar em minúsculas — senão a conta existe e ninguém consegue entrar nela.
"""

import json

import pytest
from django.db import IntegrityError, transaction

BROWSER = "/_allauth/browser/v1"


def post(client, caminho, dados):
    return client.post(caminho, data=json.dumps(dados), content_type="application/json")


@pytest.mark.django_db
def test_create_user_guarda_o_e_mail_em_minusculas(Usuario):
    usuario = Usuario.objects.create_user(
        email="Marina@EXEMPLO.com.br", password="uma-senha-boa-123"
    )

    assert usuario.email == "marina@exemplo.com.br"


@pytest.mark.django_db
def test_leitor_cadastrado_com_maiuscula_consegue_entrar(client, Usuario):
    from allauth.account.models import EmailAddress

    usuario = Usuario.objects.create_user(
        email="Marina@EXEMPLO.com.br", password="uma-senha-boa-123"
    )
    EmailAddress.objects.create(user=usuario, email=usuario.email, primary=True, verified=True)

    resposta = post(
        client,
        f"{BROWSER}/auth/login",
        {
            "email": "marina@exemplo.com.br",
            "password": "uma-senha-boa-123",
        },
    )

    assert resposta.status_code == 200


@pytest.mark.django_db
def test_nao_existem_duas_contas_que_so_diferem_na_caixa(Usuario):
    Usuario.objects.create_user(email="marina@exemplo.com.br", password="uma-senha-boa-123")

    with pytest.raises(IntegrityError), transaction.atomic():
        Usuario.objects.create_user(email="MARINA@Exemplo.com.br", password="outra-senha-boa-456")


@pytest.mark.django_db
def test_superusuario_com_maiuscula_entra_no_painel(client, Usuario):
    Usuario.objects.create_superuser(email="Douglas@Danzi.com.br", password="uma-senha-boa-123")

    resposta = client.post(
        "/redacao/login/",
        {"username": "douglas@danzi.com.br", "password": "uma-senha-boa-123"},
        follow=False,
    )

    assert resposta.status_code == 302, "o painel recusou a grafia em minúsculas"
