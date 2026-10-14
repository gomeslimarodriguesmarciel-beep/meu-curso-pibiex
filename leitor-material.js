// /leitor-material.js
//
// Leitor de materiais dentro da plataforma (slides em PDF, imagens e vídeo).
// Usado pelo professor (prévia em admin/conteudo.html) e pelo aluno
// (aluno/conteudo.html).
//
// Uso:
//   abrirLeitorMaterial({
//       titulo: 'Slides da aula 8',
//       chaveProgresso: 'material:<id>',        // lembra o slide onde o aluno parou
//       obterArquivo: async () => ({ url, nome, tamanho, permiteBaixar, visualiza }),
//       obterDownload: async () => urlParaBaixar // opcional
//   });
//
// "visualiza" vem do servidor: 'pdf' | 'imagem' | 'video' | null (só baixar).
// A biblioteca que desenha o PDF (PDF.js) fica em /vendor/pdfjs, dentro do
// próprio site — sem depender de CDN de terceiros.

(function () {
    const PDFJS_SRC = '/vendor/pdfjs/pdf.min.js';
    const PDFJS_WORKER = '/vendor/pdfjs/pdf.worker.min.js';

    let carregandoPdfJs = null;
    function carregarPdfJs() {
        if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
        if (carregandoPdfJs) return carregandoPdfJs;
        carregandoPdfJs = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = PDFJS_SRC;
            s.onload = () => {
                window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
                resolve(window.pdfjsLib);
            };
            s.onerror = () => { carregandoPdfJs = null; reject(new Error('Não foi possível carregar o leitor de PDF.')); };
            document.head.appendChild(s);
        });
        return carregandoPdfJs;
    }

    function injetarEstilo() {
        if (document.getElementById('lm-estilo')) return;
        const st = document.createElement('style');
        st.id = 'lm-estilo';
        st.textContent = `
        #lm-raiz { position: fixed; inset: 0; z-index: 100; display: flex; flex-direction: column;
                   background: #0b1020; color: #e5e7eb; font-family: 'Inter', system-ui, sans-serif; }
        #lm-raiz * { box-sizing: border-box; }
        #lm-raiz [hidden] { display: none !important; }
        .lm-topo { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #0f1630;
                   border-bottom: 1px solid rgba(255,255,255,.08); flex-shrink: 0; }
        .lm-titulo { min-width: 0; flex: 1; }
        .lm-titulo b { display: block; font-size: 14px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .lm-titulo small { display: block; font-size: 11px; color: #94a3b8; }
        .lm-acoes { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
        .lm-btn { appearance: none; border: 0; background: transparent; color: #cbd5e1; cursor: pointer; width: 36px; height: 36px;
                  border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; line-height: 1; }
        .lm-btn:hover { background: rgba(255,255,255,.08); color: #fff; }
        .lm-btn:focus-visible, .lm-seta:focus-visible { outline: 2px solid #A3E635; outline-offset: 2px; }
        .lm-btn[disabled] { opacity: .35; cursor: default; }
        .lm-btn svg { width: 18px; height: 18px; }
        .lm-baixar { width: auto; padding: 0 12px; gap: 6px; font-size: 12px; font-weight: 700; background: #A3E635; color: #0b1020; }
        .lm-baixar:hover { background: #bef264; color: #0b1020; }
        .lm-progresso { height: 3px; background: rgba(255,255,255,.08); flex-shrink: 0; }
        .lm-progresso > div { height: 100%; width: 0; background: #A3E635; transition: width .2s ease; }
        .lm-corpo { flex: 1; min-height: 0; display: flex; }
        #lm-miniaturas { width: 168px; flex-shrink: 0; overflow-y: auto; padding: 12px 10px; background: #0d132b;
                         border-right: 1px solid rgba(255,255,255,.08); display: none; }
        #lm-miniaturas.aberto { display: block; }
        .lm-mini { display: block; width: 100%; margin: 0 0 10px; padding: 4px; border: 2px solid transparent; border-radius: 8px;
                   background: rgba(255,255,255,.04); cursor: pointer; text-align: center; color: #94a3b8; font-size: 11px; }
        .lm-mini canvas { width: 100%; height: auto; display: block; border-radius: 4px; background: #fff; min-height: 60px; }
        .lm-mini.atual { border-color: #A3E635; color: #fff; }
        .lm-mini:focus-visible { outline: 2px solid #A3E635; }
        #lm-palco { position: relative; flex: 1; min-width: 0; overflow: auto; outline: none; }
        .lm-centro { min-height: 100%; min-width: 100%; display: grid; place-items: center; padding: 16px; }
        #lm-canvas { display: block; background: #fff; box-shadow: 0 10px 40px rgba(0,0,0,.5); border-radius: 4px; }
        #lm-midia { max-width: 100%; max-height: calc(100vh - 160px); border-radius: 6px; background: #000; }
        .lm-seta { position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 64px; border: 0; cursor: pointer;
                   background: rgba(15,22,48,.72); color: #fff; font-size: 26px; border-radius: 10px; z-index: 2; backdrop-filter: blur(4px); }
        .lm-seta:hover { background: rgba(15,22,48,.95); }
        .lm-seta[disabled] { opacity: 0; pointer-events: none; }
        #lm-ant { left: 10px; } #lm-prox { right: 10px; }
        #lm-estado { position: absolute; inset: 0; display: none; flex-direction: column; align-items: center; justify-content: center;
                     gap: 12px; text-align: center; padding: 24px; background: #0b1020; z-index: 3; }
        #lm-estado.visivel { display: flex; }
        #lm-estado p { max-width: 360px; font-size: 14px; color: #cbd5e1; margin: 0; }
        #lm-estado .lm-acao { appearance: none; border: 0; cursor: pointer; padding: 10px 18px; border-radius: 999px; font-weight: 700;
                              font-size: 13px; background: #A3E635; color: #0b1020; }
        .lm-giro { width: 34px; height: 34px; border-radius: 50%; border: 3px solid rgba(255,255,255,.15); border-top-color: #A3E635;
                   animation: lm-gira .8s linear infinite; }
        @keyframes lm-gira { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .lm-giro { animation-duration: 2.4s; } .lm-progresso > div { transition: none; } }
        .lm-rodape { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 8px 12px; background: #0f1630;
                     border-top: 1px solid rgba(255,255,255,.08); flex-shrink: 0; font-size: 13px; }
        .lm-rodape input { width: 52px; text-align: center; background: #0b1020; color: #fff; border: 1px solid rgba(255,255,255,.18);
                           border-radius: 8px; padding: 6px 4px; font-size: 13px; }
        .lm-rodape input:focus-visible { outline: 2px solid #A3E635; }
        #lm-aviso { position: absolute; left: 50%; bottom: 16px; transform: translateX(-50%); background: #1e293b; color: #e2e8f0;
                    border: 1px solid rgba(255,255,255,.12); padding: 8px 14px; border-radius: 999px; font-size: 12px; z-index: 4;
                    display: none; align-items: center; gap: 12px; white-space: nowrap; }
        #lm-aviso.visivel { display: flex; }
        #lm-aviso button { background: none; border: 0; color: #A3E635; font-weight: 700; cursor: pointer; font-size: 12px; }
        .lm-atalhos { font-size: 11px; color: #64748b; }
        @media (max-width: 767px) {
            .lm-topo { padding: 8px 8px; gap: 6px; }
            .lm-btn { width: 40px; height: 40px; }
            .lm-esconde-mobile { display: none !important; }
            .lm-baixar { width: 40px; padding: 0; }
            .lm-baixar span { display: none; }
            .lm-seta { width: 38px; height: 54px; }
            .lm-atalhos { display: none; }
            #lm-miniaturas.aberto { position: absolute; z-index: 5; top: 0; bottom: 0; left: 0; box-shadow: 8px 0 24px rgba(0,0,0,.5); }
        }
        `;
        document.head.appendChild(st);
    }

    const ICONES = {
        fechar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
        miniaturas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="7" height="6" rx="1"/><rect x="3" y="14" width="7" height="6" rx="1"/><path d="M14 6h7M14 10h7M14 16h7M14 20h7"/></svg>',
        menos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/></svg>',
        mais: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6M11 8v6"/></svg>',
        ajustar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M8 12h8"/></svg>',
        tela: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>',
        baixar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M12 4v11M7 11l5 5 5-5M5 20h14"/></svg>',
    };

    function formatarTamanho(bytes) {
        if (!bytes) return '';
        if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + ' KB';
        return (bytes / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB';
    }

    function lerProgresso(chave) {
        try { return parseInt(localStorage.getItem('leitor:' + chave) || '0', 10) || 0; } catch (e) { return 0; }
    }
    function gravarProgresso(chave, pagina) {
        try { localStorage.setItem('leitor:' + chave, String(pagina)); } catch (e) { /* sem armazenamento: segue sem lembrar */ }
    }

    window.abrirLeitorMaterial = function (opcoes) {
        if (document.getElementById('lm-raiz')) return;
        injetarEstilo();

        const focoAnterior = document.activeElement;
        const bodyOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const raiz = document.createElement('div');
        raiz.id = 'lm-raiz';
        raiz.setAttribute('role', 'dialog');
        raiz.setAttribute('aria-modal', 'true');
        raiz.setAttribute('aria-label', 'Leitor de material');
        raiz.innerHTML = `
            <header class="lm-topo">
                <button class="lm-btn" id="lm-fechar" aria-label="Fechar leitor" title="Fechar (Esc)">${ICONES.fechar}</button>
                <div class="lm-titulo"><b id="lm-titulo"></b><small id="lm-sub"></small></div>
                <div class="lm-acoes">
                    <button class="lm-btn" id="lm-btn-mini" aria-label="Mostrar miniaturas" title="Miniaturas (T)" hidden>${ICONES.miniaturas}</button>
                    <button class="lm-btn lm-esconde-mobile" id="lm-menos" aria-label="Diminuir zoom" title="Diminuir (-)" hidden>${ICONES.menos}</button>
                    <button class="lm-btn lm-esconde-mobile" id="lm-mais" aria-label="Aumentar zoom" title="Aumentar (+)" hidden>${ICONES.mais}</button>
                    <button class="lm-btn lm-esconde-mobile" id="lm-ajustar" aria-label="Ajustar à tela" title="Ajustar à tela (0)" hidden>${ICONES.ajustar}</button>
                    <button class="lm-btn" id="lm-tela" aria-label="Tela cheia" title="Tela cheia (F)" hidden>${ICONES.tela}</button>
                    <button class="lm-btn lm-baixar" id="lm-baixar" hidden>${ICONES.baixar}<span>Baixar</span></button>
                </div>
            </header>
            <div class="lm-progresso" aria-hidden="true"><div id="lm-barra"></div></div>
            <div class="lm-corpo">
                <aside id="lm-miniaturas" aria-label="Miniaturas dos slides"></aside>
                <main id="lm-palco" tabindex="0" aria-live="polite">
                    <div class="lm-centro" id="lm-centro"></div>
                    <button class="lm-seta" id="lm-ant" aria-label="Slide anterior" hidden>‹</button>
                    <button class="lm-seta" id="lm-prox" aria-label="Próximo slide" hidden>›</button>
                    <div id="lm-estado" class="visivel"><div class="lm-giro"></div><p>Abrindo o material…</p></div>
                    <div id="lm-aviso" role="status"></div>
                </main>
            </div>
            <footer class="lm-rodape" id="lm-rodape" hidden>
                <button class="lm-btn" id="lm-ant2" aria-label="Slide anterior">‹</button>
                <span>Slide <input id="lm-pular" type="number" min="1" aria-label="Ir para o slide"> de <b id="lm-total">–</b></span>
                <button class="lm-btn" id="lm-prox2" aria-label="Próximo slide">›</button>
                <span class="lm-atalhos">← → navegam · F tela cheia · T miniaturas · Esc fecha</span>
            </footer>
        `;
        document.body.appendChild(raiz);

        const $ = (id) => raiz.querySelector('#' + id);
        $('lm-titulo').textContent = opcoes.titulo || 'Material';

        const estado = {
            pdf: null, pagina: 1, total: 0, zoom: 1, modo: 'pagina',
            renderTask: null, renderizando: false, pendente: null,
            arquivo: null, observador: null, fechado: false, miniRenderizadas: new Set(),
        };

        // ---------- estados da tela ----------
        function mostrarEstado(html) {
            const el = $('lm-estado');
            el.innerHTML = html;
            el.classList.add('visivel');
        }
        function esconderEstado() { $('lm-estado').classList.remove('visivel'); }

        function mostrarErro(mensagem, comBaixar) {
            mostrarEstado('<p></p>');
            const p = $('lm-estado').querySelector('p');
            p.textContent = mensagem;
            const tentar = document.createElement('button');
            tentar.className = 'lm-acao';
            tentar.textContent = 'Tentar de novo';
            tentar.onclick = iniciar;
            $('lm-estado').appendChild(tentar);
            if (comBaixar && estado.arquivo && estado.arquivo.permiteBaixar) {
                const b = document.createElement('button');
                b.className = 'lm-acao';
                b.style.background = 'transparent';
                b.style.color = '#A3E635';
                b.style.border = '1px solid #A3E635';
                b.textContent = 'Baixar arquivo';
                b.onclick = baixar;
                $('lm-estado').appendChild(b);
            }
        }

        let temporizadorAviso = null;
        function aviso(texto, rotuloAcao, acao) {
            const el = $('lm-aviso');
            el.textContent = '';
            const span = document.createElement('span');
            span.textContent = texto;
            el.appendChild(span);
            if (rotuloAcao) {
                const b = document.createElement('button');
                b.textContent = rotuloAcao;
                b.onclick = () => { el.classList.remove('visivel'); acao(); };
                el.appendChild(b);
            }
            el.classList.add('visivel');
            clearTimeout(temporizadorAviso);
            temporizadorAviso = setTimeout(() => el.classList.remove('visivel'), 6000);
        }

        // ---------- download ----------
        async function baixar() {
            try {
                const url = opcoes.obterDownload ? await opcoes.obterDownload() : estado.arquivo.url;
                const a = document.createElement('a');
                a.href = url;
                a.download = (estado.arquivo && estado.arquivo.nome) || '';
                a.rel = 'noopener';
                document.body.appendChild(a);
                a.click();
                a.remove();
            } catch (e) {
                aviso('Não foi possível baixar agora. Tente de novo.');
            }
        }

        // ---------- PDF ----------
        function atualizarIndicadores() {
            $('lm-sub').textContent = estado.total
                ? `Slide ${estado.pagina} de ${estado.total}` + (estado.arquivo && estado.arquivo.tamanho ? ' · ' + formatarTamanho(estado.arquivo.tamanho) : '')
                : (estado.arquivo && estado.arquivo.tamanho ? formatarTamanho(estado.arquivo.tamanho) : '');
            $('lm-total').textContent = estado.total || '–';
            $('lm-pular').value = estado.pagina;
            $('lm-pular').max = estado.total;
            $('lm-barra').style.width = estado.total ? (estado.pagina / estado.total * 100) + '%' : '0';
            $('lm-ant').disabled = $('lm-ant2').disabled = estado.pagina <= 1;
            $('lm-prox').disabled = $('lm-prox2').disabled = estado.pagina >= estado.total;
            raiz.querySelectorAll('.lm-mini').forEach((m) => {
                const atual = Number(m.dataset.pagina) === estado.pagina;
                m.classList.toggle('atual', atual);
                if (atual) m.setAttribute('aria-current', 'true'); else m.removeAttribute('aria-current');
            });
            const atual = raiz.querySelector('.lm-mini.atual');
            if (atual && $('lm-miniaturas').classList.contains('aberto')) atual.scrollIntoView({ block: 'nearest' });
        }

        async function desenharPagina() {
            if (!estado.pdf || estado.fechado) return;
            if (estado.renderizando) { estado.pendente = true; return; }
            estado.renderizando = true;
            estado.pendente = false;
            const numero = estado.pagina;
            try {
                const pagina = await estado.pdf.getPage(numero);
                const palco = $('lm-palco');
                const larg = palco.clientWidth - 32;
                const alt = palco.clientHeight - 32;
                const base = pagina.getViewport({ scale: 1 });
                const escalaAjuste = estado.modo === 'largura'
                    ? larg / base.width
                    : Math.min(larg / base.width, alt / base.height);
                const escala = Math.max(0.1, escalaAjuste * estado.zoom);
                const viewport = pagina.getViewport({ scale: escala });
                const dpr = Math.min(window.devicePixelRatio || 1, 2);

                let canvas = $('lm-canvas');
                if (!canvas) {
                    canvas = document.createElement('canvas');
                    canvas.id = 'lm-canvas';
                    canvas.setAttribute('role', 'img');
                    $('lm-centro').innerHTML = '';
                    $('lm-centro').appendChild(canvas);
                }
                canvas.setAttribute('aria-label', `Slide ${numero} de ${estado.total}`);
                // Desenha num canvas separado e troca de uma vez, para não piscar.
                const novo = document.createElement('canvas');
                novo.width = Math.floor(viewport.width * dpr);
                novo.height = Math.floor(viewport.height * dpr);
                const ctx = novo.getContext('2d');
                estado.renderTask = pagina.render({
                    canvasContext: ctx,
                    viewport,
                    transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null,
                });
                await estado.renderTask.promise;
                canvas.width = novo.width;
                canvas.height = novo.height;
                canvas.style.width = Math.floor(viewport.width) + 'px';
                canvas.style.height = Math.floor(viewport.height) + 'px';
                canvas.getContext('2d').drawImage(novo, 0, 0);
                esconderEstado();

                // Deixa o próximo slide pronto na memória.
                if (numero < estado.total) estado.pdf.getPage(numero + 1).catch(() => {});
            } catch (erro) {
                if (!erro || erro.name !== 'RenderingCancelledException') {
                    console.error(erro);
                    mostrarErro('Não consegui desenhar este slide.', true);
                }
            } finally {
                estado.renderizando = false;
                if (estado.pendente && !estado.fechado) desenharPagina();
            }
        }

        function irPara(n, opts) {
            if (!estado.pdf) return;
            const alvo = Math.min(Math.max(1, Math.round(n)), estado.total);
            if (alvo === estado.pagina && !(opts && opts.forcar)) { atualizarIndicadores(); return; }
            estado.pagina = alvo;
            if (estado.renderTask) { try { estado.renderTask.cancel(); } catch (e) { /* já terminou */ } }
            if (!(opts && opts.semScroll)) $('lm-palco').scrollTo({ top: 0, left: 0 });
            atualizarIndicadores();
            gravarProgresso(opcoes.chaveProgresso || '', alvo);
            desenharPagina();
        }

        function mudarZoom(fator) {
            estado.zoom = Math.min(4, Math.max(0.5, estado.zoom * fator));
            desenharPagina();
        }
        function ajustar() {
            estado.zoom = 1;
            desenharPagina();
        }

        // ---------- miniaturas ----------
        function montarMiniaturas() {
            const caixa = $('lm-miniaturas');
            caixa.innerHTML = '';
            if (!estado.pdf || estado.total < 2) return;

            estado.observador = new IntersectionObserver((entradas) => {
                entradas.forEach(async (e) => {
                    if (!e.isIntersecting) return;
                    const botao = e.target;
                    const n = Number(botao.dataset.pagina);
                    if (estado.miniRenderizadas.has(n)) return;
                    estado.miniRenderizadas.add(n);
                    try {
                        const pagina = await estado.pdf.getPage(n);
                        const vp = pagina.getViewport({ scale: 0.25 });
                        const c = botao.querySelector('canvas');
                        c.width = Math.floor(vp.width);
                        c.height = Math.floor(vp.height);
                        await pagina.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
                    } catch (erro) { /* miniatura é opcional */ }
                });
            }, { root: caixa, rootMargin: '200px' });

            for (let n = 1; n <= estado.total; n++) {
                const b = document.createElement('button');
                b.className = 'lm-mini';
                b.dataset.pagina = String(n);
                b.setAttribute('aria-label', `Ir para o slide ${n}`);
                b.innerHTML = '<canvas></canvas>';
                const num = document.createElement('div');
                num.textContent = String(n);
                b.appendChild(num);
                b.onclick = () => { irPara(n); if (window.innerWidth < 768) alternarMiniaturas(false); };
                caixa.appendChild(b);
                estado.observador.observe(b);
            }
        }
        function alternarMiniaturas(forcar) {
            const caixa = $('lm-miniaturas');
            const abrir = typeof forcar === 'boolean' ? forcar : !caixa.classList.contains('aberto');
            caixa.classList.toggle('aberto', abrir);
            $('lm-btn-mini').setAttribute('aria-label', abrir ? 'Esconder miniaturas' : 'Mostrar miniaturas');
            if (abrir) atualizarIndicadores();
            setTimeout(desenharPagina, 30);
        }

        // ---------- tela cheia ----------
        function alternarTelaCheia() {
            if (document.fullscreenElement) document.exitFullscreen();
            else if (raiz.requestFullscreen) raiz.requestFullscreen().catch(() => {});
        }

        // ---------- abrir cada tipo de arquivo ----------
        async function abrirPdf(arquivo) {
            const lib = await carregarPdfJs();
            const tarefa = lib.getDocument({ url: arquivo.url });
            estado.pdf = await tarefa.promise;
            estado.total = estado.pdf.numPages;

            $('lm-btn-mini').hidden = estado.total < 2;
            $('lm-menos').hidden = $('lm-mais').hidden = $('lm-ajustar').hidden = false;
            $('lm-ant').hidden = $('lm-prox').hidden = estado.total < 2;
            $('lm-rodape').hidden = estado.total < 2;
            if (estado.total >= 2 && window.innerWidth >= 1024) $('lm-miniaturas').classList.add('aberto');
            montarMiniaturas();

            const salvo = lerProgresso(opcoes.chaveProgresso || '');
            estado.pagina = salvo > 1 && salvo <= estado.total ? salvo : 1;
            atualizarIndicadores();
            await desenharPagina();
            $('lm-palco').focus();
            if (salvo > 1 && salvo <= estado.total) {
                aviso(`Continuando de onde você parou (slide ${salvo})`, 'Voltar ao início', () => irPara(1));
            }
        }

        function abrirImagem(arquivo) {
            const img = document.createElement('img');
            img.id = 'lm-midia';
            img.alt = opcoes.titulo || 'Imagem';
            img.onload = esconderEstado;
            img.onerror = () => mostrarErro('Não consegui carregar a imagem.', true);
            img.src = arquivo.url;
            $('lm-centro').innerHTML = '';
            $('lm-centro').appendChild(img);
        }

        function abrirVideo(arquivo) {
            const v = document.createElement('video');
            v.id = 'lm-midia';
            v.controls = true;
            v.playsInline = true;
            v.preload = 'metadata';
            v.setAttribute('controlsList', arquivo.permiteBaixar ? '' : 'nodownload');
            v.onloadedmetadata = esconderEstado;
            v.onerror = () => mostrarErro('Não consegui carregar o vídeo.', true);
            v.src = arquivo.url;
            $('lm-centro').innerHTML = '';
            $('lm-centro').appendChild(v);
        }

        function abrirSoBaixar(arquivo) {
            mostrarEstado('<p></p>');
            $('lm-estado').querySelector('p').textContent =
                'Este tipo de arquivo não abre aqui dentro. Para ler no leitor, o professor pode enviar a versão em PDF.';
            if (arquivo.permiteBaixar) {
                const b = document.createElement('button');
                b.className = 'lm-acao';
                b.textContent = 'Baixar arquivo' + (arquivo.tamanho ? ' (' + formatarTamanho(arquivo.tamanho) + ')' : '');
                b.onclick = baixar;
                $('lm-estado').appendChild(b);
            }
        }

        async function iniciar() {
            estado.pdf = null;
            mostrarEstado('<div class="lm-giro"></div><p>Abrindo o material…</p>');
            try {
                const arquivo = await opcoes.obterArquivo();
                estado.arquivo = arquivo;
                $('lm-baixar').hidden = !arquivo.permiteBaixar;
                atualizarIndicadores();

                if (arquivo.visualiza === 'pdf') await abrirPdf(arquivo);
                else if (arquivo.visualiza === 'imagem') abrirImagem(arquivo);
                else if (arquivo.visualiza === 'video') abrirVideo(arquivo);
                else abrirSoBaixar(arquivo);

                if (document.fullscreenEnabled) $('lm-tela').hidden = false;
            } catch (erro) {
                console.error(erro);
                mostrarErro((erro && erro.message) || 'Não foi possível abrir o material. Tente de novo.', false);
            }
        }

        // ---------- fechar ----------
        function fechar() {
            if (estado.fechado) return;
            estado.fechado = true;
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            if (estado.renderTask) { try { estado.renderTask.cancel(); } catch (e) { /* ok */ } }
            if (estado.observador) estado.observador.disconnect();
            if (estado.pdf) { try { estado.pdf.destroy(); } catch (e) { /* ok */ } }
            document.removeEventListener('keydown', aoTeclar, true);
            window.removeEventListener('resize', aoRedimensionar);
            document.body.style.overflow = bodyOverflow;
            raiz.remove();
            if (focoAnterior && focoAnterior.focus) focoAnterior.focus();
        }

        // ---------- teclado, toque e janela ----------
        function aoTeclar(e) {
            if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName) && e.key !== 'Escape') return;
            const k = e.key;
            if (k === 'Escape') { if (!document.fullscreenElement) { e.preventDefault(); fechar(); } return; }
            if (k === 'ArrowRight' || k === 'PageDown' || (k === ' ' && !e.shiftKey)) { e.preventDefault(); irPara(estado.pagina + 1); }
            else if (k === 'ArrowLeft' || k === 'PageUp' || (k === ' ' && e.shiftKey)) { e.preventDefault(); irPara(estado.pagina - 1); }
            else if (k === 'Home') { e.preventDefault(); irPara(1); }
            else if (k === 'End') { e.preventDefault(); irPara(estado.total); }
            else if (k === '+' || k === '=') { e.preventDefault(); mudarZoom(1.25); }
            else if (k === '-') { e.preventDefault(); mudarZoom(0.8); }
            else if (k === '0') { e.preventDefault(); ajustar(); }
            else if (k === 'f' || k === 'F') { e.preventDefault(); alternarTelaCheia(); }
            else if (k === 't' || k === 'T') { e.preventDefault(); alternarMiniaturas(); }
            else if (k === 'Tab') {
                // Mantém o foco dentro do leitor enquanto ele está aberto.
                const focaveis = [...raiz.querySelectorAll('button:not([hidden]):not([disabled]), input, [tabindex="0"]')].filter((el) => el.offsetParent !== null);
                if (!focaveis.length) return;
                const primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
                if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
                else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
            }
        }
        document.addEventListener('keydown', aoTeclar, true);

        let temporizadorRedim = null;
        function aoRedimensionar() {
            clearTimeout(temporizadorRedim);
            temporizadorRedim = setTimeout(desenharPagina, 120);
        }
        window.addEventListener('resize', aoRedimensionar);

        // deslizar no celular troca de slide (só quando não está com zoom)
        let toqueX = null, toqueY = null;
        $('lm-palco').addEventListener('touchstart', (e) => {
            if (e.touches.length !== 1) { toqueX = null; return; }
            toqueX = e.touches[0].clientX; toqueY = e.touches[0].clientY;
        }, { passive: true });
        $('lm-palco').addEventListener('touchend', (e) => {
            if (toqueX === null || estado.zoom !== 1) return;
            const dx = e.changedTouches[0].clientX - toqueX;
            const dy = e.changedTouches[0].clientY - toqueY;
            toqueX = null;
            if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) irPara(estado.pagina + (dx < 0 ? 1 : -1));
        }, { passive: true });

        $('lm-fechar').onclick = fechar;
        $('lm-btn-mini').onclick = () => alternarMiniaturas();
        $('lm-menos').onclick = () => mudarZoom(0.8);
        $('lm-mais').onclick = () => mudarZoom(1.25);
        $('lm-ajustar').onclick = ajustar;
        $('lm-tela').onclick = alternarTelaCheia;
        $('lm-baixar').onclick = baixar;
        $('lm-ant').onclick = $('lm-ant2').onclick = () => irPara(estado.pagina - 1);
        $('lm-prox').onclick = $('lm-prox2').onclick = () => irPara(estado.pagina + 1);
        $('lm-pular').addEventListener('change', (e) => irPara(Number(e.target.value) || estado.pagina));
        document.addEventListener('fullscreenchange', () => setTimeout(desenharPagina, 80));

        $('lm-fechar').focus();
        iniciar();
    };
})();
