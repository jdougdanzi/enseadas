from django.contrib.admin import AdminSite


class PainelDaRedacao(AdminSite):
    site_title = "EnseadaS"
    site_header = "EnseadaS · Redação"
    index_title = "O que há para fazer"
    enable_nav_sidebar = True
