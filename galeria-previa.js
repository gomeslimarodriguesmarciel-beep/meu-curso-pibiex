// /galeria-previa.js
//
// Pré-visualização dos projetos da Galeria (alunos e professor), no estilo de um feed:
// o projeto aparece já no cartão e, ao clicar, abre no leitor da plataforma (leitor-material.js).
//
//   PibiexGaleriaPrevia.html(projeto)            -> HTML da prévia ('' se o projeto não tem arquivo)
//   PibiexGaleriaPrevia.ativar(container, lista) -> liga os cliques e desenha as prévias de PDF
//
// Como cada tipo aparece:
//   imagem   a própria imagem; se for muito alta (ex.: infográfico), mostra o começo e o selo "Ver completo"
//   PDF      a primeira página (PDF.js, que fica em /vendor/pdfjs, dentro do site) e o número de páginas
//   vídeo    o primeiro quadro, com o botão de play
//   outros   (PowerPoint, Word...) um quadro com o tipo do arquivo
// O formato do cartão acompanha o da imagem, entre 4:5 (alto) e 1,91:1 (largo), como nas redes sociais.
// Nada aqui muda a forma de postar: só lê o link do arquivo que o aluno já anexou.

(function () {
    const IMAGENS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    const VIDEOS = ['mp4', 'webm'];
    const ROTULOS = { pdf: 'PDF', ppt: 'Apresentação', pptx: 'Apresentação', doc: 'Documento', docx: 'Documento', xls: 'Planilha', xlsx: 'Planilha', csv: 'Planilha', txt: 'Texto', zip: 'Arquivo compactado', heic: 'Imagem' };
    const ASPECTO_MIN = 0.8;   // 4:5 (mais alto que isso é cortado)
    const ASPECTO_MAX = 1.91;  // 1,91:1 (mais largo que isso é cortado)

    function esc(t) { const d = document.createElement('div'); d.innerText = t ?? ''; return d.innerHTML; }
    function urlSegura(u) { return /^https?:\/\//i.test(u ?? '') ? u : ''; }
    function extensao(url) { try { return new URL(url).pathname.split('.').pop().toLowerCase(); } catch (e) { return ''; } }
    function tipo(url) {
        const e = extensao(url);
        if (IMAGENS.includes(e)) return 'imagem';
        if (e === 'pdf') return 'pdf';
        if (VIDEOS.includes(e)) return 'video';
        return 'outro';
    }
    function nomeDoArquivo(url) { try { return decodeURIComponent(new URL(url).pathname.split('/').pop()) || 'arquivo'; } catch (e) { return 'arquivo'; } }

    function injetarEstilo() {
        if (document.getElementById('gp-estilo')) return;
        const st = document.createElement('style');
        st.id = 'gp-estilo';
        st.textContent = `
        .gp { position: relative; display: block; width: 100%; aspect-ratio: 4 / 3; overflow: hidden; background: #eef2f7; border: 0; padding: 0; margin: 0;
              cursor: pointer; text-align: left; font: inherit; color: inherit; }
        .gp:focus-visible { outline: 3px solid var(--pibiex-tinta, #1E3A8A); outline-offset: -3px; }
        .gp > img, .gp > canvas, .gp > video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; background: #fff; }
        .gp:hover > img, .gp:hover > canvas, .gp:hover > video { filter: brightness(.94); }
        .gp-fundo { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; color: #64748B; font-size: 12px; font-weight: 700; text-align: center; padding: 12px; }
        .gp-fundo svg { width: 34px; height: 34px; }
        .gp-fundo b { font-size: 13px; color: #334155; }
        .gp-selo { position: absolute; left: 10px; bottom: 10px; z-index: 2; display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 800; color: #fff;
                   background: rgba(15, 23, 42, .78); padding: 4px 9px; border-radius: 999px; }
        .gp-selo[hidden] { display: none; }
        .gp-ver { position: absolute; right: 10px; bottom: 10px; z-index: 2; font-size: 11px; font-weight: 800; color: #0F172A; background: rgba(255, 255, 255, .95); padding: 4px 10px; border-radius: 999px; display: none; }
        .gp.gp-cortada .gp-ver { display: inline-block; }
        .gp.gp-cortada::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 64px; background: linear-gradient(to top, rgba(15, 23, 42, .45), transparent); pointer-events: none; }
        .gp-play { position: absolute; z-index: 2; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 54px; height: 54px; border-radius: 50%; background: rgba(15, 23, 42, .7); display: grid; place-items: center; }
        .gp-play svg { width: 24px; height: 24px; fill: #fff; margin-left: 3px; }
        html.a11y-contraste .gp-selo { background: #000; border: 1px solid #fff; }
        html.a11y-contraste .gp-ver { background: #fff; border: 1px solid #000; }`;
        document.head.appendChild(st);
    }

    const SVG_DOC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/></svg>';
    const SVG_PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';

    function quadro(rotulo, dica) {
        return `<span class="gp-fundo">${SVG_DOC}<b>${esc(rotulo)}</b><span>${esc(dica || 'Clique para abrir')}</span></span>`;
    }

    // HTML da prévia. O botão inteiro abre o projeto.
    function html(p) {
        const url = urlSegura(p && p.arquivo_url);
        if (!url) return '';
        injetarEstilo();
        const t = tipo(url);
        const rotulo = ROTULOS[extensao(url)] || 'Arquivo';
        let miolo;
        if (t === 'imagem') miolo = `<img src="${esc(url)}" alt="" loading="lazy" decoding="async"><span class="gp-ver">Ver completo</span>`;
        else if (t === 'pdf') miolo = `${quadro('PDF', 'Carregando a prévia…')}<span class="gp-selo" hidden></span><span class="gp-ver">Ver completo</span>`;
        else if (t === 'video') miolo = `<video src="${esc(url)}#t=0.1" muted playsinline preload="metadata"></video><span class="gp-play">${SVG_PLAY}</span><span class="gp-selo">Vídeo</span>`;
        else miolo = quadro(rotulo, 'Clique para abrir');
        return `<button type="button" class="gp" data-gp-id="${esc(p.id)}" data-gp-tipo="${t}" aria-label="Abrir o projeto: ${esc(p.titulo)}">${miolo}</button>`;
    }

    // ---- PDF.js (carregado só quando há um PDF na tela)
    let carregandoPdfJs = null;
    function carregarPdfJs() {
        if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
        if (carregandoPdfJs) return carregandoPdfJs;
        carregandoPdfJs = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = '/vendor/pdfjs/pdf.min.js';
            s.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.js'; resolve(window.pdfjsLib); };
            s.onerror = () => { carregandoPdfJs = null; reject(new Error('pdfjs')); };
            document.head.appendChild(s);
        });
        return carregandoPdfJs;
    }

    function formatar(btn, largura, altura) {
        const r = largura / altura;
        const aspecto = Math.min(Math.max(r, ASPECTO_MIN), ASPECTO_MAX);
        btn.style.aspectRatio = String(aspecto);
        if (r < ASPECTO_MIN * 0.97) btn.classList.add('gp-cortada');
    }

    async function desenharPdf(btn, url) {
        try {
            const pdfjs = await carregarPdfJs();
            const doc = await pdfjs.getDocument({ url }).promise;
            const pagina = await doc.getPage(1);
            const v1 = pagina.getViewport({ scale: 1 });
            const alvo = Math.min(btn.clientWidth || 360, 520) * Math.min(window.devicePixelRatio || 1, 2);
            const vp = pagina.getViewport({ scale: alvo / v1.width });
            const canvas = document.createElement('canvas');
            canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
            await pagina.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
            const fundo = btn.querySelector('.gp-fundo'); if (fundo) fundo.remove();
            btn.insertBefore(canvas, btn.firstChild);
            formatar(btn, v1.width, v1.height);
            const selo = btn.querySelector('.gp-selo');
            if (selo) { selo.textContent = `PDF · ${doc.numPages} ${doc.numPages === 1 ? 'página' : 'páginas'}`; selo.hidden = false; }
        } catch (e) {
            const fundo = btn.querySelector('.gp-fundo');
            if (fundo) fundo.outerHTML = quadro('PDF', 'Clique para abrir');
        }
    }

    function abrir(p) {
        const url = urlSegura(p.arquivo_url);
        if (!url) return;
        if (typeof window.abrirLeitorMaterial !== 'function') { window.open(url, '_blank', 'noopener'); return; }
        const t = tipo(url);
        window.abrirLeitorMaterial({
            titulo: p.titulo || 'Projeto',
            chaveProgresso: 'galeria:' + p.id,
            obterArquivo: async () => ({ url, nome: nomeDoArquivo(url), permiteBaixar: true, visualiza: t === 'imagem' ? 'imagem' : t === 'pdf' ? 'pdf' : t === 'video' ? 'video' : null }),
        });
    }

    let observador = null;
    function ativar(container, lista) {
        if (!container) return;
        const porId = new Map((lista || []).map((p) => [String(p.id), p]));
        if (!observador && 'IntersectionObserver' in window) {
            observador = new IntersectionObserver((entradas) => {
                entradas.forEach((e) => {
                    if (!e.isIntersecting) return;
                    observador.unobserve(e.target);
                    const p = e.target._gpProjeto;
                    if (p) desenharPdf(e.target, urlSegura(p.arquivo_url));
                });
            }, { rootMargin: '200px' });
        }
        container.querySelectorAll('.gp[data-gp-id]').forEach((btn) => {
            const p = porId.get(btn.dataset.gpId);
            if (!p) return;
            btn.onclick = () => abrir(p);
            const img = btn.querySelector('img');
            if (img) {
                const ajustar = () => { if (img.naturalWidth) formatar(btn, img.naturalWidth, img.naturalHeight); };
                if (img.complete) ajustar(); else img.addEventListener('load', ajustar, { once: true });
                img.addEventListener('error', () => { img.remove(); btn.insertAdjacentHTML('afterbegin', quadro('Imagem', 'Clique para abrir')); }, { once: true });
            }
            const video = btn.querySelector('video');
            if (video) video.addEventListener('loadedmetadata', () => formatar(btn, video.videoWidth || 4, video.videoHeight || 3), { once: true });
            if (btn.dataset.gpTipo === 'pdf') {
                btn._gpProjeto = p;
                if (observador) observador.observe(btn); else desenharPdf(btn, urlSegura(p.arquivo_url));
            }
        });
    }

    window.PibiexGaleriaPrevia = { html, ativar, tipo };
})();
