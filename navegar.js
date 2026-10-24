// /navegar.js — "Ir para…": busca rápida de páginas (Ctrl+K ou "/") para aluno e professor.
// Lê os links do menu lateral que já está na tela, então nunca fica desatualizado em relação ao menu.
(function () {
    if (window.__pibiexNavegar) return;
    window.__pibiexNavegar = true;

    // palavras que as pessoas usam para procurar cada página (além do nome no menu)
    const SINONIMOS = {
        'atividades.html': 'trabalho trabalhos tarefa entregar enviar responder nota correção',
        'notas.html': 'anotações anotacao caderno bloco',
        'frequencia.html': 'presença presenca chamada horas pin',
        'cronograma.html': 'aulas calendário calendario datas horário',
        'conteudo.html': 'material slides pdf aula leitura',
        'chat.html': 'conversa mensagem turma',
        'enquetes.html': 'votação votacao pesquisa resultado',
        'desafios.html': 'ranking pontos semana',
        'galeria.html': 'projetos postagem curtir',
        'prompts.html': 'modelo prompt chatgpt gemini claude perplexity notebooklm',
        'laboratorio-ia.html': 'exercício exercicio problema prática pratica',
        'ferramentas-ia.html': 'ia ferramentas sites',
        'faq.html': 'dúvidas duvidas perguntas ajuda',
        'recursos.html': 'extras vídeos videos ebook',
        'perfil.html': 'conta senha foto dados privacidade acessibilidade',
    };

    const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

    function paginas() {
        const vistos = new Set();
        const lista = [];
        document.querySelectorAll('#sidebar-container a[href], aside a[href]').forEach((a) => {
            const href = a.getAttribute('href');
            if (!href || href.startsWith('http') || href.startsWith('#') || vistos.has(href)) return;
            const nome = (a.textContent || '').replace(/\s+/g, ' ').replace(/\d+$/, '').trim();
            if (!nome) return;
            vistos.add(href);
            const arquivo = href.split('/').pop().split('?')[0];
            lista.push({ nome, href, busca: semAcento(nome + ' ' + (SINONIMOS[arquivo] || '')) });
        });
        const perfil = document.querySelector('a[href="perfil.html"]');
        if (perfil && !vistos.has('perfil.html')) lista.push({ nome: 'Meu Perfil', href: 'perfil.html', busca: semAcento('Meu Perfil ' + SINONIMOS['perfil.html']) });
        return lista;
    }

    let caixa = null;
    let anterior = null;

    function fechar() {
        if (!caixa) return;
        caixa.remove();
        caixa = null;
        if (anterior && anterior.focus) anterior.focus();
    }

    function abrir() {
        if (caixa) { fechar(); return; }
        const todas = paginas();
        if (!todas.length) return;
        anterior = document.activeElement;

        caixa = document.createElement('div');
        caixa.className = 'nav-fundo';
        caixa.innerHTML = `
            <div class="nav-janela" role="dialog" aria-modal="true" aria-label="Ir para uma página">
                <input type="search" class="nav-busca" placeholder="Para onde você quer ir?" aria-label="Buscar página" autocomplete="off"
                       role="combobox" aria-expanded="true" aria-controls="nav-lista">
                <ul id="nav-lista" class="nav-lista" role="listbox"></ul>
                <p class="nav-dica">↑ ↓ para escolher · Enter para abrir · Esc para fechar</p>
            </div>`;
        document.body.appendChild(caixa);

        const campo = caixa.querySelector('.nav-busca');
        const ul = caixa.querySelector('.nav-lista');
        let achadas = todas;
        let sel = 0;

        function desenhar() {
            ul.innerHTML = achadas.length
                ? achadas.map((p, i) => `<li role="option" id="nav-op-${i}" aria-selected="${i === sel}" data-i="${i}">${p.nome.replace(/</g, '&lt;')}</li>`).join('')
                : '<li class="nav-vazio">Nenhuma página encontrada</li>';
            const atual = ul.querySelector('[aria-selected="true"]');
            if (atual) { campo.setAttribute('aria-activedescendant', atual.id); atual.scrollIntoView({ block: 'nearest' }); }
        }
        function filtrar() {
            const termos = semAcento(campo.value).split(/\s+/).filter(Boolean);
            achadas = todas.filter((p) => termos.every((t) => p.busca.includes(t)));
            sel = 0;
            desenhar();
        }
        function ir(i) { const p = achadas[i]; if (p) location.href = p.href; }

        campo.addEventListener('input', filtrar);
        campo.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(achadas.length - 1, sel + 1); desenhar(); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); desenhar(); }
            else if (e.key === 'Enter') { e.preventDefault(); ir(sel); }
            else if (e.key === 'Escape') { e.preventDefault(); fechar(); }
        });
        ul.addEventListener('click', (e) => { const li = e.target.closest('[data-i]'); if (li) ir(Number(li.dataset.i)); });
        caixa.addEventListener('mousedown', (e) => { if (e.target === caixa) fechar(); });
        desenhar();
        campo.focus();
    }

    // estilo (usa as cores do tema; funciona em alto contraste)
    const st = document.createElement('style');
    st.textContent = `
        .nav-fundo { position: fixed; inset: 0; z-index: 2147483000; background: rgba(15,23,42,.5); display: flex; align-items: flex-start; justify-content: center; padding: 12vh 16px 16px; }
        .nav-janela { width: min(520px, 100%); background: #fff; color: #111827; border-radius: 16px; box-shadow: 0 20px 50px rgba(0,0,0,.3); overflow: hidden; font-family: 'Inter', system-ui, sans-serif; }
        .nav-busca { width: 100%; border: 0; border-bottom: 1px solid #E5E7EB; padding: 16px 18px; font-size: 16px; outline: none; background: #fff; color: #111827; }
        .nav-lista { list-style: none; margin: 0; padding: 6px; max-height: 50vh; overflow-y: auto; }
        .nav-lista li { padding: 11px 14px; border-radius: 10px; font-size: 14.5px; font-weight: 600; cursor: pointer; }
        .nav-lista li[aria-selected="true"] { background: #1E3A8A; color: #fff; }
        .nav-lista li.nav-vazio { cursor: default; color: #4B5563; font-weight: 500; }
        .nav-dica { margin: 0; padding: 9px 16px; font-size: 11.5px; color: #4B5563; background: #F8FAFC; border-top: 1px solid #E5E7EB; }
        .nav-botao { display: inline-flex; align-items: center; gap: 8px; border: 1px solid #CBD5E1; background: #fff; color: #374151; border-radius: 999px; padding: 7px 12px; font: 600 12.5px 'Inter', system-ui, sans-serif; cursor: pointer; }
        .nav-botao:hover { background: #F1F5F9; }
        .nav-botao kbd { font: 700 10.5px 'Inter', system-ui, sans-serif; background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 5px; padding: 1px 5px; color: #475569; }
        @media (max-width: 1240px) { .nav-botao kbd, .nav-botao .nav-txt { display: none; } .nav-botao { padding: 8px 10px; } }
        html.a11y-contraste .nav-janela { border: 2px solid #000; }
        html.a11y-contraste .nav-botao { border: 2px solid #111827; }
    `;
    document.head.appendChild(st);

    document.addEventListener('keydown', (e) => {
        const digitando = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target && e.target.tagName) || '') || (e.target && e.target.isContentEditable);
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); abrir(); }
        else if (e.key === '/' && !digitando && !e.ctrlKey && !e.altKey && !e.metaKey) { e.preventDefault(); abrir(); }
    });

    // botão "Ir para…" no topo da página (espera o topo e o menu serem desenhados)
    function colocarBotao() {
        const topo = document.getElementById('topo-pagina');
        if (!topo || document.querySelector('.nav-botao') || !paginas().length) return false;
        const lado = topo.querySelector(':scope > div:last-child');
        if (!lado) return false;
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'nav-botao';
        b.setAttribute('aria-label', 'Ir para uma página (Ctrl+K)');
        b.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg><span class="nav-txt">Ir para…</span><kbd>Ctrl K</kbd>';
        b.onclick = abrir;
        lado.insertBefore(b, lado.firstChild);
        return true;
    }
    let tentativas = 0;
    const timer = setInterval(() => { if (colocarBotao() || ++tentativas > 40) clearInterval(timer); }, 250);
})();
