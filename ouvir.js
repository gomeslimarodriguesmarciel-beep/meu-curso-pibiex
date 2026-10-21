// /ouvir.js
//
// Leitura em voz alta da página ("Ouvir a página"), parte do botão de acessibilidade.
//
// Usa a voz do próprio navegador (Web Speech API): é gratuita, não passa por nenhum servidor da
// plataforma e não tem limite de uso. A qualidade depende do aparelho; o programa escolhe sozinho a
// voz em português mais natural que existir (no Edge e no Chrome costumam vir vozes neurais).
// Atenção: vozes marcadas como "online" geram o áudio no serviço do fabricante do navegador
// (Microsoft ou Google), então o texto lido sai do aparelho. As vozes "neste aparelho" não.
//
// Carregado sob demanda por /acessibilidade.js (só quando alguém abre as opções de voz, usa o atalho
// Alt+L, ou já deixou "Ler o que eu apontar" ligado).
//
// Modos:
//   - pagina(): lê o conteúdo principal, do começo ao fim, com destaque no trecho atual
//   - daqui():  lê a partir do que está na tela agora
//   - apontar:  (opcional) lê só o trecho sobre o qual o mouse para, o que recebe foco pelo teclado,
//               o texto em que se toca, ou o texto selecionado
// O painel de controle (anterior, pausar, próximo, parar, velocidade, "só esta seção") aparece enquanto fala.

