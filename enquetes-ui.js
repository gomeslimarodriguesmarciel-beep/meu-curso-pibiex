// /enquetes-ui.js
//
// Peças de tela das enquetes, usadas pelo painel do professor e pela área do aluno:
//   - renderApuracao(): gráficos de resultado (barras, estilo apuração de eleição)
//   - montarIndicador(): o botão "Votação ao vivo" ao lado do perfil, com o painel de resultados
//   - bloquearTela(): a tela grande que prende o aluno até ele votar
//
// Todo texto que vem do servidor é escapado antes de ir para a tela.

(function () {
    function esc(t) {
        const d = document.createElement('div');
        d.textContent = t == null ? '' : String(t);
        return d.innerHTML;
    }

    const ICO = {
        coroa: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/></svg>',
        urna: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16v8H4z"/><path d="M9 12V9h6v3"/><path d="M12 3v7M9 7l3 3 3-3"/></svg>',
        fechar: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    };

    function injetarEstilo() {
        if (document.getElementById('enq-estilo')) return;
        const st = document.createElement('style');
        st.id = 'enq-estilo';
        st.textContent = `
        .enq-ponto { width: 8px; height: 8px; border-radius: 50%; background: #22C55E; flex-shrink: 0; animation: enq-pulso 1.6s infinite; }
        .enq-ponto.encerrada { background: #94A3B8; animation: none; }
        @keyframes enq-pulso { 0% { box-shadow: 0 0 0 0 rgba(34,197,94,.6); } 70% { box-shadow: 0 0 0 8px rgba(34,197,94,0); } 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); } }
        @media (prefers-reduced-motion: reduce) { .enq-ponto { animation: none; } .enq-barra > div { transition: none !important; } }

        .enq-indicador { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; border: 1px solid #E5E7EB;
                         background: #fff; font-size: 12px; font-weight: 700; color: #111827; cursor: pointer; white-space: nowrap; }
        .enq-indicador[hidden], .enq-painel[hidden] { display: none !important; }
        .enq-indicador:hover { background: #F9FAFB; }
        .enq-indicador:focus-visible { outline: 2px solid #1E3A8A; outline-offset: 2px; }
        .enq-indicador.encerrada { color: #475569; }
        .enq-indicador small { font-weight: 600; color: #6B7280; }
        .enq-painel { position: absolute; right: 0; top: calc(100% + 10px); width: min(440px, calc(100vw - 24px)); max-height: min(78vh, 680px); overflow-y: auto;
                      background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; box-shadow: 0 20px 50px rgba(15,23,42,.22); z-index: 60; text-align: left; }
        .enq-painel-topo { position: sticky; top: 0; background: #0B1B4A; color: #fff; padding: 14px 16px; display: flex; align-items: center; justify-content: space-between; gap: 10px; border-radius: 16px 16px 0 0; z-index: 1; }
        .enq-painel-topo b { font-size: 13px; letter-spacing: .06em; text-transform: uppercase; }
        .enq-painel-topo span { font-size: 11px; color: #A5B4FC; }
        .enq-bloco { padding: 16px; border-top: 1px solid #F1F5F9; }
        .enq-bloco:first-of-type { border-top: 0; }
        .enq-titulo { font-size: 14px; font-weight: 800; color: #111827; margin: 0 0 2px; }
        .enq-meta { font-size: 11.5px; color: #6B7280; margin: 0 0 10px; }
        .enq-selo { display: inline-flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; padding: 3px 8px; border-radius: 999px; }
        .enq-selo.aberta { background: #DCFCE7; color: #15803D; }
        .enq-selo.encerrada { background: #E2E8F0; color: #334155; }
        .enq-selo.rascunho { background: #FEF9C3; color: #A16207; }
        .enq-presenca { height: 8px; background: #E5E7EB; border-radius: 999px; overflow: hidden; margin: 6px 0 4px; }
        .enq-presenca > div { height: 100%; background: #1E3A8A; border-radius: 999px; transition: width .6s ease; }
        .enq-pergunta { margin: 14px 0 0; }
        .enq-pergunta h4 { font-size: 13px; font-weight: 700; color: #1F2937; margin: 0 0 8px; }
        .enq-linha { margin-bottom: 8px; }
        .enq-linha-topo { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12.5px; color: #374151; margin-bottom: 3px; }
        .enq-linha-topo .nome { display: flex; align-items: center; gap: 6px; min-width: 0; font-weight: 600; }
        .enq-linha-topo .nome span { overflow-wrap: anywhere; }
        .enq-linha-topo .num { font-variant-numeric: tabular-nums; color: #111827; font-weight: 800; flex-shrink: 0; }
        .enq-linha-topo .num small { color: #6B7280; font-weight: 600; margin-left: 4px; }
        .enq-barra { height: 12px; background: #EEF2FF; border-radius: 999px; overflow: hidden; }
        .enq-barra > div { height: 100%; background: #94A3B8; border-radius: 999px; width: 0; transition: width .7s cubic-bezier(.2,.8,.2,1); }
        .enq-linha.lider .enq-barra > div { background: #16A34A; }
        .enq-linha.lider .enq-linha-topo .nome { color: #166534; }
        .enq-coroa { color: #CA8A04; display: inline-flex; }
        .enq-escala { display: flex; align-items: flex-end; gap: 6px; height: 74px; }
        .enq-escala > div { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 3px; height: 100%; font-size: 11px; color: #475569; }
        .enq-escala i { display: block; width: 100%; background: #1E3A8A; border-radius: 6px 6px 0 0; min-height: 2px; transition: height .7s cubic-bezier(.2,.8,.2,1); }
        .enq-nada { font-size: 12.5px; color: #6B7280; padding: 18px 16px; text-align: center; }
        .enq-textos { margin: 0; padding: 0; list-style: none; max-height: 160px; overflow-y: auto; }
        .enq-textos li { font-size: 12.5px; color: #374151; padding: 6px 10px; background: #F8FAFC; border-radius: 8px; margin-bottom: 4px; overflow-wrap: anywhere; }

        /* tela de bloqueio */
        #enq-bloqueio { position: fixed; inset: 0; z-index: 2147483000; display: flex; align-items: center; justify-content: center; padding: 20px;
                        background: radial-gradient(1200px 700px at 50% -10%, #1E3A8A 0%, #0B1B4A 55%, #070F2E 100%); color: #fff; font-family: 'Inter', system-ui, sans-serif; }
        #enq-bloqueio .cartao { width: min(640px, 100%); text-align: center; }
        #enq-bloqueio .selo-grande { display: inline-flex; align-items: center; gap: 10px; font-size: 13px; font-weight: 800; letter-spacing: .18em; text-transform: uppercase;
                                     color: #A3E635; border: 1.5px solid rgba(163,230,53,.6); padding: 8px 18px; border-radius: 999px; margin-bottom: 26px; }
        #enq-bloqueio h1 { font-size: clamp(30px, 6vw, 54px); font-weight: 900; line-height: 1.08; margin: 0 0 14px; overflow-wrap: anywhere; }
        #enq-bloqueio p.desc { font-size: clamp(15px, 2.4vw, 19px); color: #C7D2FE; line-height: 1.5; margin: 0 auto 10px; max-width: 520px; overflow-wrap: anywhere; }
        #enq-bloqueio p.aviso { font-size: 14px; color: #A5B4FC; margin: 18px auto 30px; max-width: 480px; }
        #enq-bloqueio a.botao { display: inline-flex; align-items: center; gap: 10px; background: #A3E635; color: #0B1B4A; font-weight: 900; font-size: clamp(17px, 2.6vw, 22px);
                                padding: 18px 42px; border-radius: 999px; text-decoration: none; box-shadow: 0 14px 40px rgba(163,230,53,.28); transition: transform .15s; }
        #enq-bloqueio a.botao:hover { transform: scale(1.04); }
        #enq-bloqueio a.botao:focus-visible { outline: 3px solid #fff; outline-offset: 4px; }
        #enq-bloqueio .mais { margin-top: 20px; font-size: 13px; color: #A5B4FC; }
        `;
        document.head.appendChild(st);
    }

    // ------------------------------------------------------------------
    // Gráficos de apuração
    // ------------------------------------------------------------------
    function fmtPct(n) {
        return (Math.round(n * 10) / 10).toString().replace('.', ',') + '%';
    }

    function rotuloStatus(status) {
        return status === 'aberta'
            ? '<span class="enq-selo aberta"><span class="enq-ponto"></span>Ao vivo</span>'
            : status === 'encerrada'
                ? '<span class="enq-selo encerrada">Votação encerrada</span>'
                : '<span class="enq-selo rascunho">Rascunho</span>';
    }

    function renderPergunta(p) {
        let corpo = '';
        if (p.opcoes) {
            // Estilo apuração: mais votada no topo.
            const ordenadas = [...p.opcoes].sort((a, b) => b.votos - a.votos);
            corpo = ordenadas.map((o) => `
                <div class="enq-linha ${o.lider ? 'lider' : ''}">
                    <div class="enq-linha-topo">
                        <span class="nome">${o.lider ? `<span class="enq-coroa" title="Na frente">${ICO.coroa}</span>` : ''}<span>${esc(o.texto)}</span></span>
                        <span class="num">${o.votos}<small>${fmtPct(o.percentual)}</small></span>
                    </div>
                    <div class="enq-barra"><div data-largura="${Math.min(100, o.percentual)}"></div></div>
                </div>`).join('');
        } else if (p.escala) {
            const maxVotos = Math.max(1, ...p.escala.distribuicao.map((d) => d.votos));
            corpo = `
                <div class="enq-escala">${p.escala.distribuicao.map((d) => `
                    <div><span>${d.votos}</span><i data-altura="${Math.round((d.votos / maxVotos) * 100)}" style="height:0"></i><span>${d.nota}</span></div>`).join('')}
                </div>
                <p class="enq-meta" style="margin-top:8px">Média: <b>${p.escala.media == null ? '–' : String(p.escala.media).replace('.', ',')}</b> de ${p.escala.max}</p>`;
        } else if (p.textos) {
            corpo = p.textos.length
                ? `<ul class="enq-textos">${p.textos.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
                : '<p class="enq-meta">Ninguém respondeu ainda.</p>';
        } else {
            corpo = `<p class="enq-meta">${p.totalRespostas} ${p.totalRespostas === 1 ? 'resposta' : 'respostas'} (respostas escritas ficam só com o professor).</p>`;
        }
        return `
            <div class="enq-pergunta">
                <h4>${p.ordem}. ${esc(p.texto)}</h4>
                ${corpo}
                <p class="enq-meta" style="margin:6px 0 0">${p.totalRespostas} ${p.totalRespostas === 1 ? 'resposta' : 'respostas'}</p>
            </div>`;
    }

    // enquete = { titulo, status, votos, totalAlunos, perguntas: [apuração] }
    function renderApuracao(enquete, opcoes) {
        const o = opcoes || {};
        const pct = enquete.totalAlunos ? Math.min(100, (enquete.votos / enquete.totalAlunos) * 100) : 0;
        return `
            <div class="enq-bloco">
                <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px">
                    <p class="enq-titulo">${esc(enquete.titulo)}</p>
                    ${rotuloStatus(enquete.status)}
                </div>
                <div class="enq-presenca" aria-hidden="true"><div data-largura="${pct}"></div></div>
                <p class="enq-meta">${enquete.votos} de ${enquete.totalAlunos} ${enquete.totalAlunos === 1 ? 'aluno votou' : 'alunos votaram'} (${fmtPct(pct)})</p>
                ${o.acoes || ''}
                ${enquete.perguntas.map(renderPergunta).join('')}
            </div>`;
    }

    // As barras começam em 0 e crescem (a transição CSS faz a animação).
    function animarBarras(raiz) {
        const agora = () => {
            raiz.querySelectorAll('[data-largura]').forEach((el) => { el.style.width = el.dataset.largura + '%'; });
            raiz.querySelectorAll('[data-altura]').forEach((el) => { el.style.height = el.dataset.altura + '%'; });
        };
        requestAnimationFrame(() => requestAnimationFrame(agora));
    }

    // ------------------------------------------------------------------
    // Indicador ao lado do perfil
    //   buscar(): Promise<[{ id, titulo, status, votos, totalAlunos, perguntas }]>
    //   papel: 'aluno' | 'professor'
    //   encerrar(enqueteId): só no professor
    // ------------------------------------------------------------------
    function montarIndicador(config) {
        injetarEstilo();
        const slot = document.getElementById('indicador-enquete');
        if (!slot) return null;

        slot.style.position = 'relative';
        slot.innerHTML = '';
        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'enq-indicador';
        botao.hidden = true;
        botao.setAttribute('aria-haspopup', 'dialog');
        botao.setAttribute('aria-expanded', 'false');
        const painel = document.createElement('div');
        painel.className = 'enq-painel';
        painel.setAttribute('role', 'dialog');
        painel.setAttribute('aria-label', 'Acompanhamento da votação');
        painel.hidden = true;
        slot.appendChild(botao);
        slot.appendChild(painel);

        let dados = [];
        let aberto = false;
        let ultimo = null;
        let relogio = null;
        let temporizador = null;

        function desenharBotao() {
            if (!dados.length) { botao.hidden = true; return; }
            botao.hidden = false;
            const aoVivo = dados.filter((e) => e.status === 'aberta');
            const e = aoVivo[0] || dados[0];
            const encerrada = aoVivo.length === 0;
            botao.classList.toggle('encerrada', encerrada);
            const extra = dados.length > 1 ? ` +${dados.length - 1}` : '';
            botao.innerHTML = encerrada
                ? `<span class="enq-ponto encerrada"></span><span>Votação encerrada${extra}</span>`
                : `<span class="enq-ponto"></span><span>Votação ao vivo${extra}</span><small>${e.votos}/${e.totalAlunos}</small>`;
        }

        function desenharPainel() {
            if (!aberto) return;
            const topo = `
                <div class="enq-painel-topo">
                    <div><b>Apuração</b><br><span id="enq-atualizado">Atualizado agora</span></div>
                    <button type="button" id="enq-fechar-painel" aria-label="Fechar" style="background:none;border:0;color:#fff;cursor:pointer;display:flex">${ICO.fechar}</button>
                </div>`;
            const corpo = dados.map((e) => {
                const acoes = config.papel === 'professor'
                    ? `<div style="display:flex;gap:8px;margin:2px 0 4px;flex-wrap:wrap">
                           ${e.status === 'aberta' ? `<button type="button" data-encerrar="${esc(e.id)}" style="background:#DC2626;color:#fff;border:0;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:800;cursor:pointer">Encerrar votação</button>` : ''}
                           <a href="enquetes.html?id=${encodeURIComponent(e.id)}" style="font-size:12px;font-weight:700;color:#1E3A8A;padding:7px 4px">Ver detalhes</a>
                       </div>`
                    : '';
                return renderApuracao(e, { acoes });
            }).join('');
            painel.innerHTML = topo + corpo;
            painel.querySelector('#enq-fechar-painel').onclick = () => alternar(false);
            painel.querySelectorAll('[data-encerrar]').forEach((b) => {
                b.onclick = async () => {
                    if (!confirm('Encerrar esta votação agora? Ninguém mais poderá votar.')) return;
                    b.disabled = true; b.textContent = 'Encerrando…';
                    try { await config.encerrar(b.dataset.encerrar); } catch (e) { alert((e && e.message) || 'Não foi possível encerrar.'); }
                    await atualizar();
                };
            });
            animarBarras(painel);
        }

        function marcarHora() {
            const el = painel.querySelector('#enq-atualizado');
            if (!el || !ultimo) return;
            const s = Math.max(0, Math.round((Date.now() - ultimo) / 1000));
            el.textContent = s < 4 ? 'Atualizado agora' : `Atualizado há ${s} s`;
        }

        async function atualizar() {
            try {
                dados = (await config.buscar()) || [];
                ultimo = Date.now();
            } catch (e) { return; }
            desenharBotao();
            desenharPainel();
        }

        function agendar() {
            clearTimeout(temporizador);
            temporizador = setTimeout(async () => { await atualizar(); agendar(); }, aberto ? 6000 : 20000);
        }

        function alternar(forcar) {
            aberto = typeof forcar === 'boolean' ? forcar : !aberto;
            painel.hidden = !aberto;
            botao.setAttribute('aria-expanded', String(aberto));
            if (aberto) {
                desenharPainel();
                atualizar();
                relogio = setInterval(marcarHora, 1000);
            } else {
                clearInterval(relogio);
            }
            agendar();
        }

        botao.onclick = () => alternar();
        document.addEventListener('click', (e) => { if (aberto && !slot.contains(e.target)) alternar(false); });
        document.addEventListener('keydown', (e) => { if (aberto && e.key === 'Escape') { alternar(false); botao.focus(); } });

        atualizar().then(agendar);
        return { atualizar };
    }

    // ------------------------------------------------------------------
    // Tela de bloqueio do aluno
    // ------------------------------------------------------------------
    let bloqueioAtivo = null;
    function bloquearTela(pendentes, urlDaEnquete) {
        injetarEstilo();
        if (!pendentes.length) { liberarTela(); return; }
        const primeira = pendentes[0];
        const assinatura = pendentes.map((p) => p.id).join(',');
        if (bloqueioAtivo && bloqueioAtivo.dataset.assinatura === assinatura) return;
        liberarTela();

        const raiz = document.createElement('div');
        raiz.id = 'enq-bloqueio';
        raiz.dataset.assinatura = assinatura;
        raiz.setAttribute('role', 'alertdialog');
        raiz.setAttribute('aria-modal', 'true');
        raiz.setAttribute('aria-labelledby', 'enq-bloqueio-titulo');
        raiz.innerHTML = `
            <div class="cartao">
                <div class="selo-grande"><span class="enq-ponto"></span>Enquete aberta agora</div>
                <h1 id="enq-bloqueio-titulo">${esc(primeira.titulo)}</h1>
                ${primeira.descricao ? `<p class="desc">${esc(primeira.descricao)}</p>` : ''}
                <p class="aviso">A sua participação é obrigatória. Você precisa votar para continuar usando a plataforma.</p>
                <a class="botao" href="${esc(urlDaEnquete(primeira.id))}">Responder agora <span aria-hidden="true">→</span></a>
                ${pendentes.length > 1 ? `<p class="mais">Você tem ${pendentes.length} enquetes para responder.</p>` : ''}
            </div>`;
        document.body.appendChild(raiz);
        document.body.style.overflow = 'hidden';
        // O resto da página fica inacessível (leitor de tela e teclado) enquanto o bloqueio existe.
        [...document.body.children].forEach((el) => { if (el !== raiz) { el.setAttribute('inert', ''); el.dataset.enqInert = '1'; } });
        bloqueioAtivo = raiz;
        raiz.querySelector('a.botao').focus();

        // Sem Esc, sem clique fora: o único caminho é votar.
        raiz.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') { e.preventDefault(); raiz.querySelector('a.botao').focus(); }
        });
    }

    function liberarTela() {
        if (!bloqueioAtivo) return;
        bloqueioAtivo.remove();
        bloqueioAtivo = null;
        document.body.style.overflow = '';
        document.querySelectorAll('[data-enq-inert]').forEach((el) => { el.removeAttribute('inert'); delete el.dataset.enqInert; });
    }

    window.EnquetesUI = { esc, injetarEstilo, renderApuracao, animarBarras, montarIndicador, bloquearTela, liberarTela, rotuloStatus, fmtPct, ICO };
})();
