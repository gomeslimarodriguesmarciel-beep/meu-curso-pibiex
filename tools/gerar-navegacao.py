"""Gera o cabeçalho e o rodapé de TODAS as páginas públicas a partir de UMA definição.

Uso (na raiz do projeto):   python tools/gerar-navegacao.py

Cada página tem, entre marcadores, o bloco gerado:
    <!--NAV-->  ...  <!--/NAV-->           cabeçalho
    <!--RODAPE-->  ...  <!--/RODAPE-->     rodapé
Para mudar um nome ou um link do site, edite as listas abaixo e rode o script: todas as páginas ficam iguais.
Os links são absolutos (começam com "/"), então o mesmo bloco funciona em qualquer pasta (inclusive em /demo/ e na página 404).
"""
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent

# ---------------------------------------------------------------- definição única
NAVEGACAO = [  # (endereço, rótulo) -> cabeçalho principal, sempre nesta ordem (WCAG 3.2.3)
    ('/index.html', 'Início'),
    ('/sobre.html', 'Sobre'),
    ('/demo/', 'Demonstração'),
    ('/transparencia.html', 'Transparência'),
]
LEGAL = [('/termos.html', 'Termo de Uso'), ('/privacidade.html', 'Política de Privacidade')]
ACESSO = [('/login.html', 'Sou aluno'), ('/login.html?perfil=professor', 'Sou professor / administrador')]

# página -> (item ativo do cabeçalho ou None, mostra o botão "Entrar"?)
PAGINAS = {
    'index.html': ('/index.html', True),
    'sobre.html': ('/sobre.html', True),
    'demo/index.html': ('/demo/', True),
    'transparencia.html': ('/transparencia.html', True),
    'privacidade.html': (None, True),
    'termos.html': (None, True),
    'login.html': (None, False),      # já está na tela de entrada
    '404.html': (None, True),
}
SEM_RODAPE = {'login.html': False}    # (reservado) todas levam o rodapé padrão


def cabecalho(ativa, entrar):
    itens = []
    for href, rotulo in NAVEGACAO:
        atual = ' aria-current="page"' if href == ativa else ''
        itens.append(f'            <a href="{href}"{atual}>{rotulo}</a>')
    botao = '        <a href="/login.html" class="entrar">Entrar</a>\n' if entrar else ''
    return f'''<!--NAV-->
<header class="site-header">
    <div class="interno">
        <a href="/index.html" class="marca" aria-label="PIBIEX Digital, início">
            <img src="/logo-pibiex-digital-branca.png" alt="PIBIEX Digital">
        </a>
        <nav aria-label="Principal">
{chr(10).join(itens)}
        </nav>
{botao}    </div>
</header>
<!--/NAV-->'''


def rodape():
    def lista(itens):
        return '\n'.join(f'                <li><a href="{h}">{r}</a></li>' for h, r in itens)
    return f'''<!--RODAPE-->
<footer class="site-footer">
    <div class="interno">
        <div class="sobre-rodape">
            <img src="/logo-pibiex-digital-branca.png" alt="PIBIEX Digital">
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


def aplicar(arquivo, ativa, entrar):
    caminho = RAIZ / arquivo
    if not caminho.exists():
        print('pulado (não existe):', arquivo)
        return
    t = caminho.read_text(encoding='utf-8')
    novo_nav, novo_rod = cabecalho(ativa, entrar), rodape()
    if '<!--NAV-->' in t:
        t = re.sub(r'<!--NAV-->.*?<!--/NAV-->', lambda _: novo_nav, t, count=1, flags=re.S)
    else:
        raise SystemExit(f'{arquivo}: sem marcadores <!--NAV--> (coloque-os onde o cabeçalho deve ficar)')
    if '<!--RODAPE-->' in t:
        t = re.sub(r'<!--RODAPE-->.*?<!--/RODAPE-->', lambda _: novo_rod, t, count=1, flags=re.S)
    else:
        raise SystemExit(f'{arquivo}: sem marcadores <!--RODAPE-->')
    caminho.write_text(t, encoding='utf-8', newline='')
    print('ok', arquivo)


if __name__ == '__main__':
    for arq, (ativa, entrar) in PAGINAS.items():
        aplicar(arq, ativa, entrar)
