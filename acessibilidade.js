// /acessibilidade.js
//
// Preferências de acessibilidade e pequenos ajustes de leitura, para TODAS as páginas.
//
//  - Alto contraste, tamanho do texto e menos animações (guardados só neste aparelho,
//    em localStorage "pibiex_prefs"; nada vai para o servidor).
//  - Link "Pular para o conteúdo", aria-current no menu e rótulos automáticos em campos
//    que só têm placeholder.
//  - PibiexA11y.montarPainel(elemento): desenha o cartão "Aparência e acessibilidade"
//    (usado em Perfil). PibiexA11y.itemDoMenu(): interruptor rápido para o menu da conta.
//
// Carregado no <head> para a preferência valer antes de a página aparecer (sem "piscar").

(function () {
    const CHAVE = 'pibiex_prefs';
    const raiz = document.documentElement;

    function ler() {
        try {
            const p = JSON.parse(localStorage.getItem(CHAVE) || '{}');
            return {
                contraste: typeof p.contraste === 'boolean' ? p.contraste : null, // null = seguir o sistema
                texto: [0, 1, 2].includes(p.texto) ? p.texto : 0,
                semMovimento: typeof p.semMovimento === 'boolean' ? p.semMovimento : null,
            };
        } catch (e) { return { contraste: null, texto: 0, semMovimento: null }; }
    }

    function gravar(p) {
        try { localStorage.setItem(CHAVE, JSON.stringify(p)); } catch (e) { /* sem armazenamento: vale só nesta página */ }
    }

    function sistemaPedeContraste() {
        return !!(window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches);
    }

    function aplicar(p) {
        const contraste = p.contraste === null ? sistemaPedeContraste() : p.contraste;
        raiz.classList.toggle('a11y-contraste', contraste);
        raiz.classList.toggle('a11y-texto-1', p.texto === 1);
        raiz.classList.toggle('a11y-texto-2', p.texto === 2);
        raiz.classList.toggle('a11y-sem-movimento', p.semMovimento === true);
        document.dispatchEvent(new CustomEvent('pibiex:a11y', { detail: { contraste, texto: p.texto, semMovimento: p.semMovimento === true } }));
    }

    function estado() {
        const p = ler();
        return {
            contraste: p.contraste === null ? sistemaPedeContraste() : p.contraste,
            texto: p.texto,
            semMovimento: p.semMovimento === true,
        };
    }

    function mudar(parcial) {
        const p = { ...ler(), ...parcial };
        gravar(p);
        aplicar(p);
    }

    aplicar(ler());

    // ------------------------------------------------------------------
    // Ícones usados no cartão
    // ------------------------------------------------------------------
    const ICO = {
        olho: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18" /><path d="M12 3a9 9 0 0 1 0 18" fill="currentColor"/></svg>',
    };

    // ------------------------------------------------------------------
    // Cartão "Aparência e acessibilidade" (Perfil)
    // ------------------------------------------------------------------
    function montarPainel(el) {
        if (!el) return;
        el.innerHTML = `
            <section class="a11y-card" id="acessibilidade" aria-labelledby="a11y-titulo">
                <div class="a11y-card-topo">
                    <span class="icone">${ICO.olho}</span>
                    <div><h2 id="a11y-titulo">Aparência e acessibilidade</h2><p>Ajuste a plataforma para ler com mais conforto. Vale só neste aparelho.</p></div>
                </div>

                <div class="a11y-linha">
                    <div class="texto"><p class="titulo" id="a11y-t1">Alto contraste</p>
                        <p class="desc">Cores mais fortes, bordas marcadas e textos mais escuros, para ler com menos esforço.</p></div>
                    <button type="button" class="a11y-chave" role="switch" id="a11y-contraste" aria-labelledby="a11y-t1" aria-checked="false"></button>
                </div>

                <div class="a11y-linha">
                    <div class="texto"><p class="titulo" id="a11y-t2">Tamanho do texto</p>
                        <p class="desc">Aumenta todas as letras da plataforma.</p></div>
                    <div class="a11y-segmentos" role="radiogroup" aria-labelledby="a11y-t2">
                        <button type="button" role="radio" data-texto="0" aria-checked="false" aria-label="Padrão" style="font-size:14px">A</button>
                        <button type="button" role="radio" data-texto="1" aria-checked="false" aria-label="Grande" style="font-size:17px">A</button>
                        <button type="button" role="radio" data-texto="2" aria-checked="false" aria-label="Maior" style="font-size:20px">A</button>
                    </div>
                </div>

                <div class="a11y-linha">
                    <div class="texto"><p class="titulo" id="a11y-t3">Reduzir animações</p>
                        <p class="desc">Para as transições, os efeitos de movimento e as barras animadas.</p></div>
                    <button type="button" class="a11y-chave" role="switch" id="a11y-movimento" aria-labelledby="a11y-t3" aria-checked="false"></button>
                </div>

                <div class="a11y-previa" aria-live="polite">
                    <b>Prévia do texto</b>
                    <span>É assim que os textos secundários, as legendas e as bordas aparecem com as suas escolhas.</span>
                </div>
                <div class="a11y-rodape"><button type="button" class="a11y-restaurar" id="a11y-restaurar">Restaurar o padrão</button></div>
            </section>`;

        const chaveContraste = el.querySelector('#a11y-contraste');
        const chaveMov = el.querySelector('#a11y-movimento');
        const segmentos = [...el.querySelectorAll('[data-texto]')];

        function desenhar() {
            const e = estado();
            chaveContraste.setAttribute('aria-checked', String(e.contraste));
            chaveMov.setAttribute('aria-checked', String(e.semMovimento));
            segmentos.forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.texto) === e.texto)));
        }

        chaveContraste.onclick = () => { mudar({ contraste: !estado().contraste }); desenhar(); };
        chaveMov.onclick = () => { mudar({ semMovimento: !estado().semMovimento }); desenhar(); };
        segmentos.forEach((b) => { b.onclick = () => { mudar({ texto: Number(b.dataset.texto) }); desenhar(); }; });
        el.querySelector('#a11y-restaurar').onclick = () => {
            try { localStorage.removeItem(CHAVE); } catch (e) { /* ok */ }
            aplicar(ler());
            desenhar();
        };
        document.addEventListener('pibiex:a11y', desenhar);
        desenhar();
    }

    // Interruptor rápido de contraste para o menu da conta (topo da página).
    function itemDoMenu() {
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'a11y-menu-item';
        botao.setAttribute('role', 'menuitemcheckbox');
        botao.innerHTML = '<span>Alto contraste</span><span class="a11y-chave" aria-hidden="true"></span>';
        const chave = botao.querySelector('.a11y-chave');
        const desenhar = () => {
            const ligado = estado().contraste;
            botao.setAttribute('aria-checked', String(ligado));
            chave.setAttribute('aria-checked', String(ligado));
        };
        botao.onclick = (e) => { e.stopPropagation(); mudar({ contraste: !estado().contraste }); };
        document.addEventListener('pibiex:a11y', desenhar);
        desenhar();
        return botao;
    }

    // ------------------------------------------------------------------
    // Avisos na tela no lugar da janelinha do navegador (alert). Mais discretos, não
    // travam a página e são lidos por leitores de tela (role="status" / "alert").
    // ------------------------------------------------------------------
    function mostrarAviso(mensagem) {
        const texto = String(mensagem == null ? '' : mensagem);
        let caixa = document.querySelector('.pibiex-avisos');
        if (!caixa) {
            if (!document.body) { return; }
            caixa = document.createElement('div');
            caixa.className = 'pibiex-avisos';
            document.body.appendChild(caixa);
        }
        const erro = /erro|n[ãa]o foi poss[ií]vel|inv[áa]lid|falha|incorret|sem permiss|expirad|recusad|n[ãa]o p[oô]de/i.test(texto);
        const aviso = document.createElement('div');
        aviso.className = 'pibiex-aviso' + (erro ? ' erro' : '');
        aviso.setAttribute('role', erro ? 'alert' : 'status');
        const span = document.createElement('span');
        span.textContent = texto;
        const fechar = document.createElement('button');
        fechar.type = 'button';
        fechar.setAttribute('aria-label', 'Fechar aviso');
        fechar.textContent = '×';
        const sumir = () => { aviso.classList.add('saindo'); setTimeout(() => aviso.remove(), 200); };
        fechar.onclick = sumir;
        aviso.append(span, fechar);
        caixa.appendChild(aviso);
        setTimeout(sumir, erro ? 9000 : 5500);
    }
    window.alert = mostrarAviso;

    window.PibiexA11y = { estado, mudar, montarPainel, itemDoMenu, aviso: mostrarAviso };

    // ------------------------------------------------------------------
    // Ajustes de leitura (depois que a página existe)
    // ------------------------------------------------------------------
    function iniciar() {
        const principal = document.querySelector('main');
        if (principal && !document.querySelector('.pular-conteudo')) {
            if (!principal.id) principal.id = 'conteudo-principal';
            principal.setAttribute('tabindex', '-1');
            const link = document.createElement('a');
            link.className = 'pular-conteudo';
            link.href = '#' + principal.id;
            link.textContent = 'Pular para o conteúdo';
            link.addEventListener('click', () => setTimeout(() => principal.focus(), 0));
            document.body.insertBefore(link, document.body.firstChild);
        }

        let agendado = null;
        function ajustar() {
            // menu lateral: marca a página atual
            document.querySelectorAll('#sidebar-container a[href]').forEach((a) => {
                try {
                    const mesma = new URL(a.href, location.href).pathname === location.pathname;
                    if (mesma) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
                } catch (e) { /* href estranho: ignora */ }
            });
            // campos sem rótulo ganham um a partir do placeholder/título
            document.querySelectorAll('input:not([type="hidden"]):not([aria-label]):not([aria-labelledby]), textarea:not([aria-label]):not([aria-labelledby]), select:not([aria-label]):not([aria-labelledby])').forEach((c) => {
                if (c.closest('label') || (c.id && document.querySelector('label[for="' + CSS.escape(c.id) + '"]'))) return;
                const nome = c.getAttribute('placeholder') || c.getAttribute('title') || '';
                if (nome) c.setAttribute('aria-label', nome);
            });
            // mensagens de "lista vazia" ganham o visual de estado vazio
            document.querySelectorAll('p:not(.estado-vazio)').forEach((pp) => {
                if (pp.children.length) return;
                const tx = pp.textContent.trim();
                if (tx.length < 120 && /^(Nenhum[a]?.*(ainda|no momento|por enquanto|nesta|neste|nessa|nesse)|Ainda n[ãa]o h[áa])/i.test(tx)) pp.classList.add('estado-vazio');
            });
            // botões e links só com ícone ganham o nome do atributo title
            document.querySelectorAll('button:not([aria-label]), a:not([aria-label])').forEach((b) => {
                if (!b.textContent.trim() && b.getAttribute('title')) b.setAttribute('aria-label', b.getAttribute('title'));
            });
        }
        try { ajustar(); } catch (e) { console.warn('pibiex a11y:', e); }
        // Sem "clearTimeout": se a página muda o tempo todo, o ajuste ainda roda a cada 250 ms.
        new MutationObserver(() => {
            if (agendado) return;
            agendado = setTimeout(() => { agendado = null; try { ajustar(); } catch (e) { console.warn('pibiex a11y:', e); } }, 250);
        }).observe(document.body, { childList: true, subtree: true });

        // /perfil.html#acessibilidade: leva até o cartão
        if (location.hash === '#acessibilidade') setTimeout(() => { const c = document.getElementById('acessibilidade'); if (c) c.scrollIntoView({ block: 'start' }); }, 400);
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
