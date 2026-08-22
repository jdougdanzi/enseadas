"""
O que precisa estourar no arranque, e não diante do primeiro leitor.

Estes testes carregam as settings de produção num subprocesso, com um
ambiente falso — é a única forma de exercitar prod sem um VPS.
"""

import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

BASE_ENV = {
    "PATH": "/usr/bin:/bin:/usr/sbin:/sbin",
    "DJANGO_SETTINGS_MODULE": "config.settings.prod",
    "SECRET_KEY": "x" * 60,
    "DATABASE_URL": "postgres://usuario:senha@db:5432/enseadas",
    "SITE_URL": "https://enseadas.com.br",
    "ORIGENS_SITE": "https://enseadas.com.br",
    "API_HOST": "api.enseadas.com.br",
    "EMAIL_HOST_PASSWORD": "re_chave_de_mentira",
    "DEFAULT_FROM_EMAIL": "EnseadaS <revista@enseadas.com.br>",
    "ADMIN_EMAIL": "editor@exemplo.com.br",
}


def carregar_prod(**mudancas):
    """Importa as settings de produção e devolve (código, saída)."""
    ambiente = {**BASE_ENV}
    for chave, valor in mudancas.items():
        if valor is None:
            ambiente.pop(chave, None)
        else:
            ambiente[chave] = valor

    codigo = (
        "import django; django.setup();"
        "from django.conf import settings as s;"
        "print('SITE_URL=' + s.SITE_URL);"
        "print('CORS=' + ','.join(s.CORS_ALLOWED_ORIGINS));"
        "print('COOKIE_DOMAIN=' + str(s.SESSION_COOKIE_DOMAIN));"
        "print('CSRF_DOMAIN=' + str(s.CSRF_COOKIE_DOMAIN));"
        "print('EMAIL_TIMEOUT=' + str(s.EMAIL_TIMEOUT));"
    )
    r = subprocess.run(
        [sys.executable, "-c", codigo],
        cwd=RAIZ,
        env=ambiente,
        capture_output=True,
        text=True,
        timeout=90,
    )
    return r.returncode, r.stdout + r.stderr


def test_producao_recusa_subir_sem_o_endereco_do_site():
    """Sem SITE_URL, os e-mails sairiam com link para localhost."""
    codigo, saida = carregar_prod(SITE_URL=None)

    assert codigo != 0, "subiu sem SITE_URL"
    assert "SITE_URL" in saida


def test_producao_recusa_subir_sem_as_origens_do_site():
    codigo, saida = carregar_prod(ORIGENS_SITE=None)

    assert codigo != 0, "subiu sem ORIGENS_SITE"
    assert "ORIGENS_SITE" in saida


def test_producao_recusa_senha_de_e_mail_vazia():
    """Vazia, o allauth só descobre no primeiro cadastro — com 500 e conta criada."""
    codigo, saida = carregar_prod(EMAIL_HOST_PASSWORD="")

    assert codigo != 0, "subiu com a senha do Resend vazia"
    assert "EMAIL_HOST_PASSWORD" in saida


def test_producao_recusa_endereco_do_site_em_outro_dominio():
    """
    Cookie de sessão e site precisam do mesmo domínio registrável, ou o
    navegador descarta o cookie e o login 'funciona' sem nunca entrar.
    """
    codigo, saida = carregar_prod(SITE_URL="https://outro-dominio.net")

    assert codigo != 0, "aceitou site e API em domínios diferentes"


def test_producao_sobe_com_a_configuracao_correta():
    codigo, saida = carregar_prod()

    assert codigo == 0, saida
    assert "SITE_URL=https://enseadas.com.br" in saida
    assert "CORS=https://enseadas.com.br" in saida


def test_producao_tem_tempo_limite_no_envio_de_e_mail():
    """Sem limite, um SMTP travado prende o worker até o gunicorn matá-lo."""
    codigo, saida = carregar_prod()

    assert codigo == 0, saida
    linha = next(x for x in saida.splitlines() if x.startswith("EMAIL_TIMEOUT="))
    valor = linha.split("=", 1)[1]
    assert valor not in ("None", ""), "EMAIL_TIMEOUT não foi definido"
    assert 0 < float(valor) <= 15


def test_cookie_de_sessao_nao_vaza_para_subdominios():
    """
    O Domain no cookie de sessão manda o identificador para todo subdomínio
    — inclusive o GitHub Pages, que serve o site. Ele não é necessário:
    o cookie host-only já viaja em requisição do mesmo site.
    """
    codigo, saida = carregar_prod()

    assert codigo == 0, saida
    assert "COOKIE_DOMAIN=None" in saida
