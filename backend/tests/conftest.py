import pytest
from django.contrib.auth import get_user_model

BROWSER = "/_allauth/browser/v1"


@pytest.fixture(autouse=True)
def cache_limpo():
    """
    O banco volta ao início a cada teste, mas o cache não — e o allauth guarda
    ali os limites de tentativa e a carência de reenvio de confirmação. Sem
    limpar, um teste envenena o seguinte.
    """
    from django.core.cache import cache

    cache.clear()
    yield
    cache.clear()


@pytest.fixture
def Usuario():
    return get_user_model()


@pytest.fixture
def leitor(db, Usuario):
    """Leitor com e-mail já verificado — pronto para comentar."""
    from allauth.account.models import EmailAddress

    usuario = Usuario.objects.create_user(
        email="leitora@exemplo.com.br",
        password="uma-senha-boa-123",
        nome="Marina Lopes",
        cidade="Vitória",
    )
    EmailAddress.objects.create(user=usuario, email=usuario.email, primary=True, verified=True)
    return usuario


@pytest.fixture
def sem_verificar(db, Usuario):
    """Leitor cadastrado que ainda não confirmou o e-mail."""
    from allauth.account.models import EmailAddress

    usuario = Usuario.objects.create_user(
        email="novato@exemplo.com.br",
        password="uma-senha-boa-123",
        nome="João Neiva",
    )
    EmailAddress.objects.create(user=usuario, email=usuario.email, primary=True, verified=False)
    return usuario
