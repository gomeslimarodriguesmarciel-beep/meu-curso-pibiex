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
//    PibiexA11y.botaoFlutuante(): botão fixo com o mesmo cartão, para as páginas públicas.
//  - Ouvir a página (voz do navegador, gratuita): código em /ouvir.js, baixado só quando alguém usa.
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
                // leitura em voz alta (ver /ouvir.js)
                apontar: p.apontar === true,
                velocidade: [0.75, 1, 1.25, 1.5, 1.75].includes(p.velocidade) ? p.velocidade : 1,
                voz: typeof p.voz === 'string' ? p.voz.slice(0, 200) : '',
                // recursos extras (ver EXTRAS)
                links: p.links === true, espaco: p.espaco === true, fonte: p.fonte === true,
                cursor: p.cursor === true, semImagens: p.semImagens === true, libras: p.libras !== false, // já vem ligado; só desliga se a pessoa desmarcar
            };
        } catch (e) { return { contraste: null, texto: 0, semMovimento: null, apontar: false, velocidade: 1, voz: '', links: false, espaco: false, fonte: false, cursor: false, semImagens: false, libras: true }; }
    }

    function gravar(p) {
        try { localStorage.setItem(CHAVE, JSON.stringify(p)); } catch (e) { /* sem armazenamento: vale só nesta página */ }
    }

    function sistemaPedeContraste() {
        return !!(window.matchMedia && window.matchMedia('(prefers-contrast: more)').matches);
    }

    // Recursos extras de leitura e navegação (cada um liga uma classe no <html>, exceto Libras).
    const EXTRAS = [
        { chave: 'links', classe: 'a11y-links', rotulo: 'Links destacados' },
        { chave: 'espaco', classe: 'a11y-espaco', rotulo: 'Espaçamento do texto' },
        { chave: 'fonte', classe: 'a11y-fonte', rotulo: 'Fonte simples' },
        { chave: 'cursor', classe: 'a11y-cursor', rotulo: 'Cursor grande' },
        { chave: 'semImagens', classe: 'a11y-sem-img', rotulo: 'Ocultar imagens' },
        { chave: 'libras', classe: null, rotulo: 'Libras (VLibras)' },
    ];

    // VLibras: tradutor gratuito de texto para Libras do governo federal (vlibras.gov.br).
    // Só é baixado quando a pessoa liga; ao ligar, o navegador conversa com o servidor do governo.
    let libras = null;
    function ligarLibras() {
        if (libras === 'carregando' || libras === 'pronto') { const c = document.querySelector('[vw]'); if (c) c.style.display = ''; return; }
        libras = 'carregando';
        const montar = () => {
            const caixa = document.createElement('div');
            caixa.setAttribute('vw', '');
            caixa.className = 'enabled';
            caixa.innerHTML = '<div vw-access-button class="active"></div><div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>';
            document.body.appendChild(caixa);
            const sc = document.createElement('script');
            sc.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
            sc.onload = () => { try { new window.VLibras.Widget('https://vlibras.gov.br/app'); libras = 'pronto'; } catch (e) { libras = null; } };
            sc.onerror = () => { libras = null; caixa.remove(); mostrarAviso('Não foi possível carregar o VLibras agora. Confira a conexão e tente de novo.'); };
            document.head.appendChild(sc);
        };
        if (document.body) montar(); else document.addEventListener('DOMContentLoaded', montar, { once: true });
    }
    function esconderLibras() {
        const c = document.querySelector('[vw]');
        if (c) c.style.display = 'none';
    }

    function aplicar(p) {
        const contraste = p.contraste === null ? sistemaPedeContraste() : p.contraste;
        raiz.classList.toggle('a11y-contraste', contraste);
        raiz.classList.toggle('a11y-texto-1', p.texto === 1);
        raiz.classList.toggle('a11y-texto-2', p.texto === 2);
        raiz.classList.toggle('a11y-sem-movimento', p.semMovimento === true);
        EXTRAS.forEach((x) => { if (x.classe) raiz.classList.toggle(x.classe, p[x.chave] === true); });
        if (p.libras === true) ligarLibras(); else esconderLibras();
        document.dispatchEvent(new CustomEvent('pibiex:a11y', { detail: { contraste, texto: p.texto, semMovimento: p.semMovimento === true } }));
    }

    function estado() {
        const p = ler();
        return {
            contraste: p.contraste === null ? sistemaPedeContraste() : p.contraste,
            texto: p.texto,
            semMovimento: p.semMovimento === true,
            apontar: p.apontar === true,
            velocidade: p.velocidade,
            voz: p.voz,
            links: p.links, espaco: p.espaco, fonte: p.fonte, cursor: p.cursor, semImagens: p.semImagens, libras: p.libras,
        };
    }

    function mudar(parcial) {
        const p = { ...ler(), ...parcial };
        gravar(p);
        aplicar(p);
    }

    aplicar(ler());

    // ------------------------------------------------------------------
    // Leitura em voz alta: o código (/ouvir.js) só é baixado quando alguém usa.
    // ------------------------------------------------------------------
    let promessaOuvir = null;
    function carregarOuvir() {
        if (window.PibiexOuvir) return Promise.resolve(window.PibiexOuvir);
        if (promessaOuvir) return promessaOuvir;
        promessaOuvir = new Promise((resolve, reject) => {
            const sc = document.createElement('script');
            sc.src = '/ouvir.js';
            sc.onload = () => resolve(window.PibiexOuvir);
            sc.onerror = () => { promessaOuvir = null; reject(new Error('ouvir.js')); };
            document.head.appendChild(sc);
        });
        return promessaOuvir;
    }
    const temVoz = () => !!(window.speechSynthesis && window.SpeechSynthesisUtterance);

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
                    <div><h2 id="a11y-titulo">Acessibilidade</h2><p>Vale só neste aparelho.</p></div>
                </div>

                <div class="a11y-ouvir" id="a11y-ouvir">
                    <h3 class="a11y-sec" id="a11y-t4">Ouvir</h3>
                    <div class="ouvir-botoes">
                        <button type="button" class="ouvir-btn principal" data-ouvir="pagina">Ouvir a página</button>
                        <button type="button" class="ouvir-btn" data-ouvir="daqui">Daqui para baixo</button>
                        <button type="button" class="ouvir-btn" data-ouvir="parar">Parar</button>
                    </div>
                    <div class="a11y-linha interna">
                        <div class="texto"><p class="titulo" id="a11y-t5">Ler o que eu apontar</p>
                            <p class="desc">Passe o mouse ou toque em um texto.</p></div>
                        <button type="button" class="a11y-chave" role="switch" id="a11y-apontar" aria-labelledby="a11y-t5" aria-checked="false"></button>
                    </div>
                    <details class="a11y-mais">
                        <summary>Ajustes da voz</summary>
                        <div class="ouvir-campos">
                            <label>Voz <select id="a11y-voz" aria-label="Voz"></select></label>
                            <label>Velocidade <select id="a11y-vel" aria-label="Velocidade da voz">
                                <option value="0.75">Devagar (0,75x)</option><option value="1">Normal (1x)</option><option value="1.25">Um pouco mais rápida (1,25x)</option>
                                <option value="1.5">Rápida (1,5x)</option><option value="1.75">Bem rápida (1,75x)</option></select></label>
                            <button type="button" class="ouvir-btn" data-ouvir="testar">Testar voz</button>
                        </div>
                        <p class="ouvir-nota" id="a11y-voz-nota"></p>
                        <p class="ouvir-nota">Atalhos: <b>Alt + L</b> começa ou pausa a leitura; <b>Esc</b> para.</p>
                    </details>
                </div>

                <div class="a11y-bloco">
                    <h3 class="a11y-sec">Aparência</h3>
                    <div class="a11y-linha">
                        <div class="texto"><p class="titulo" id="a11y-t1">Alto contraste</p></div>
                        <button type="button" class="a11y-chave" role="switch" id="a11y-contraste" aria-labelledby="a11y-t1" aria-checked="false"></button>
                    </div>
                    <div class="a11y-linha">
                        <div class="texto"><p class="titulo" id="a11y-t2">Tamanho do texto</p></div>
                        <div class="a11y-segmentos" role="radiogroup" aria-labelledby="a11y-t2">
                            <button type="button" role="radio" data-texto="0" aria-checked="false" aria-label="Padrão" style="font-size:14px">A</button>
                            <button type="button" role="radio" data-texto="1" aria-checked="false" aria-label="Grande" style="font-size:17px">A</button>
                            <button type="button" role="radio" data-texto="2" aria-checked="false" aria-label="Maior" style="font-size:20px">A</button>
                        </div>
                    </div>
                    <div class="a11y-linha">
                        <div class="texto"><p class="titulo" id="a11y-t3">Reduzir animações</p></div>
                        <button type="button" class="a11y-chave" role="switch" id="a11y-movimento" aria-labelledby="a11y-t3" aria-checked="false"></button>
                    </div>
                </div>

                <div class="a11y-bloco">
                    <h3 class="a11y-sec">Leitura e navegação</h3>
                    <div class="a11y-grade" id="a11y-extras">
                        ${EXTRAS.map((x) => `<button type="button" class="a11y-tile" role="switch" aria-checked="false" data-extra="${x.chave}">${x.rotulo}</button>`).join('')}
                    </div>
                    <p class="a11y-nota-libras">Libras usa o tradutor gratuito VLibras, do governo federal: ao ligar, seu navegador acessa o site vlibras.gov.br.</p>
                </div>

                <div class="a11y-rodape"><button type="button" class="a11y-restaurar" id="a11y-restaurar">Restaurar o padrão</button></div>
            </section>`;

        const chaveContraste = el.querySelector('#a11y-contraste');
        const chaveMov = el.querySelector('#a11y-movimento');
        const segmentos = [...el.querySelectorAll('[data-texto]')];
        const tilesExtras = [...el.querySelectorAll('[data-extra]')];

        const chaveApontar = el.querySelector('#a11y-apontar');
        const selVoz = el.querySelector('#a11y-voz');
        const selVel = el.querySelector('#a11y-vel');
        const notaVoz = el.querySelector('#a11y-voz-nota');

        function desenhar() {
            const e = estado();
            chaveApontar.setAttribute('aria-checked', String(e.apontar));
            if (selVel.value !== String(e.velocidade)) selVel.value = String(e.velocidade);
            chaveContraste.setAttribute('aria-checked', String(e.contraste));
            chaveMov.setAttribute('aria-checked', String(e.semMovimento));
            segmentos.forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.texto) === e.texto)));
            tilesExtras.forEach((b) => b.setAttribute('aria-checked', String(e[b.dataset.extra] === true)));
        }

        chaveContraste.onclick = () => { mudar({ contraste: !estado().contraste }); desenhar(); };
        chaveMov.onclick = () => { mudar({ semMovimento: !estado().semMovimento }); desenhar(); };
        tilesExtras.forEach((b) => { b.onclick = () => { mudar({ [b.dataset.extra]: !estado()[b.dataset.extra] }); desenhar(); }; });
        segmentos.forEach((b) => { b.onclick = () => { mudar({ texto: Number(b.dataset.texto) }); desenhar(); }; });
        el.querySelector('#a11y-restaurar').onclick = () => {
            try { localStorage.removeItem(CHAVE); } catch (e) { /* ok */ }
            aplicar(ler());
            desenhar();
        };
        // ---- leitura em voz alta
        const blocoVoz = el.querySelector('#a11y-ouvir');
        function nomeBonito(n) { return n.replace(/^Microsoft\s+/, '').replace(/\s+-\s+Portuguese.*$/i, '').replace(/^Google\s+/, 'Google '); }
        function explicar() {
            const escolhida = selVoz.selectedOptions && selVoz.selectedOptions[0];
            if (!escolhida) { notaVoz.textContent = ''; return; }
            const online = escolhida.dataset.local === '0';
            const fabricante = /google/i.test(escolhida.textContent) ? 'do Google' : 'da Microsoft';
            notaVoz.textContent = online
                ? 'Esta é uma voz online: para gerar o áudio, o navegador envia o texto lido ao serviço ' + fabricante + '. Nas vozes "neste aparelho", nada sai do seu aparelho.'
                : 'Esta voz funciona neste aparelho: o texto lido não sai dele.';
        }
        if (!temVoz()) {
            blocoVoz.innerHTML = '<p class="titulo">Ouvir a página</p><p class="desc">Este navegador não tem leitura em voz. No Edge, Chrome, Safari ou Firefox atualizados costuma ter.</p>';
        } else {
            carregarOuvir().then(async (O) => {
                const lista = await O.aguardarVozes();
                const salva = estado().voz;
                if (!lista.length) {
                    selVoz.innerHTML = '<option value="">Voz padrão do aparelho</option>';
                    notaVoz.textContent = 'Seu aparelho não tem voz em português instalada. No Windows: Configurações, Hora e idioma, Fala. No Android ou iPhone: Ajustes, Acessibilidade, Fala. O Edge e o Chrome atuais costumam trazer vozes em português.';
                    return;
                }
                selVoz.innerHTML = lista.map((v, i) => '<option value="' + v.nome.replace(/"/g, '&quot;') + '" data-local="' + (v.local ? 1 : 0) + '">' +
                    nomeBonito(v.nome).replace(/</g, '&lt;') + ' · ' + (v.local ? 'neste aparelho' : 'online') + (i === 0 ? ' · recomendada' : '') + '</option>').join('');
                if (salva && lista.some((v) => v.nome === salva)) selVoz.value = salva;
                explicar();
            }).catch(() => { notaVoz.textContent = 'Não foi possível carregar a leitura em voz agora.'; });

            selVoz.onchange = () => { mudar({ voz: selVoz.value }); explicar(); };
            selVel.onchange = () => mudar({ velocidade: Number(selVel.value) });
            chaveApontar.onclick = () => {
                const ligar = !estado().apontar;
                mudar({ apontar: ligar });
                desenhar();
                carregarOuvir().then((O) => O.ligarApontar(ligar));
            };
            blocoVoz.querySelectorAll('[data-ouvir]').forEach((b) => {
                b.onclick = () => carregarOuvir().then((O) => {
                    const acao = b.dataset.ouvir;
                    // o cartão sai da frente para a pessoa acompanhar o trecho lido
                    if (acao === 'pagina' || acao === 'daqui') document.dispatchEvent(new CustomEvent('pibiex:ouvir-iniciou'));
                    if (acao === 'testar') O.testarVoz(); else O[acao]();
                }).catch(() => { /* sem leitura */ });
            });
        }

        // se o cartão for desenhado de novo no mesmo lugar (botão flutuante), não acumula ouvintes
        if (el.__a11yDesenhar) document.removeEventListener('pibiex:a11y', el.__a11yDesenhar);
        el.__a11yDesenhar = desenhar;
        document.addEventListener('pibiex:a11y', desenhar);
        desenhar();
    }

    // Itens rápidos para o menu da conta (topo da página): contraste e "Ouvir a página".
    function itemDoMenu() {
        const caixa = document.createElement('div');
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
        caixa.appendChild(botao);

        if (temVoz()) {
            const ouvir = document.createElement('button');
            ouvir.type = 'button';
            ouvir.className = 'a11y-menu-item';
            ouvir.setAttribute('role', 'menuitem');
            ouvir.innerHTML = '<span>Ouvir a página</span><span class="a11y-menu-ico" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6"/></svg></span>';
            ouvir.onclick = (e) => {
                e.stopPropagation();
                const menu = ouvir.closest('[id^="menu-conta"]');
                if (menu) menu.classList.add('hidden');
                carregarOuvir().then((O) => O.pagina()).catch(() => { /* sem leitura */ });
            };
            caixa.appendChild(ouvir);
        }
        return caixa;
    }

    // ------------------------------------------------------------------
    // Janelas de confirmação e de pergunta da plataforma (no lugar de confirm() e prompt() do navegador).
    //   await PibiexA11y.confirmar('Excluir este item?')  -> true | false
    //   await PibiexA11y.perguntar('Quantos minutos?', '5') -> texto | null
    // Teclado: Esc cancela, Enter confirma, Tab fica dentro da janela. O foco volta para onde estava.
    // ------------------------------------------------------------------
    function dialogo(cfg) {
        return new Promise((resolve) => {
            const anterior = document.activeElement;
            const id = 'dlg-' + Math.random().toString(36).slice(2, 8);
            const fundo = document.createElement('div');
            fundo.className = 'dlg-fundo';
            const caixa = document.createElement('div');
            caixa.className = 'dlg';
            caixa.setAttribute('role', 'alertdialog');
            caixa.setAttribute('aria-modal', 'true');
            caixa.setAttribute('aria-labelledby', id + '-t');
            caixa.setAttribute('aria-describedby', id + '-d');

            const t = document.createElement('h2');
            t.id = id + '-t'; t.className = 'dlg-titulo'; t.textContent = cfg.titulo;
            const d = document.createElement('p');
            d.id = id + '-d'; d.className = 'dlg-texto'; d.textContent = cfg.texto;
            caixa.append(t, d);

            let campo = null;
            if (cfg.campo) {
                campo = document.createElement('input');
                campo.className = 'dlg-campo'; campo.type = 'text'; campo.value = cfg.padrao || '';
                campo.setAttribute('aria-label', cfg.texto);
                caixa.appendChild(campo);
            }

            const barra = document.createElement('div');
            barra.className = 'dlg-botoes';
            const nao = document.createElement('button');
            nao.type = 'button'; nao.className = 'dlg-nao'; nao.textContent = cfg.nao || 'Cancelar';
            const sim = document.createElement('button');
            sim.type = 'button'; sim.className = 'dlg-sim' + (cfg.perigo ? ' perigo' : ''); sim.textContent = cfg.sim || 'Confirmar';
            barra.append(nao, sim);
            caixa.appendChild(barra);
            fundo.appendChild(caixa);
            document.body.appendChild(fundo);

            const fechar = (valor) => {
                document.removeEventListener('keydown', teclas, true);
                fundo.remove();
                if (anterior && anterior.focus) { try { anterior.focus(); } catch (e) { /* ok */ } }
                resolve(valor);
            };
            const confirmar = () => fechar(campo ? campo.value : true);
            const cancelar = () => fechar(campo ? null : false);
            function teclas(e) {
                if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancelar(); }
                else if (e.key === 'Enter' && (campo ? document.activeElement === campo : document.activeElement === sim)) { e.preventDefault(); confirmar(); }
                else if (e.key === 'Tab') {
                    const itens = [...caixa.querySelectorAll('input, button')];
                    const i = itens.indexOf(document.activeElement);
                    const prox = e.shiftKey ? itens[(i <= 0 ? itens.length : i) - 1] : itens[(i + 1) % itens.length];
                    e.preventDefault(); prox.focus();
                }
            }
            document.addEventListener('keydown', teclas, true);
            sim.onclick = confirmar;
            nao.onclick = cancelar;
            fundo.addEventListener('mousedown', (e) => { if (e.target === fundo) cancelar(); });
            // em ações perigosas o foco começa em "Cancelar" (evita apagar por um Enter sem querer)
            (campo || (cfg.perigo ? nao : sim)).focus();
            if (campo) campo.select();
        });
    }

    // Deduz o nome do botão e se a ação é perigosa a partir da frase.
    function confirmar(texto, opcoes) {
        const frase = String(texto == null ? '' : texto);
        const verbo = (frase.match(/^\s*(Excluir|Apagar|Remover|Encerrar|Reabrir|Pausar|Desativar|Enviar|Abrir|Liberar|Reenviar|Sair)/i) || [])[1];
        const perigo = /^(excluir|apagar|remover|desativar|pausar|encerrar)/i.test(verbo || '');
        const cfg = Object.assign({
            titulo: perigo ? 'Tem certeza?' : 'Confirmar',
            texto: frase,
            sim: verbo ? verbo.charAt(0).toUpperCase() + verbo.slice(1).toLowerCase() : 'Confirmar',
            perigo,
        }, opcoes || {});
        return dialogo(cfg);
    }
    function perguntar(texto, padrao, opcoes) {
        return dialogo(Object.assign({ titulo: 'Responder', texto: String(texto || ''), campo: true, padrao: padrao == null ? '' : String(padrao), sim: 'OK' }, opcoes || {}));
    }

    // ------------------------------------------------------------------
    // Botão flutuante de acessibilidade, para as páginas públicas (quem só está visitando).
    // Abre o mesmo cartão do Perfil. Na primeira visita aparece uma dica curta, uma vez só.
    // Nada disso fala com o servidor: é só este arquivo e o CSS que a página já carrega.
    // ------------------------------------------------------------------
    function botaoFlutuante() {
        if (document.getElementById('a11y-fab')) return;
        const CHAVE_DICA = 'pibiex_a11y_dica';

        const fab = document.createElement('button');
        fab.type = 'button';
        fab.id = 'a11y-fab';
        fab.className = 'a11y-fab';
        fab.setAttribute('aria-label', 'Opções de acessibilidade: contraste, tamanho do texto, movimento e leitura em voz alta');
        fab.setAttribute('aria-expanded', 'false');
        fab.setAttribute('aria-controls', 'a11y-pop');
        fab.title = 'Acessibilidade';
        fab.innerHTML = '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="7.5" r="1.3" fill="currentColor" stroke="none"/><path d="M7 10.5l5 1 5-1M12 11.5V15m0 0-2.5 4M12 15l2.5 4"/></svg>';

        const pop = document.createElement('div');
        pop.id = 'a11y-pop';
        pop.className = 'a11y-pop';
        pop.hidden = true;
        pop.setAttribute('role', 'dialog');
        pop.setAttribute('aria-label', 'Acessibilidade');
        const conteudo = document.createElement('div');
        const fechar = document.createElement('button');
        fechar.type = 'button';
        fechar.className = 'a11y-pop-fechar';
        fechar.setAttribute('aria-label', 'Fechar opções de acessibilidade');
        fechar.textContent = '×';
        pop.append(fechar, conteudo);

        let dica = null;
        function esconderDica(lembrar) {
            if (dica) { dica.remove(); dica = null; }
            if (lembrar) { try { localStorage.setItem(CHAVE_DICA, '1'); } catch (e) { /* ok */ } }
        }

        function abrir() {
            esconderDica(true);
            montarPainel(conteudo);
            pop.hidden = false;
            fab.setAttribute('aria-expanded', 'true');
            const primeiro = pop.querySelector('.a11y-chave') || pop.querySelector('button');
            if (primeiro) primeiro.focus();
        }
        function fecharPainel(devolverFoco) {
            pop.hidden = true;
            fab.setAttribute('aria-expanded', 'false');
            if (devolverFoco) fab.focus();
        }
        fab.onclick = () => (pop.hidden ? abrir() : fecharPainel(true));
        fechar.onclick = () => fecharPainel(true);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !pop.hidden) fecharPainel(true); });
        document.addEventListener('pibiex:ouvir-iniciou', () => fecharPainel(false));
        document.addEventListener('mousedown', (e) => { if (!pop.hidden && !pop.contains(e.target) && !fab.contains(e.target)) fecharPainel(false); });

        document.body.append(pop, fab);

        // Dica da primeira visita (só se a pessoa ainda não mexeu nas preferências).
        let jaViu = false, jaEscolheu = false;
        try { jaViu = localStorage.getItem(CHAVE_DICA) === '1'; jaEscolheu = !!localStorage.getItem(CHAVE); } catch (e) { /* ok */ }
        if (!jaViu && !jaEscolheu) {
            setTimeout(() => {
                if (!pop.hidden) return;
                dica = document.createElement('div');
                dica.className = 'a11y-dica';
                dica.setAttribute('role', 'status');
                dica.innerHTML = 'Precisa de letras maiores, mais contraste ou quer ouvir a página? <u>Toque aqui</u>.<button type="button" aria-label="Dispensar dica">×</button>';
                dica.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') esconderDica(true); else abrir(); });
                document.body.appendChild(dica);
                setTimeout(() => { if (dica) esconderDica(true); }, 12000);
            }, 2500);
        }
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

    window.PibiexA11y = { estado, mudar, montarPainel, itemDoMenu, botaoFlutuante, confirmar, perguntar, aviso: mostrarAviso, ouvir: { carregar: carregarOuvir, suportado: temVoz } };

    // ------------------------------------------------------------------
    // Ajustes de leitura (depois que a página existe)
    // ------------------------------------------------------------------
    function iniciar() {
        // "Ler o que eu apontar" ficou ligado de uma visita anterior
        if (temVoz() && ler().apontar) carregarOuvir().then((O) => O.ligarApontar(true)).catch(() => { /* ok */ });
        // Alt + L: começa, pausa ou continua a leitura
        document.addEventListener('keydown', (e) => {
            if (!(e.altKey && !e.ctrlKey && !e.metaKey && (e.key === 'l' || e.key === 'L')) || !temVoz()) return;
            e.preventDefault();
            carregarOuvir().then((O) => { if (O.tocando()) O.alternarPausa(); else O.pagina(); }).catch(() => { /* ok */ });
        });
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
