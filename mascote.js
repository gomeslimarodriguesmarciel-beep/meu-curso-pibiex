// Mascote da plataforma: o Seri, uma seriema.
// Um só componente no cantinho da tela, igual nas páginas públicas e na área do aluno:
//   - na área do aluno (aluno/shell.js) ele é o botão do assistente de IA;
//   - nas páginas públicas ele só se apresenta e leva para entrar ou ver a demonstração.
// Para um segundo mascote, basta acrescentar outra entrada em MASCOTES e escolher qual usar em ATUAL.
(function () {
    'use strict';

    const MASCOTES = {
        seri: {
            nome: 'Seri',
            video: '/img/mascote/seri-3d.webm',                 // WebM com transparência (Chrome, Edge, Firefox, Android)
            animadoSafari: '/img/mascote/seri-3d-safari.webp',  // Safari e iPhone não mostram transparência em WebM
            parado: '/img/mascote/seri-3d-parado.webp',         // corpo inteiro, sem movimento
            avatar: '/img/mascote/seri-3d-avatar.webp',         // só o rosto, para o botão redondo
            saudacaoTitulo: 'Oi, eu sou o Seri!',
            saudacaoCorpo: 'Sou uma seriema e, sem querer me gabar, sou bem esperto. Pode me fazer qualquer pergunta!',
            saudacaoCorpoCurto: 'Sou uma seriema e posso tirar suas dúvidas. Pode perguntar!',
            aviso: 'Confira minhas respostas e não escreva dados pessoais.',
        },
    };
    const ATUAL = 'seri';
    const dados = () => MASCOTES[ATUAL];

    const classes = () => document.documentElement.classList;

    // Escolha da pessoa em Acessibilidade: "Parado" = botão redondo, sem se mexer e sem falar.
    const opcaoParado = () => classes().contains('a11y-mascote-parado');
    const semImagens = () => classes().contains('a11y-sem-img');

    // Anima só se a pessoa não escolheu "Parado", não pediu menos animação, o aparelho não pede
    // movimento reduzido e a conexão não é de economia de dados.
    function podeAnimar() {
        if (opcaoParado() || classes().contains('a11y-sem-movimento')) return false;
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
        const con = navigator.connection;
        if (con && (con.saveData || /(^|-)2g$/.test(con.effectiveType || ''))) return false;
        return true;
    }

    // 'grande'  : o Seri de corpo inteiro no canto (animado, ou parado se pediram menos animação)
    // 'redondo' : botão redondo com o rosto dele, sem se mexer e sem falar
    // 'comum'   : botão com ícone, só para quem escolheu ocultar imagens
    function modo() {
        if (semImagens()) return 'comum';
        if (opcaoParado()) return 'redondo';
        return 'grande';
    }

    function navegadorSemAlfaWebm() {
        const ua = navigator.userAgent || '';
        return /iP(hone|ad|od)/.test(ua) || (/Safari/.test(ua) && !/Chrome|Chromium|Android|Edg|OPR|Firefox/.test(ua));
    }

    function htmlMidia(animar) {
        const m = dados();
        if (!animar) return `<img src="${m.parado}" alt="" decoding="async">`;
        if (navegadorSemAlfaWebm()) return `<img src="${m.animadoSafari}" alt="" decoding="async">`;
        return `<video muted loop playsinline autoplay disablepictureinpicture tabindex="-1" aria-hidden="true" poster="${m.parado}"><source src="${m.video}" type="video/webm"></video>`;
    }

    // Põe o mascote dentro de "el": primeiro a imagem parada (leve); a animação só entra depois
    // que a página terminou de carregar. Devolve uma função que cancela a animação agendada.
    function montar(el) {
        el.innerHTML = htmlMidia(false);
        if (!podeAnimar()) return () => {};
        const t = setTimeout(() => {
            if (!podeAnimar()) return;
            el.innerHTML = htmlMidia(true);
            const v = el.querySelector('video');
            if (v) {
                v.muted = true;
                v.addEventListener('error', () => { el.innerHTML = htmlMidia(false); }, true);
                const p = v.play(); if (p && p.catch) p.catch(() => { /* sem autoplay: fica a imagem parada */ });
            }
        }, 1200);
        return () => clearTimeout(t);
    }

    // ------------------------------------------------------------------ estilo do canto
    const CSS = `
        .seri-botao { position: fixed; right: 10px; bottom: 4px; z-index: 40; width: 92px; height: 150px; padding: 0; border: 0; background: none; cursor: pointer; border-radius: 14px; transition: transform .2s ease; -webkit-tap-highlight-color: transparent; }
        .seri-botao:hover { transform: translateY(-3px); }
        .seri-botao:focus-visible { outline: 3px solid #1E3A8A; outline-offset: 2px; box-shadow: 0 0 0 6px #fff; }
        .seri-botao img, .seri-botao video { display: block; width: 100%; height: 100%; object-fit: contain; pointer-events: none; }
        .seri-botao.seri-redondo { width: 64px; height: 64px; right: 16px; bottom: 16px; border-radius: 50%; background: #EEF2FF; border: 3px solid #fff; box-shadow: 0 0 0 2px #1E3A8A, 0 8px 20px rgba(15,23,42,.28); overflow: hidden; }
        .seri-botao.seri-redondo img { object-fit: cover; }
        .seri-fala { position: fixed; right: 108px; bottom: 72px; z-index: 40; width: min(272px, calc(100vw - 132px)); background: #fff; color: #111827; border: 1.5px solid #CBD5E1; border-radius: 16px; padding: 12px 34px 12px 14px; box-shadow: 0 10px 30px rgba(15,23,42,.18); font-size: 13.5px; line-height: 1.45; transition: opacity .18s ease, transform .18s ease, visibility 0s linear 0s; }
        .seri-fala[data-aberta="false"] { opacity: 0; visibility: hidden; transform: translateX(8px); transition: opacity .18s ease, transform .18s ease, visibility 0s linear .18s; }
        .seri-fala::after { content: ""; position: absolute; right: -8px; top: calc(50% - 7px); width: 14px; height: 14px; background: #fff; border-right: 1.5px solid #CBD5E1; border-top: 1.5px solid #CBD5E1; transform: rotate(45deg); }
        .seri-fala-texto { margin: 0; }
        .seri-fala-aviso { margin: 6px 0 0; font-size: 12px; color: #4B5563; }
        .seri-fala-acoes { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
        .seri-fala-acao { display: inline-flex; align-items: center; min-height: 36px; padding: 0 14px; border-radius: 999px; font-weight: 800; font-size: 13px; text-decoration: none; background: #1E3A8A; color: #fff; border: 2px solid #1E3A8A; }
        .seri-fala-acao.sec { background: #fff; color: #1E3A8A; }
        .seri-fala-acao:focus-visible { outline: 3px solid #1E3A8A; outline-offset: 2px; }
        .seri-fala-x { position: absolute; top: 4px; right: 6px; width: 28px; height: 28px; border: 0; background: none; border-radius: 50%; font-size: 20px; line-height: 1; color: #4B5563; cursor: pointer; }
        .seri-fala-x:hover { background: #F1F5F9; color: #111827; }
        .seri-fala-x:focus-visible { outline: 3px solid #1E3A8A; outline-offset: 1px; }
        /* Folga no fim da página para nenhum botão ficar escondido atrás do mascote */
        html.seri-ativo body { padding-bottom: 170px !important; }
        #assistente-flutuante.seri-modo #painel-assistente { bottom: 12px; right: 112px; }
        html.a11y-contraste .seri-fala { border-color: #000; color: #000; }
        html.a11y-contraste .seri-fala::after { border-color: #000; }
        html.a11y-sem-movimento .seri-botao, html.a11y-sem-movimento .seri-fala { transition: none; }
        @media (prefers-reduced-motion: reduce) { .seri-botao, .seri-fala { transition: none; } }
        @media (max-width: 640px) {
            .seri-botao { width: 70px; height: 115px; right: 6px; }
            .seri-botao.seri-redondo { width: 56px; height: 56px; right: 12px; bottom: 12px; }
            html.seri-ativo body { padding-bottom: 140px !important; }
            .seri-fala { right: 80px; bottom: 56px; width: min(214px, calc(100vw - 100px)); font-size: 12.5px; line-height: 1.4; padding: 10px 30px 10px 12px; border-radius: 14px; }
            .seri-fala-aviso { display: none; }
            .seri-fala-acao { min-height: 34px; padding: 0 10px; font-size: 12.5px; flex: 1 1 auto; justify-content: center; text-align: center; }
            .seri-fala-acoes { margin-top: 8px; gap: 6px; }
            #assistente-flutuante.seri-modo #painel-assistente { right: 8px; bottom: 76px; width: calc(100vw - 16px); max-width: none; height: min(60vh, 460px); max-height: none; }
            #assistente-flutuante.seri-modo.painel-aberto .seri-botao { display: none; }
        }
    `;
    function injetarCss() {
        if (document.getElementById('seri-css')) return;
        const e = document.createElement('style');
        e.id = 'seri-css'; e.textContent = CSS;
        document.head.appendChild(e);
    }

    // ------------------------------------------------------------------ o canto
    // opcoes: {
    //   raiz         elemento já existente que recebe o botão e o recado (senão cria um <aside> no <body>)
    //   rotulo       nome da área, para leitor de tela
    //   rotuloBotao  nome do botão do Seri, para leitor de tela
    //   aoClicar()   o que acontece ao clicar no Seri
    //   fala({automatico}) devolve { titulo, corpo, aviso, acoes:[{texto,href,sec}], dica } com o texto do recado
    //   bloquearFala() true quando o recado não deve aparecer (ex.: painel do chat aberto)
    //   aoAtualizar(modo) chamado sempre que o aspecto muda
    //   folgaNoFim   dá espaço no fim da página para o mascote não cobrir nada (padrão: true)
    // }
    function canto(opcoes) {
        injetarCss();
        const o = Object.assign({ raiz: null, rotulo: 'Mascote', rotuloBotao: '', aoClicar: () => {}, fala: () => null, bloquearFala: () => false, aoAtualizar: () => {}, folgaNoFim: true }, opcoes);
        const m = dados();
        let raiz = o.raiz;
        if (!raiz) {
            raiz = document.createElement('aside');
            raiz.id = 'assistente-flutuante';
            raiz.setAttribute('aria-label', o.rotulo);
            document.body.appendChild(raiz);
        }

        const botao = document.createElement('button');
        botao.id = 'botao-assistente';
        botao.type = 'button';
        botao.addEventListener('click', () => o.aoClicar());
        raiz.appendChild(botao);

        const fala = document.createElement('div');
        fala.id = 'seri-fala';
        fala.className = 'seri-fala';
        fala.dataset.aberta = 'false';
        fala.setAttribute('role', 'group');
        fala.setAttribute('aria-label', `Recado do ${m.nome}`);
        fala.innerHTML = `<button type="button" class="seri-fala-x" aria-label="Fechar o recado do ${m.nome}">&times;</button>
            <p id="seri-fala-texto" class="seri-fala-texto"></p><p id="seri-fala-aviso" class="seri-fala-aviso"></p><div id="seri-fala-acoes" class="seri-fala-acoes"></div>`;
        raiz.appendChild(fala);
        const campoTexto = fala.querySelector('#seri-fala-texto');
        const campoAviso = fala.querySelector('#seri-fala-aviso');
        const campoAcoes = fala.querySelector('#seri-fala-acoes');
        fala.querySelector('.seri-fala-x').addEventListener('click', () => fecharFala(true));

        let cancelarAnimacao = null;
        let temporizadorFala = null;
        let falaMostrada = false;
        let ignorarFocoAte = 0;
        const CHAVE_FALA = 'pibiex_seri_fala';
        const jaFalou = () => { try { return sessionStorage.getItem(CHAVE_FALA) === '1'; } catch (e) { return falaMostrada; } };
        const marcarFalou = () => { falaMostrada = true; try { sessionStorage.setItem(CHAVE_FALA, '1'); } catch (e) { /* vale só enquanto a página estiver aberta */ } };

        function desenharFala(automatico) {
            const f = o.fala({ automatico: !!automatico }) || {};
            campoTexto.textContent = '';
            if (f.titulo) { const forte = document.createElement('strong'); forte.textContent = f.titulo; campoTexto.appendChild(forte); campoTexto.appendChild(document.createTextNode(' ')); }
            const telaPequena = !!(window.matchMedia && window.matchMedia('(max-width: 640px)').matches);
            campoTexto.appendChild(document.createTextNode((telaPequena && f.corpoCurto) || f.corpo || ''));
            campoAviso.textContent = f.aviso || '';
            campoAviso.hidden = !f.aviso;
            campoAcoes.textContent = '';
            (f.acoes || []).forEach((a) => {
                const l = document.createElement('a');
                l.className = 'seri-fala-acao' + (a.sec ? ' sec' : '');
                l.href = a.href; l.textContent = a.texto;
                campoAcoes.appendChild(l);
            });
            campoAcoes.hidden = !(f.acoes && f.acoes.length);
            return f;
        }

        function atualizar() {
            const md = modo();
            if (cancelarAnimacao) { cancelarAnimacao(); cancelarAnimacao = null; }
            raiz.classList.toggle('seri-modo', md === 'grande');
            classes().toggle('seri-ativo', md === 'grande' && o.folgaNoFim);
            botao.setAttribute('aria-label', o.rotuloBotao || `Abrir o ${m.nome}`);
            if (md === 'grande') {
                botao.className = 'seri-botao';
                botao.removeAttribute('style');
                botao.setAttribute('aria-describedby', 'seri-fala-texto');
                cancelarAnimacao = montar(botao);
            } else if (md === 'redondo') {
                botao.className = 'seri-botao seri-redondo';
                botao.removeAttribute('style');
                botao.removeAttribute('aria-describedby');
                botao.innerHTML = `<img src="${m.avatar}" alt="" decoding="async">`;
            } else {
                botao.className = 'seri-botao seri-redondo';
                botao.removeAttribute('aria-describedby');
                botao.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-weight:900;font-size:18px;color:#1E3A8A;">${m.nome.charAt(0)}</span>`;
            }
            if (md !== 'grande') fecharFala(false);
            desenharFala(false);
            o.aoAtualizar(md);
        }

        function abrirFala(automatico) {
            if (modo() !== 'grande' || o.bloquearFala()) return;
            const f = desenharFala(automatico);
            clearTimeout(temporizadorFala);
            fala.dataset.aberta = 'true';
            const telaPequena = !!(window.matchMedia && window.matchMedia('(max-width: 640px)').matches);
            if (automatico) temporizadorFala = setTimeout(() => fecharFala(false), (f.dica ? 14000 : 9000) * (telaPequena ? 0.65 : 1));
        }
        function fecharFala(pelaX) {
            clearTimeout(temporizadorFala);
            const tinhaFoco = fala.contains(document.activeElement);
            fala.dataset.aberta = 'false';
            if (pelaX) {
                marcarFalou();
                if (tinhaFoco) { ignorarFocoAte = Date.now() + 400; botao.focus(); }
            }
        }
        function alternarFala() { if (fala.dataset.aberta === 'true') fecharFala(true); else abrirFala(false); }

        // mouse (não dispara com toque), foco do teclado e Esc
        let fechando = null;
        const abrirPorMouse = (e) => { if (e.pointerType && e.pointerType !== 'mouse') return; clearTimeout(fechando); abrirFala(false); };
        const fecharPorMouse = (e) => { if (e.pointerType && e.pointerType !== 'mouse') return; clearTimeout(fechando); fechando = setTimeout(() => fecharFala(false), 250); };
        botao.addEventListener('pointerenter', abrirPorMouse);
        botao.addEventListener('pointerleave', fecharPorMouse);
        fala.addEventListener('pointerenter', abrirPorMouse);
        fala.addEventListener('pointerleave', fecharPorMouse);
        botao.addEventListener('focus', () => { if (Date.now() > ignorarFocoAte) abrirFala(false); });
        const aoPerderFoco = (e) => {
            const destino = e.relatedTarget;
            if (destino && (botao.contains(destino) || fala.contains(destino))) return;
            fecharFala(false);
        };
        botao.addEventListener('blur', aoPerderFoco);
        fala.addEventListener('focusout', aoPerderFoco);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && fala.dataset.aberta === 'true') fecharFala(false); });
        // Tocar (ou clicar) fora do recado fecha: no celular não existe "tirar o mouse".
        document.addEventListener('pointerdown', (e) => {
            if (fala.dataset.aberta === 'true' && !fala.contains(e.target) && !botao.contains(e.target)) fecharFala(false);
        });
        document.addEventListener('pibiex:a11y', atualizar);

        atualizar();

        // O recado aparece sozinho uma vez por visita (a dica de cada tela, na demonstração, aparece sempre).
        // Se a pessoa pediu menos animação ou escolheu o Seri parado, ele não fala sozinho.
        // Na primeira visita a dica de acessibilidade aparece à esquerda; o Seri espera ela sumir para não sobrepor.
        const falarSozinho = (tentativa) => {
            if (document.querySelector('.a11y-dica') && tentativa < 15) { setTimeout(() => falarSozinho(tentativa + 1), 1000); return; }
            if (modo() !== 'grande' || !podeAnimar()) return;
            const f = o.fala({ automatico: true }) || {};
            if (!f.dica) { if (jaFalou()) return; marcarFalou(); }
            abrirFala(true);
        };
        setTimeout(() => falarSozinho(0), 3200);

        return { raiz, botao, fala, atualizar, abrirFala, fecharFala, alternarFala };
    }

    // Páginas públicas: o Seri só se apresenta (e leva para entrar ou ver a demonstração, se não houver outras ações).
    // texto: { titulo, corpo, corpoCurto, aviso, acoes }
    function paginaPublica(texto) {
        const iniciar = () => {
            const m = dados();
            const t = texto || {};
            const padrao = [{ texto: 'Entrar', href: '/login.html' }, { texto: 'Ver a demonstração', href: '/demo/', sec: true }];
            const seri = canto({
                rotulo: 'Mascote da plataforma',
                rotuloBotao: `Conhecer o ${m.nome}, o mascote da plataforma`,
                aoClicar: () => seri.alternarFala(),
                fala: () => ({ titulo: t.titulo || m.saudacaoTitulo, corpo: t.corpo || '', corpoCurto: t.corpoCurto, aviso: t.aviso, acoes: t.acoes === undefined ? padrao : t.acoes }),
                folgaNoFim: false,
            });
        };
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
        else iniciar();
    }

    // Elementos com data-seri="animado" ou "parado" mostram o mascote como figura na própria página.
    function montarMarcados() {
        document.querySelectorAll('[data-seri]').forEach((el) => {
            if (el._cancelarSeri) el._cancelarSeri();
            if (el.dataset.seri === 'animado') el._cancelarSeri = montar(el);
            else el.innerHTML = htmlMidia(false);
        });
    }
    function iniciar() {
        montarMarcados();
        document.addEventListener('pibiex:a11y', montarMarcados);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar, { once: true });
    else iniciar();

    window.PibiexMascote = { dados, modo, opcaoParado, semImagens, podeAnimar, htmlMidia, montar, canto, paginaPublica };
})();
