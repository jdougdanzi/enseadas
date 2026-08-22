"""
Leitor da revista. O login é o e-mail — não existe nome de usuário.

Guardamos o mínimo: quem comenta aparece com nome e cidade, e nada além
disso é necessário para a revista funcionar (minimização, LGPD).
"""

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.db.models.functions import Lower
from django.utils import timezone


class GerenteDeUsuarios(BaseUserManager):
    use_in_migrations = True

    def _criar(self, email, password, **extras):
        if not email:
            raise ValueError("O e-mail é obrigatório.")
        usuario = self.model(email=self.model.normalizar_email(email), **extras)
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_user(self, email, password=None, **extras):
        extras.setdefault("is_staff", False)
        extras.setdefault("is_superuser", False)
        return self._criar(email, password, **extras)

    def create_superuser(self, email, password=None, **extras):
        extras.setdefault("is_staff", True)
        extras.setdefault("is_superuser", True)
        if extras.get("is_staff") is not True:
            raise ValueError("Superusuário precisa de is_staff=True.")
        if extras.get("is_superuser") is not True:
            raise ValueError("Superusuário precisa de is_superuser=True.")
        return self._criar(email, password, **extras)


class Usuario(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField("e-mail", unique=True)
    nome = models.CharField("nome", max_length=80, blank=True)
    cidade = models.CharField("cidade", max_length=60, blank=True)

    is_active = models.BooleanField("ativo", default=True)
    is_staff = models.BooleanField("faz parte da redação", default=False)

    criado_em = models.DateTimeField("criado em", default=timezone.now)
    consentimento_em = models.DateTimeField("consentimento em", null=True, blank=True)
    consentimento_versao = models.CharField("versão do consentimento", max_length=20, blank=True)

    objects = GerenteDeUsuarios()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        verbose_name = "leitor"
        verbose_name_plural = "leitores"
        ordering = ["-criado_em"]
        constraints = [
            # O unique=True do campo é sensível à caixa no Postgres. Sem isto,
            # "Marina@..." e "marina@..." viram duas contas — e o allauth, que
            # busca sempre em minúsculas, só enxerga uma delas.
            models.UniqueConstraint(Lower("email"), name="email_unico_sem_caixa"),
        ]

    @staticmethod
    def normalizar_email(email):
        """
        Minúsculas por inteiro. O normalize_email do Django baixa só o domínio,
        mas o allauth compara o endereço todo em minúsculas.
        """
        return BaseUserManager.normalize_email(email or "").lower()

    def clean(self):
        """Vale para o admin e para qualquer full_clean() — não só para o gerente."""
        super().clean()
        self.email = self.normalizar_email(self.email)

    def save(self, *args, **kwargs):
        self.email = self.normalizar_email(self.email)
        return super().save(*args, **kwargs)

    def __str__(self):
        return self.email

    @property
    def nome_exibido(self):
        """
        O que aparece junto do comentário, em público.

        Sem nome preenchido, entra um rótulo neutro — nunca a parte local do
        e-mail, que reconstrói o endereço de quem só quis comentar.
        """
        return self.nome.strip() or "Leitor(a)"