(function () {
    if (window.PibiexOuvir) return;

    const sintese = window.speechSynthesis;
    const suportado = !!(sintese && window.SpeechSynthesisUtterance);

    const A11y = () => window.PibiexA11y;
    const movimentoReduzido = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) || document.documentElement.classList.contains('a11y-sem-movimento');

    // ------------------------------------------------------------------
    // Vozes
    // ------------------------------------------------------------------
    let cacheVozes = [];

    function pontuar(v) {
        const nome = (v.name || '').toLowerCase();
        let p = 0;
        if (/^pt-br/i.test(v.lang) || /pt_br/i.test(v.lang)) p += 40;
        else if (/^pt/i.test(v.lang)) p += 10;
        if (/natural|neural|multilíngue|multilingue/.test(nome)) p += 100;
        if (/francisca|antônio|antonio|thalita|raquel|duarte|fernanda|luciana|camila|vitoria|vitória/.test(nome)) p += 15;
        if (/google/.test(nome)) p += 55;
        if (/online/.test(nome)) p += 20;
        if (/maria|daniel|felipe|heloisa|helena/.test(nome)) p += 5;
        if (/compact|eloquence|espeak/.test(nome)) p -= 40;
        return p;
    }

    function lerVozes() {
        if (!suportado) return [];
        const todas = sintese.getVoices() || [];
        const pt = todas.filter((v) => /^pt/i.test(v.lang) || /portugu/i.test(v.name));
        cacheVozes = pt.map((v) => ({ voz: v, nome: v.name, lang: v.lang, local: !!v.localService, pontos: pontuar(v) }))
            .sort((a, b) => b.pontos - a.pontos);
        return cacheVozes;
    }

    function vozes() { return cacheVozes.length ? cacheVozes : lerVozes(); }

    // Chrome e Edge entregam as vozes depois, de forma assíncrona.
    function aguardarVozes() {
        return new Promise((resolve) => {
            if (!suportado) return resolve([]);
            const v = lerVozes();
            if (v.length) return resolve(v);
            let pronto = false;
            const fim = () => { if (pronto) return; pronto = true; resolve(lerVozes()); };
            sintese.addEventListener('voiceschanged', fim, { once: true });
            setTimeout(fim, 1500);
        });
    }

    function escolherVoz() {
        const lista = vozes();
        if (!lista.length) return null;
        const pref = A11y() && A11y().estado().voz;
        const marcada = pref && lista.find((v) => v.nome === pref);
        return (marcada || lista[0]).voz;
    }

    // ------------------------------------------------------------------
    // Extração do texto da página em "trechos" (títulos, parágrafos, itens, botões, campos...)
    // ------------------------------------------------------------------
    const IGNORAR = 'script,style,noscript,template,iframe,canvas,.ouvir-ui,.a11y-pop,.a11y-fab,.a11y-dica,#sim-faixa,.pibiex-avisos,.pular-conteudo,[data-ouvir="nao"],[aria-hidden="true"],[hidden]';
    const CAMPOS = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]),textarea,select';

    function visivel(el) {
        if (!el.isConnected) return false;
        if (typeof el.checkVisibility === 'function') return el.checkVisibility({ visibilityProperty: true });
        return el.getClientRects().length > 0;
    }

    function nomeDoCampo(c) {
        const rot = c.getAttribute('aria-label')
            || (c.id && document.querySelector('label[for="' + CSS.escape(c.id) + '"]') && document.querySelector('label[for="' + CSS.escape(c.id) + '"]').textContent)
            || (c.closest('label') && c.closest('label').textContent)
            || c.getAttribute('placeholder') || c.getAttribute('title') || '';
        const tipo = c.tagName === 'SELECT' ? 'lista de opções' : c.tagName === 'TEXTAREA' ? 'campo de texto' : c.type === 'checkbox' ? 'caixa de marcação' : c.type === 'radio' ? 'opção' : c.type === 'file' ? 'escolher arquivo' : c.type === 'password' ? 'campo de senha' : 'campo';
        let extra = '';
        if (c.type === 'checkbox' || c.type === 'radio') extra = c.checked ? ', marcado' : ', desmarcado';
        else if (c.tagName === 'SELECT' && c.selectedOptions && c.selectedOptions[0]) extra = ', selecionado: ' + c.selectedOptions[0].textContent.trim();
        else if (c.type !== 'password' && c.value && c.type !== 'file') extra = ', escrito: ' + c.value;
        return (tipo + (rot ? ': ' + rot.replace(/\s+/g, ' ').trim() : '') + extra).trim();
    }

    function limpar(t) { return String(t || '').replace(/\s+/g, ' ').trim(); }

    // Cada trecho: { el, texto }. "el" é o elemento que recebe o destaque.
    function extrair(raiz) {
        const itens = [];
        const estilos = new Map();
        const ehBloco = (el) => {
            if (estilos.has(el)) return estilos.get(el);
            const d = getComputedStyle(el).display;
            const r = d !== 'inline' && d !== 'contents' && !d.startsWith('ruby');
            estilos.set(el, r);
            return r;
        };
        const blocoDe = (no) => {
            let e = no.parentElement;
            while (e && e !== raiz.parentElement && !ehBloco(e)) e = e.parentElement;
            e = e || raiz;
            // o texto de um botão, link ou título é um trecho só (ex.: "Sou aluno" + a setinha dentro dele)
            const junto = e.closest && e.closest('button,a[href],[role="button"],[role="tab"],h1,h2,h3,h4,h5,h6');
            if (junto && (junto === raiz || raiz.contains(junto))) return junto;
            return e;
        };
        const proibido = (el) => !!(el.closest && el.closest(IGNORAR));

        let anterior = null;
        const andador = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, {
            acceptNode(n) {
                if (n.nodeType === 1) {
                    if (n.matches(IGNORAR)) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_ACCEPT;
            },
        });
        for (let n = andador.nextNode(); n; n = andador.nextNode()) {
            if (n.nodeType === 1) {
                const el = n;
                if (el.matches(CAMPOS) && visivel(el)) {
                    itens.push({ el, texto: nomeDoCampo(el) });
                    anterior = null;
                } else if (el.tagName === 'IMG' && limpar(el.alt) && visivel(el)) {
                    itens.push({ el, texto: 'Imagem: ' + limpar(el.alt) });
                    anterior = null;
                } else if (el.matches('button,a[href],[role="button"],[role="tab"]') && !limpar(el.textContent) && el.getAttribute('aria-label') && visivel(el)) {
                    itens.push({ el, texto: limpar(el.getAttribute('aria-label')) + (el.tagName === 'A' ? ', link' : ', botão') });
                    anterior = null;
                }
                continue;
            }
            const texto = limpar(n.nodeValue);
            if (!texto) continue;
            const pai = n.parentElement;
            if (!pai || proibido(pai)) continue;
            const bloco = blocoDe(n);
            if (!bloco || !visivel(bloco)) continue;
            // texto dentro de <details> fechado, fora do <summary>, não está na tela
            const det = pai.closest('details');
            if (det && !det.open && !pai.closest('summary')) continue;
            if (anterior && anterior.el === bloco) { anterior.texto += ' ' + texto; continue; }
            anterior = { el: bloco, texto };
            itens.push(anterior);
        }

        // sufixo "botão" / "link" quando o trecho é o próprio controle
        itens.forEach((it) => {
            const e = it.el;
            if (e.matches && e.matches('button,[role="button"]') && !/, botão$/.test(it.texto)) it.texto += ', botão';
            else if (e.matches && e.matches('a[href]') && !/, link$/.test(it.texto)) it.texto += ', link';
        });
        // trechos só de símbolo (setas, ×, ·) não valem a pena
        return itens.filter((it) => /[\p{L}\p{N}]/u.test(it.texto));
    }

    function raizDaPagina() {
        return document.querySelector('main') || document.body;
    }

    // ------------------------------------------------------------------
    // Fala (em pedaços curtos: evita o corte que o Chrome faz em textos longos)
    // ------------------------------------------------------------------
    function pedacos(texto, max) {
        const sentencas = texto.split(/(?<=[.!?…:;])\s+/);
        const saida = [];
        let atual = '';
        const empurrar = (s) => {
            while (s.length > max) {
                let corte = s.lastIndexOf(', ', max);
                if (corte < max * 0.4) corte = s.lastIndexOf(' ', max);
                if (corte < 1) corte = max;
                saida.push(s.slice(0, corte + 1).trim());
                s = s.slice(corte + 1).trim();
            }
            if (s) saida.push(s);
        };
        sentencas.forEach((s) => {
            if ((atual + ' ' + s).trim().length <= max) atual = (atual + ' ' + s).trim();
            else { if (atual) saida.push(atual); atual = ''; empurrar(s); }
        });
        if (atual) saida.push(atual);
        return saida.length ? saida : [texto];
    }

    let fila = [];             // trechos que serão lidos
    let indice = -1;           // trecho atual
    let pedacoAtual = 0;
    let falando = false;
    let pausado = false;
    let ficha = 0;             // muda a cada parar/pular, para ignorar eventos atrasados
    let limiteFim = null;      // índice do último trecho permitido ("só esta seção")
    let modoUnico = false;     // lendo um trecho só (apontar)
    let bloqueadoPorGesto = false;
    let destaque = null;

    function velocidade() { return (A11y() && A11y().estado().velocidade) || 1; }

    function destacar(el) {
        if (destaque) destaque.classList.remove('ouvir-atual');
        destaque = el || null;
        if (!el) return;
        el.classList.add('ouvir-atual');
        const r = el.getBoundingClientRect();
        if (r.top < 70 || r.bottom > window.innerHeight - 90) {
            el.scrollIntoView({ block: 'center', behavior: movimentoReduzido() ? 'auto' : 'smooth' });
        }
    }

    function falarPedaco(partes, i, minhaFicha, aoFim) {
        if (minhaFicha !== ficha) return;
        if (i >= partes.length) { aoFim(); return; }
        pedacoAtual = i;
        const u = new SpeechSynthesisUtterance(partes[i]);
        const v = escolherVoz();
        if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'pt-BR'; }
        u.rate = velocidade();
        u.onend = () => { if (minhaFicha === ficha) falarPedaco(partes, i + 1, minhaFicha, aoFim); };
        u.onerror = (e) => {
            if (minhaFicha !== ficha) return;
            if (e.error === 'interrupted' || e.error === 'canceled') return;
            if (e.error === 'not-allowed') {
                bloqueadoPorGesto = true;
                if (A11y() && A11y().aviso) A11y().aviso('O navegador pediu um clique para liberar a voz. Clique em qualquer lugar da página e tente de novo.');
                const liberar = () => { bloqueadoPorGesto = false; document.removeEventListener('pointerdown', liberar, true); document.removeEventListener('keydown', liberar, true); };
                document.addEventListener('pointerdown', liberar, true);
                document.addEventListener('keydown', liberar, true);
                parar();
                return;
            }
            falarPedaco(partes, i + 1, minhaFicha, aoFim);
        };
        try { sintese.speak(u); } catch (e) { parar(); }
    }

    function lerTrecho(i) {
        if (i < 0 || i >= fila.length || (limiteFim !== null && i > limiteFim)) { parar(); return; }
        indice = i;
        const it = fila[i];
        const minhaFicha = ++ficha;
        sintese.cancel();
        falando = true; pausado = false;
        destacar(it.el);
        atualizarPlayer();
        const partes = pedacos(it.texto, 200);
        falarPedaco(partes, 0, minhaFicha, () => {
            if (modoUnico) { parar(); return; }
            lerTrecho(i + 1);
        });
    }

    function iniciar(itens, deIndice, unico) {
        if (!suportado) return;
        if (!itens.length) { if (A11y() && A11y().aviso) A11y().aviso('Não encontrei texto para ler nesta parte da página.'); return; }
        ficha++;
        sintese.cancel();
        fila = itens; modoUnico = !!unico; limiteFim = null;
        mostrarPlayer(!unico);
        lerTrecho(deIndice || 0);
    }

    function parar() {
        ficha++;
        if (suportado) sintese.cancel();
        falando = false; pausado = false; modoUnico = false; limiteFim = null;
        destacar(null);
        esconderPlayer();
    }

    // "Pausar" = cancelar e guardar o ponto; "continuar" = recomeçar do pedaço em que parou.
    // (O pause() nativo falha em vários aparelhos, principalmente no Android.)
    function alternarPausa() {
        if (!falando && !pausado) return;
        if (!pausado) {
            const meuIndice = indice, meuPedaco = pedacoAtual;
            ficha++;
            sintese.cancel();
            pausado = true; falando = false;
            retomada = { indice: meuIndice, pedaco: meuPedaco };
        } else {
            const r = retomada; pausado = false; falando = true;
            const minhaFicha = ++ficha;
            const it = fila[r.indice];
            const partes = pedacos(it.texto, 200);
            destacar(it.el);
            falarPedaco(partes, r.pedaco, minhaFicha, () => { if (modoUnico) parar(); else lerTrecho(r.indice + 1); });
        }
        atualizarPlayer();
    }
    let retomada = { indice: 0, pedaco: 0 };

    function proximo() { if (fila.length && indice < fila.length - 1) { pausado = false; lerTrecho(indice + 1); } }
    function anteriorTrecho() { if (fila.length && indice > 0) { pausado = false; lerTrecho(indice - 1); } }

    // ------------------------------------------------------------------
    // Pontos de partida
    // ------------------------------------------------------------------
    function pagina() {
        const itens = extrair(raizDaPagina());
        iniciar(itens, 0, false);
    }

    function daqui() {
        const itens = extrair(raizDaPagina());
        let i = itens.findIndex((it) => { const r = it.el.getBoundingClientRect(); return r.bottom > 70 && r.top < window.innerHeight; });
        if (i < 0) i = 0;
        iniciar(itens, i, false);
    }

    function trechoUnico(el) {
        // controles e imagens não têm texto "dentro": o texto vem do nome deles
        if (el.matches(CAMPOS)) { iniciar([{ el, texto: nomeDoCampo(el) }], 0, true); return; }
        if (el.tagName === 'IMG') { if (limpar(el.alt)) iniciar([{ el, texto: 'Imagem: ' + limpar(el.alt) }], 0, true); return; }
        if (!limpar(el.textContent) && el.getAttribute('aria-label')) {
            iniciar([{ el, texto: limpar(el.getAttribute('aria-label')) + (el.tagName === 'A' ? ', link' : ', botão') }], 0, true);
            return;
        }
        const itens = extrair(el).filter((it) => it.el === el || el.contains(it.el));
        if (!itens.length) return;
        // lê só o que está diretamente neste elemento
        const proprios = itens.filter((it) => it.el === el);
        iniciar(proprios.length ? proprios : itens.slice(0, 1), 0, true);
    }

    function selecao() {
        const t = limpar(window.getSelection ? window.getSelection().toString() : '');
        if (!t) return false;
        iniciar([{ el: null, texto: t }], 0, true);
        return true;
    }

    function testarVoz() {
        const v = escolherVoz();
        iniciar([{ el: null, texto: 'Olá! Esta é a voz que vai ler a página para você.' }], 0, true);
        return v;
    }

    // ------------------------------------------------------------------
    // "Ler o que eu apontar"
    // ------------------------------------------------------------------
    let apontando = false;
    let espera = null;
    let ultimoAlvo = null;

    function blocoApontado(alvo) {
        if (!alvo || !alvo.closest || alvo.closest(IGNORAR)) return null;
        // controles ou o bloco de texto mais próximo
        const controle = alvo.closest('button,a[href],[role="button"],[role="tab"],input,textarea,select,summary,img[alt]');
        if (controle) return controle;
        let e = alvo;
        while (e && e !== document.body) {
            const d = getComputedStyle(e).display;
            if (d !== 'inline' && d !== 'contents') break;
            e = e.parentElement;
        }
        if (!e || e === document.body || e === document.documentElement) return null;
        // só vale se o elemento tem texto próprio (e não é um contêiner grande)
        const proprio = Array.from(e.childNodes).some((n) => (n.nodeType === 3 && limpar(n.nodeValue)) || (n.nodeType === 1 && getComputedStyle(n).display === 'inline' && limpar(n.textContent)));
        return proprio ? e : null;
    }

    function aoPassar(ev) {
        if (!apontando) return;
        const bloco = blocoApontado(ev.target);
        clearTimeout(espera);
        if (!bloco || bloco === ultimoAlvo) return;
        espera = setTimeout(() => { ultimoAlvo = bloco; trechoUnico(bloco); }, 550);
    }
    function aoSairDoMouse() { clearTimeout(espera); }
    function aoFocar(ev) {
        if (!apontando) return;
        const alvo = ev.target;
        if (!alvo || !alvo.closest || alvo.closest(IGNORAR)) return;
        ultimoAlvo = alvo;
        trechoUnico(alvo);
    }
    function aoTocar(ev) {
        if (!apontando || !window.matchMedia('(pointer: coarse)').matches) return;
        // toque em texto comum lê o trecho; botões e links seguem funcionando normalmente
        if (ev.target.closest && ev.target.closest('button,a[href],input,textarea,select,summary,[role="button"],[role="tab"],label')) return;
        const bloco = blocoApontado(ev.target);
        if (bloco) trechoUnico(bloco);
    }
    function aoSoltarMouse() {
        if (!apontando) return;
        setTimeout(() => { selecao(); }, 50);
    }

    function ligarApontar(ligado) {
        if (ligado === apontando) return;
        apontando = !!ligado;
        const f = ligado ? document.addEventListener.bind(document) : document.removeEventListener.bind(document);
        f('mouseover', aoPassar, true);
        f('mouseout', aoSairDoMouse, true);
        f('focusin', aoFocar, true);
        f('click', aoTocar, true);
        f('mouseup', aoSoltarMouse, true);
        if (!ligado) { clearTimeout(espera); ultimoAlvo = null; if (modoUnico) parar(); }
    }

    // ------------------------------------------------------------------
    // Barra de controle (aparece enquanto fala)
    // ------------------------------------------------------------------
    let player = null;
    const ico = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">${d}</svg>`;
    const ICONES = {
        ant: ico('<path d="M6 6h2v12H6zM9.5 12 18 18V6z"/>'),
        prox: ico('<path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/>'),
        pausa: ico('<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>'),
        tocar: ico('<path d="M8 5v14l11-7z"/>'),
        parar: ico('<path d="M6 6h12v12H6z"/>'),
    };

    function mostrarPlayer(completo) {
        if (!player) {
            player = document.createElement('div');
            player.className = 'ouvir-ui ouvir-player';
            player.setAttribute('role', 'region');
            player.setAttribute('aria-label', 'Leitura em voz alta');
            player.innerHTML = `
                <button type="button" data-a="ant" aria-label="Trecho anterior" title="Trecho anterior">${ICONES.ant}</button>
                <button type="button" data-a="pp" class="principal" aria-label="Pausar" title="Pausar ou continuar"></button>
                <button type="button" data-a="prox" aria-label="Próximo trecho" title="Próximo trecho">${ICONES.prox}</button>
                <button type="button" data-a="parar" aria-label="Parar a leitura" title="Parar">${ICONES.parar}</button>
                <span class="ouvir-trecho"></span>
                <button type="button" data-a="vel" class="vel" aria-label="Velocidade" title="Mudar a velocidade"></button>
                <label class="ouvir-secao"><input type="checkbox" data-a="secao"> Só esta seção</label>`;
            player.addEventListener('click', (e) => {
                const b = e.target.closest('button[data-a]');
                if (!b) return;
                const a = b.dataset.a;
                if (a === 'ant') anteriorTrecho();
                else if (a === 'prox') proximo();
                else if (a === 'pp') alternarPausa();
                else if (a === 'parar') parar();
                else if (a === 'vel') ciclarVelocidade();
            });
            player.querySelector('[data-a="secao"]').addEventListener('change', (e) => {
                if (e.target.checked) {
                    const atual = fila[indice] && fila[indice].el;
                    const raiz = atual && atual.closest ? atual.closest('details, article, section, .cx, [role="dialog"], main') : null;
                    if (raiz) { let ult = indice; fila.forEach((it, i) => { if (it.el && raiz.contains(it.el)) ult = Math.max(ult, i); }); limiteFim = ult; }
                } else { limiteFim = null; }
            });
            document.body.appendChild(player);
        }
        player.hidden = false;
        player.classList.toggle('ouvir-simples', !completo);
        player.querySelector('[data-a="secao"]').checked = false;
        atualizarPlayer();
    }

    function esconderPlayer() { if (player) player.hidden = true; }

    function atualizarPlayer() {
        if (!player || player.hidden) return;
        const pp = player.querySelector('[data-a="pp"]');
        pp.innerHTML = pausado ? ICONES.tocar : ICONES.pausa;
        pp.setAttribute('aria-label', pausado ? 'Continuar' : 'Pausar');
        const it = fila[indice];
        player.querySelector('.ouvir-trecho').textContent = it ? (it.texto.length > 70 ? it.texto.slice(0, 68) + '…' : it.texto) : '';
        const vel = player.querySelector('.vel');
        vel.textContent = String(velocidade()).replace('.', ',') + 'x';
        vel.setAttribute('aria-label', 'Velocidade ' + vel.textContent + '. Tocar para mudar.');
        player.classList.toggle('com-aluno-sim', !!document.getElementById('sim-faixa'));
        player.classList.toggle('com-botao', !!document.getElementById('a11y-fab'));
    }

    const VELOCIDADES = [0.75, 1, 1.25, 1.5, 1.75];
    function ciclarVelocidade() {
        const atual = velocidade();
        const prox = VELOCIDADES[(VELOCIDADES.indexOf(atual) + 1) % VELOCIDADES.length] || 1;
        if (A11y()) A11y().mudar({ velocidade: prox });
        atualizarPlayer();
        if (falando && fila[indice]) lerTrecho(indice); // recomeça o trecho já na nova velocidade
    }

    // ------------------------------------------------------------------
    // Atalhos: Esc para a leitura
    // ------------------------------------------------------------------
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && (falando || pausado)) parar();
    });

    window.PibiexOuvir = {
        suportado, vozes, aguardarVozes, pagina, daqui, parar, alternarPausa, testarVoz, ligarApontar, selecao,
        tocando: () => falando || pausado, pausado: () => pausado,
        // para testes e para quem quiser ler um trecho específico
        extrair, trechoUnico,
    };
})();
