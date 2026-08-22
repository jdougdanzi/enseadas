"""
Limite de tentativas no login do painel.

O rate limit do allauth protege só a API (/_allauth/…/auth/login). O
formulário do admin chama authenticate() direto — e o e-mail do editor é
público (aparece no expediente). Sem isto, força bruta à vontade.
"""

from django_ratelimit.core import is_ratelimited

# Duas contagens: por IP (barra o atacante) e por endereço (barra quem gira
# de IP mirando a mesma conta).
LIMITE_POR_IP = "10/5m"
LIMITE_POR_CONTA = "5/5m"


def excedeu_tentativas(pedido, *, contar):
    """
    Diz se este pedido de login passou do limite.

    `contar=False` só consulta — usado para não gastar a cota em quem já
    está bloqueado.
    """
    email = (pedido.POST.get("username") or "").strip().lower()

    por_ip = is_ratelimited(
        pedido,
        group="redacao:login:ip",
        key="ip",
        rate=LIMITE_POR_IP,
        increment=contar,
    )
    por_conta = bool(email) and is_ratelimited(
        pedido,
        group="redacao:login:conta",
        key=lambda grupo, req: email,
        rate=LIMITE_POR_CONTA,
        increment=contar,
    )
    return por_ip or por_conta
