"""Gera o cabeçalho e o rodapé das páginas públicas a partir de UMA definição.

Uso (na raiz do projeto):   python tools/gerar-navegacao.py

Fase 1 (atual): index.html e sobre.html.
Fase 2 (recomendada no estudo): transparencia.html, demo/index.html, login.html, termos.html, privacidade.html.

Cada página tem, entre marcadores, o bloco gerado:
    <!--NAV-->  ...  <!--/NAV-->           cabeçalho
    <!--RODAPE-->  ...  <!--/RODAPE-->     rodapé
Para mudar um nome ou um link do site, edite as listas abaixo e rode o script: todas as páginas ficam iguais.
"""
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------- definição única
NAVEGACAO = [  # (arquivo, rótulo)   -> cabeçalho principal, sempre nesta ordem (WCAG 3.2.3)
    ('index.html', 'Início'),
    ('sobre.html', 'Sobre'),
    ('demo/', 'Demonstração'),
    ('transparencia.html', 'Transparência'),
]
LEGAL = [('termos.html', 'Termo de Uso'), ('privacidade.html', 'Política de Privacidade')]
ACESSO = [('login.html', 'Sou aluno'), ('login.html?perfil=professor', 'Sou professor / administrador')]
PAGINAS = {  # página -> item ativo do cabeçalho
    'index.html': 'index.html',
    'sobre.html': 'sobre.html',
}


def cabecalho(ativa: str) -> str:
    itens = []
    for href, rotulo in NAVEGACAO:
        atual = ' aria-current="page"' if href == ativa else ''
        itens.append(f'            <a href="{href}"{atual}>{rotulo}</a>')
    return f'''<!--NAV-->
<header class="site-header">
    <div class="interno">
        <a href="index.html" class="marca" aria-label="PIBIEX Digital, início">
            <img src="logo-pibiex-digital-branca.png" alt="PIBIEX Digital">
        </a>
        <nav aria-label="Principal">
{chr(10).join(itens)}
        </nav>
        <a href="login.html" class="entrar">Entrar</a>
    </div>
</header>
<!--/NAV-->'''


def rodape() -> str:
    def lista(itens):
        return '\n'.join(f'                <li><a href="{h}">{r}</a></li>' for h, r in itens)
    return f'''<!--RODAPE-->
<footer class="site-footer">
    <div class="interno">
        <div class="sobre-rodape">
            <img src="logo-pibiex-digital-branca.png" alt="PIBIEX Digital">
            <p>Plataforma de apoio a cursos de Inteligência Artificial, com acessibilidade e proteção de dados.</p>
        </div>
        <nav aria-label="Plataforma">
            <h2>Plataforma</h2>
            <ul>
{lista(NAVEGACAO)}
            </ul>
        </nav>
        <nav aria-label="Informações legais">
            <h2>Legal</h2>
            <ul>
{lista(LEGAL)}
            </ul>
        </nav>
        <nav aria-label="Acesso">
            <h2>Acesso</h2>
            <ul>
{lista(ACESSO)}
            </ul>
        </nav>
    </div>
    <div class="credito">
        <p>Desenvolvido por <strong>Marciel Gomes Lima Rodrigues</strong> · Site independente, não oficial da UNITINS</p>
    </div>
</footer>
<!--/RODAPE-->'''


def aplicar(arquivo: str, ativa: str) -> None:
    caminho = RAIZ / arquivo
    t = caminho.read_text(encoding='utf-8')
    novo_nav, novo_rod = cabecalho(ativa), rodape()
    if '<!--NAV-->' in t:
        t = re.sub(r'<!--NAV-->.*?<!--/NAV-->', lambda _: novo_nav, t, count=1, flags=re.S)
    else:  # primeira vez: troca o <header> antigo
        t, n = re.subn(r'(?:<!-- =+ NAV =+ -->\s*)?<header\b.*?</header>', lambda _: novo_nav, t, count=1, flags=re.S)
        assert n == 1, f'{arquivo}: cabeçalho antigo não encontrado'
    if '<!--RODAPE-->' in t:
        t = re.sub(r'<!--RODAPE-->.*?<!--/RODAPE-->', lambda _: novo_rod, t, count=1, flags=re.S)
    else:
        t, n = re.subn(r'(?:<!-- =+ FOOTER =+ -->\s*)?<footer\b.*?</footer>', lambda _: novo_rod, t, count=1, flags=re.S)
        assert n == 1, f'{arquivo}: rodapé antigo não encontrado'
    caminho.write_text(t, encoding='utf-8', newline='')
    print('ok', arquivo)


if __name__ == '__main__':
    for arq, ativa in PAGINAS.items():
        aplicar(arq, ativa)
