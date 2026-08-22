"""
Ajustes de comportamento do allauth — o que é decisão nossa, não do pacote.
"""


def exibir_leitor(usuario):
    """
    O que a interface mostra como identidade do leitor (allauth: user_display).

    O padrão do allauth é o __str__ do usuário — que aqui é o e-mail. Numa
    saudação ("Minha conta · …") isso exporia o endereço na própria tela.
    """
    return usuario.nome_exibido
