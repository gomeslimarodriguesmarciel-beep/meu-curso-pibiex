// /enquetes-ui.js
//
// Peças de tela das enquetes, usadas pelo painel do professor e pela área do aluno:
//   - renderApuracao(): gráficos de resultado (barras, colunas, pizza, rosca ou placar, à escolha de quem olha)
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
        .enq-fundo { position: fixed; inset: 0; background: rgba(2,6,23,.6); z-index: 59; animation: enq-aparece .18s ease; }
        @keyframes enq-aparece { from { opacity: 0; } to { opacity: 1; } }
        @keyframes enq-sobe { from { transform: translateY(24px); opacity: .6; } to { transform: none; opacity: 1; } }
        .enq-rotulo-curto { display: none; }
        .enq-painel { overscroll-behavior: contain; -webkit-overflow-scrolling: touch; }
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

        /* Celular: o painel vira uma folha que sobe de baixo, com a largura toda da tela,
           altura limitada ao que cabe (descontando as barras do navegador) e rolagem por dentro. */
        @media (max-width: 640px) {
            .enq-painel { position: fixed; left: 0; right: 0; top: auto; bottom: 0; width: 100%; max-height: 88vh; max-height: 88dvh;
                          border-radius: 20px 20px 0 0; border: 0; z-index: 60; padding-bottom: env(safe-area-inset-bottom);
                          box-shadow: 0 -18px 48px rgba(2,6,23,.45); animation: enq-sobe .22s ease; }
            .enq-painel-topo { border-radius: 20px 20px 0 0; padding: 18px 16px 14px; }
            .enq-painel-topo::before { content: ""; position: absolute; top: 7px; left: 50%; width: 38px; height: 4px; margin-left: -19px; border-radius: 4px; background: rgba(255,255,255,.35); }
            .enq-painel-topo button { width: 44px; height: 44px; align-items: center; justify-content: center; margin: -8px -8px -8px 0; }
            .enq-bloco { padding: 14px 16px 18px; }
            .enq-indicador { padding: 6px 10px; gap: 6px; }
            .enq-rotulo-longo { display: none; }
            .enq-rotulo-curto { display: inline; }
        }


        /* escolha do tipo de gráfico */
        .enq-tipos { display: inline-flex; gap: 2px; padding: 3px; background: #F1F5F9; border-radius: 10px; margin: 0 0 10px; }
        .enq-tipos button { display: inline-flex; align-items: center; gap: 5px; border: 0; background: transparent; color: #475569; padding: 5px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; cursor: pointer; line-height: 1; }
        .enq-tipos button:hover { background: #E2E8F0; }
        .enq-tipos button[aria-checked="true"] { background: #fff; color: #0B1B4A; box-shadow: 0 1px 3px rgba(15,23,42,.18); }
        .enq-tipos button svg { flex-shrink: 0; }
        .enq-tipos .enq-tipo-nome { display: none; }
        .enq-tipos button[aria-checked="true"] .enq-tipo-nome { display: inline; }
        .enq-grafico { min-width: 0; }
        .enq-svg { display: block; width: 100%; height: auto; max-height: 260px; overflow: visible; }
        .enq-svg text { font-family: inherit; fill: #374151; }
        .enq-svg .valor { font-weight: 800; fill: #111827; }
        .enq-fade { animation: enq-aparece .5s ease both; }
        .enq-cresce { transform-box: fill-box; transform-origin: 50% 100%; animation: enq-cresce .7s cubic-bezier(.2,.8,.2,1) both; }
        @keyframes enq-cresce { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        .enq-pizza { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 18px; }
        .enq-pizza > svg { width: 168px; height: 168px; flex-shrink: 0; overflow: visible; }
        .enq-pizza .centro-num { font-size: 26px; font-weight: 900; fill: #0B1B4A; }
        .enq-pizza .centro-txt { font-size: 10px; font-weight: 700; fill: #64748B; letter-spacing: .08em; text-transform: uppercase; }
        .enq-legenda { list-style: none; margin: 0; padding: 0; flex: 1; min-width: 150px; }
        .enq-legenda li { display: flex; align-items: center; gap: 8px; font-size: 12.5px; color: #374151; padding: 3px 0; }
        .enq-legenda i { width: 11px; height: 11px; border-radius: 3px; flex-shrink: 0; }
        .enq-legenda .t { flex: 1; min-width: 0; overflow-wrap: anywhere; font-weight: 600; }
        .enq-legenda .n { font-variant-numeric: tabular-nums; font-weight: 800; color: #111827; flex-shrink: 0; }
        .enq-legenda .n small { color: #6B7280; font-weight: 600; margin-left: 4px; }
        .enq-placar { list-style: none; margin: 0; padding: 0; counter-reset: pos; }
        .enq-placar li { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px; background: #F8FAFC; margin-bottom: 6px; }
        .enq-placar li.lider { background: #ECFDF5; box-shadow: inset 0 0 0 1.5px #86EFAC; }
        .enq-placar .pos { width: 28px; height: 28px; border-radius: 50%; background: #E2E8F0; color: #334155; font-weight: 900; font-size: 13px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .enq-placar li.lider .pos { background: #16A34A; color: #fff; }
        .enq-placar .t { flex: 1; min-width: 0; font-size: 13px; font-weight: 700; color: #1F2937; overflow-wrap: anywhere; }
        .enq-placar .v { font-size: 20px; font-weight: 900; color: #0B1B4A; font-variant-numeric: tabular-nums; line-height: 1; text-align: right; }
        .enq-placar .v small { display: block; font-size: 11px; font-weight: 700; color: #64748B; margin-top: 2px; }
        .enq-sem-votos { font-size: 12.5px; color: #64748B; text-align: center; padding: 18px 0; }
        html.a11y-contraste .enq-tipos { background: #fff; border: 2px solid #111827; }
        html.a11y-contraste .enq-tipos button { color: #000; }
        html.a11y-contraste .enq-tipos button[aria-checked="true"] { background: #111827; color: #fff; box-shadow: none; }
        html.a11y-contraste .enq-svg text, html.a11y-contraste .enq-legenda li { fill: #000; color: #000; }
        @media (prefers-reduced-motion: reduce) { .enq-fade, .enq-cresce { animation: none; } }
        @media (max-width: 640px) { .enq-tipos button { padding: 8px 9px; } .enq-tipos .enq-tipo-nome { display: none !important; } .enq-pizza > svg { width: 150px; height: 150px; margin: 0 auto; } }

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

    // ------------------------------------------------------------------
    // Tipos de gráfico. A escolha fica guardada neste aparelho: por pergunta e como padrão.
    // ------------------------------------------------------------------
    const PALETA = ['#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#7C3AED', '#0891B2', '#DB2777', '#65A30D', '#EA580C', '#475569'];
    const svgIco = (d) => `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
    const TIPOS = [
        { id: 'barras', nome: 'Barras', ico: svgIco('<path d="M4 6h10M4 12h16M4 18h7"/>') },
        { id: 'colunas', nome: 'Colunas', ico: svgIco('<path d="M6 20V11M12 20V4M18 20v-6"/>') },
        { id: 'pizza', nome: 'Pizza', ico: svgIco('<path d="M12 3v9h9"/><path d="M12 3a9 9 0 1 0 9 9"/>') },
        { id: 'rosca', nome: 'Rosca', ico: svgIco('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>') },
        { id: 'placar', nome: 'Placar', ico: svgIco('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/>') },
    ];
    const DADOS = {};   // id da pergunta -> apuração mais recente (para trocar o gráfico sem pedir de novo)

    function lerEscolhas() {
        try { return JSON.parse(localStorage.getItem('pibiex_enq_grafico') || '{}') || {}; } catch (e) { return {}; }
    }
    function gravarEscolha(id, tipo) {
        const e = lerEscolhas();
        e[id] = tipo; e._padrao = tipo;
        try { localStorage.setItem('pibiex_enq_grafico', JSON.stringify(e)); } catch (x) { /* sem armazenamento: vale só agora */ }
    }
    function tipoDe(p) {
        const e = lerEscolhas();
        const t = e[p.id] || e._padrao;
        if (TIPOS.some((x) => x.id === t)) return t;
        return p.escala ? 'colunas' : 'barras';
    }

    // Itens que qualquer gráfico entende: { texto, curto, votos, percentual, lider, cor }
    function itensDe(p) {
        if (p.opcoes) {
            return p.opcoes.map((o, i) => ({ texto: o.texto, curto: o.texto, votos: o.votos, percentual: o.percentual || 0, lider: !!o.lider, cor: PALETA[i % PALETA.length] }));
        }
        if (p.escala) {
            const total = p.escala.distribuicao.reduce((n, d) => n + d.votos, 0);
            const maior = Math.max(0, ...p.escala.distribuicao.map((d) => d.votos));
            return p.escala.distribuicao.map((d, i) => ({
                texto: 'Nota ' + d.nota, curto: String(d.nota), votos: d.votos,
                percentual: total ? (d.votos * 100) / total : 0, lider: maior > 0 && d.votos === maior,
                // da nota mais baixa (vermelho) à mais alta (verde)
                cor: `hsl(${Math.round((i / Math.max(1, p.escala.distribuicao.length - 1)) * 125)} 68% 42%)`,
            }));
        }
        return [];
    }

    const curtinho = (t, n) => { t = String(t); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

    function graficoBarras(itens, ehEscala) {
        const lista = ehEscala ? itens : [...itens].sort((a, b) => b.votos - a.votos);
        return lista.map((o) => `
            <div class="enq-linha ${o.lider ? 'lider' : ''}">
                <div class="enq-linha-topo">
                    <span class="nome">${o.lider ? `<span class="enq-coroa" title="Na frente">${ICO.coroa}</span>` : ''}<span>${esc(o.texto)}</span></span>
                    <span class="num">${o.votos}<small>${fmtPct(o.percentual)}</small></span>
                </div>
                <div class="enq-barra"><div data-largura="${Math.min(100, o.percentual)}"></div></div>
            </div>`).join('');
    }

    function graficoColunas(itens) {
        const n = itens.length;
        const W = 400, H = 210, topo = 24, base = n > 5 ? 74 : 46, lado = 8;
        const util = W - lado * 2, passo = util / n, larg = Math.min(58, passo * 0.64);
        const maximo = Math.max(1, ...itens.map((o) => o.votos));
        const alturaMax = H - topo - base;
        const colunas = itens.map((o, i) => {
            const h = Math.max(o.votos ? 3 : 0, Math.round((o.votos / maximo) * alturaMax));
            const x = lado + passo * i + (passo - larg) / 2;
            const y = H - base - h;
            const cx = x + larg / 2;
            const rotulo = n > 5
                ? `<text x="${cx}" y="${H - base + 14}" font-size="11" text-anchor="end" transform="rotate(-35 ${cx} ${H - base + 14})">${esc(curtinho(o.curto, 16))}</text>`
                : `<text x="${cx}" y="${H - base + 16}" font-size="11.5" text-anchor="middle">${esc(curtinho(o.curto, n > 3 ? 11 : 18))}</text>`;
            return `<g><title>${esc(o.texto)}: ${o.votos} (${fmtPct(o.percentual)})</title>
                <rect class="enq-cresce" x="${x}" y="${y}" width="${larg}" height="${h}" rx="6" fill="${o.cor}" ${o.lider ? 'stroke="#14532D" stroke-width="2"' : ''}></rect>
                <text class="valor" x="${cx}" y="${y - 6}" font-size="13" text-anchor="middle">${o.votos}</text>${rotulo}</g>`;
        }).join('');
        return `<svg class="enq-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfico de colunas: ${esc(itens.map((o) => o.texto + ' ' + o.votos).join('; '))}">
            <line x1="${lado}" y1="${H - base}" x2="${W - lado}" y2="${H - base}" stroke="#CBD5E1" stroke-width="1.5"></line>${colunas}</svg>`;
    }

    function arco(cx, cy, r, r2, a0, a1) {
        const pt = (rad, ang) => [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)];
        const grande = a1 - a0 > Math.PI ? 1 : 0;
        const [x0, y0] = pt(r, a0), [x1, y1] = pt(r, a1);
        if (!r2) return `M${cx} ${cy} L${x0} ${y0} A${r} ${r} 0 ${grande} 1 ${x1} ${y1} Z`;
        const [x2, y2] = pt(r2, a1), [x3, y3] = pt(r2, a0);
        return `M${x0} ${y0} A${r} ${r} 0 ${grande} 1 ${x1} ${y1} L${x2} ${y2} A${r2} ${r2} 0 ${grande} 0 ${x3} ${y3} Z`;
    }

    function graficoPizza(itens, rosca) {
        const total = itens.reduce((n, o) => n + o.votos, 0);
        const legenda = `<ul class="enq-legenda">${itens.map((o) => `
            <li><i style="background:${o.cor}"></i><span class="t">${o.lider ? `<span class="enq-coroa" style="vertical-align:-2px;margin-right:3px">${ICO.coroa}</span>` : ''}${esc(o.texto)}</span><span class="n">${o.votos}<small>${fmtPct(o.percentual)}</small></span></li>`).join('')}</ul>`;
        if (!total) return `<div class="enq-sem-votos">Ainda sem votos para desenhar o gráfico.</div>${legenda}`;

        const cx = 100, cy = 100, r = 92, r2 = rosca ? 56 : 0;
        const comVotos = itens.filter((o) => o.votos > 0);
        let fatias;
        if (comVotos.length === 1) {
            const o = comVotos[0];
            fatias = rosca
                ? `<circle cx="${cx}" cy="${cy}" r="${(r + r2) / 2}" fill="none" stroke="${o.cor}" stroke-width="${r - r2}"></circle>`
                : `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${o.cor}"></circle>`;
        } else {
            let ang = -Math.PI / 2;
            fatias = comVotos.map((o) => {
                const fim = ang + (o.votos / total) * Math.PI * 2;
                const d = arco(cx, cy, r, r2, ang, fim);
                ang = fim;
                return `<path d="${d}" fill="${o.cor}" stroke="#fff" stroke-width="2"><title>${esc(o.texto)}: ${o.votos} (${fmtPct(o.percentual)})</title></path>`;
            }).join('');
        }
        const centro = rosca ? `<text class="centro-num" x="${cx}" y="${cy + 6}" text-anchor="middle">${total}</text><text class="centro-txt" x="${cx}" y="${cy + 24}" text-anchor="middle">${total === 1 ? 'voto' : 'votos'}</text>` : '';
        return `<div class="enq-pizza"><svg class="enq-fade" viewBox="0 0 200 200" role="img" aria-label="Gráfico de ${rosca ? 'rosca' : 'pizza'}: ${esc(itens.map((o) => o.texto + ' ' + o.votos).join('; '))}">${fatias}${centro}</svg>${legenda}</div>`;
    }

    function graficoPlacar(itens, ehEscala) {
        const lista = ehEscala ? itens : [...itens].sort((a, b) => b.votos - a.votos);
        return `<ol class="enq-placar">${lista.map((o, i) => `
            <li class="${o.lider ? 'lider' : ''}"><span class="pos">${ehEscala ? esc(o.curto) : i + 1}</span><span class="t">${esc(ehEscala ? o.texto : o.texto)}</span><span class="v">${o.votos}<small>${fmtPct(o.percentual)}</small></span></li>`).join('')}</ol>`;
    }

    function desenharGrafico(p, tipo) {
        const itens = itensDe(p);
        const ehEscala = !!p.escala;
        switch (tipo) {
            case 'colunas': return graficoColunas(itens);
            case 'pizza': return graficoPizza(itens, false);
            case 'rosca': return graficoPizza(itens, true);
            case 'placar': return graficoPlacar(itens, ehEscala);
            default: return graficoBarras(itens, ehEscala);
        }
    }

    function seletorTipos(atual) {
        return `<div class="enq-tipos" role="radiogroup" aria-label="Tipo de gráfico">${TIPOS.map((t) => `
            <button type="button" role="radio" data-tipo="${t.id}" aria-checked="${t.id === atual}" title="${t.nome}" aria-label="${t.nome}">${t.ico}<span class="enq-tipo-nome">${t.nome}</span></button>`).join('')}</div>`;
    }

    function renderPergunta(p) {
        DADOS[p.id] = p;
        let corpo = '';
        if (p.opcoes || p.escala) {
            const tipo = tipoDe(p);
            corpo = `${seletorTipos(tipo)}<div class="enq-grafico">${desenharGrafico(p, tipo)}</div>`;
            if (p.escala) {
                corpo += `<p class="enq-meta" style="margin-top:8px">Média: <b>${p.escala.media == null ? '–' : String(p.escala.media).replace('.', ',')}</b> de ${p.escala.max}</p>`;
            }
        } else if (p.textos) {
            corpo = p.textos.length
                ? `<ul class="enq-textos">${p.textos.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`
                : '<p class="enq-meta">Ninguém respondeu ainda.</p>';
        } else {
            corpo = `<p class="enq-meta">${p.totalRespostas} ${p.totalRespostas === 1 ? 'resposta' : 'respostas'} (respostas escritas ficam só com o professor).</p>`;
        }
        return `
            <div class="enq-pergunta" data-pergunta="${esc(p.id)}">
                <h4>${p.ordem}. ${esc(p.texto)}</h4>
                ${corpo}
                <p class="enq-meta" style="margin:6px 0 0">${p.totalRespostas} ${p.totalRespostas === 1 ? 'resposta' : 'respostas'}</p>
            </div>`;
    }

    // enquete = { titulo, status, votos, totalAlunos, perguntas: [apuração] }
    function renderApuracao(enquete, opcoes) {
        injetarEstilo();
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
        // A troca de tipo de gráfico é ligada uma vez por contêiner (vale também depois de cada atualização).
        if (!raiz.__enqTipos) {
            raiz.__enqTipos = true;
            raiz.addEventListener('click', (ev) => {
                const botao = ev.target.closest && ev.target.closest('.enq-tipos button');
                if (!botao || !raiz.contains(botao)) return;
                const perg = botao.closest('.enq-pergunta');
                const p = perg && DADOS[perg.dataset.pergunta];
                if (!p) return;
                gravarEscolha(p.id, botao.dataset.tipo);
                perg.querySelectorAll('.enq-tipos button').forEach((b) => b.setAttribute('aria-checked', String(b === botao)));
                perg.querySelector('.enq-grafico').innerHTML = desenharGrafico(p, botao.dataset.tipo);
                crescer(perg);
            });
        }
        crescer(raiz);
    }

    // As barras começam em 0 e crescem (a transição CSS faz a animação).
    function crescer(raiz) {
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
                ? `<span class="enq-ponto encerrada"></span><span class="enq-rotulo-longo">Votação encerrada${extra}</span><span class="enq-rotulo-curto">Encerrada${extra}</span>`
                : `<span class="enq-ponto"></span><span class="enq-rotulo-longo">Votação ao vivo${extra}</span><span class="enq-rotulo-curto">Ao vivo${extra}</span><small>${e.votos}/${e.totalAlunos}</small>`;
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
                    if (!(await PibiexA11y.confirmar('Encerrar esta votação agora? Ninguém mais poderá votar.'))) return;
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
            if (!dados.some((e) => e.status === 'aberta')) { el.textContent = 'Resultado final'; return; }
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
            agendar();
        }

        // Ritmo adaptativo (cada consulta é uma ida ao servidor): rápido só quando alguém está
        // olhando a apuração; devagar quando há votação aberta; quase parado quando não há nada.
        function intervalo() {
            // Sem votação aberta o resultado é final: não há o que atualizar.
            if (!dados.some((e) => e.status === 'aberta')) return null;
            return aberto ? 10000 : 20000;
        }
        function agendar() {
            clearTimeout(temporizador);
            if (document.hidden) return; // aba em segundo plano: não consulta
            const espera = intervalo();
            if (espera === null) return;
            temporizador = setTimeout(atualizar, espera);
        }
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) { clearTimeout(temporizador); return; }
            atualizar().then(agendar); // voltou para a aba: atualiza na hora
        });

        let fundo = null;
        const ehCelular = () => window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
        function alternar(forcar) {
            aberto = typeof forcar === 'boolean' ? forcar : !aberto;
            painel.hidden = !aberto;
            botao.setAttribute('aria-expanded', String(aberto));
            if (aberto && ehCelular() && !fundo) {
                fundo = document.createElement('div');
                fundo.className = 'enq-fundo';
                fundo.onclick = () => alternar(false);
                document.body.appendChild(fundo);
                document.body.style.overflow = 'hidden';
            }
            if (!aberto && fundo) { fundo.remove(); fundo = null; document.body.style.overflow = ''; }
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
