// /simulacao.js
//
// "Ver como aluno": o professor entra na tela de um aluno, com os dados de verdade, e pode
// clicar e testar à vontade, mas NADA é gravado.
//
// Carregado nas páginas do aluno logo depois da biblioteca do Supabase. Só faz alguma coisa
// quando esta aba tem uma simulação ativa (sessionStorage "pibiex_simulacao", criada pelo
// painel do professor). Para um aluno comum, não faz nada.
//
// Como funciona, em três camadas:
//   1. SERVIDOR (a garantia): a sessão de simulação é marcada no banco e as funções só a aceitam
//      em ações de leitura. Qualquer ação que grave é recusada lá, mesmo que a tela tente.
//   2. ESTA TELA: as chamadas que não são leitura nem chegam ao servidor; recebem uma resposta
//      de mentira, para o professor ver o caminho de sucesso (ex.: "Resposta enviada").
//   3. AVISOS: faixa fixa "MODO SIMULAÇÃO" e um aviso a cada coisa que não foi salva.
//
// A simulação usa o sessionStorage da aba: não mexe no login do professor nem em qualquer
// sessão de aluno aberta neste navegador.

(function () {
    const CHAVE = 'pibiex_simulacao';
    const CHAVE_SOMBRA = 'pibiex_simulacao_sombra';

    let sim = null;
    try { sim = JSON.parse(sessionStorage.getItem(CHAVE) || 'null'); } catch (e) { sim = null; }
    if (!sim || !sim.token || !sim.dados) return;
    if (!sim.expiraEm || Date.now() > sim.expiraEm) {
        try { sessionStorage.removeItem(CHAVE); sessionStorage.removeItem(CHAVE_SOMBRA); } catch (e) { /* ok */ }
        return;
    }

    window.PIBIEX_SIMULACAO = true;

    // ------------------------------------------------------------------
    // 1) O login do aluno desta aba passa a ser o da simulação
    // ------------------------------------------------------------------
    const lerOriginal = Storage.prototype.getItem;
    const gravarOriginal = Storage.prototype.setItem;
    const removerOriginal = Storage.prototype.removeItem;
    const FALSAS = {
        pibiex_aluno_token: () => sim.token,
        pibiex_aluno_dados: () => JSON.stringify(sim.dados),
    };
    Storage.prototype.getItem = function (k) {
        if (this === window.localStorage && FALSAS[k]) return FALSAS[k]();
        return lerOriginal.call(this, k);
    };
    Storage.prototype.setItem = function (k, v) {
        if (this === window.localStorage && FALSAS[k]) return;
        return gravarOriginal.call(this, k, v);
    };
    Storage.prototype.removeItem = function (k) {
        if (this === window.localStorage && FALSAS[k]) return;
        return removerOriginal.call(this, k);
    };

    // ------------------------------------------------------------------
    // 2) O que é só leitura segue para o servidor; o resto é simulado aqui
    // ------------------------------------------------------------------
    // (O servidor tem a mesma lista e recusa tudo que não estiver nela.)
    const LEITURAS = {
        'validar-sessao-aluno': true, 'ranking-acesso': true, 'ver-material': true,
        'perfil-aluno': ['ver'],
        'frequencia': ['disponivel', 'historico'],
        'gerenciar-notas': ['listar'],
        'enquetes-aluno': ['pendentes', 'listar', 'detalhe', 'acompanhar'],
        'galeria': ['listar'],
        'enviar-trabalho': ['listar'],
        'enviar-desafio': ['painel', 'listar'],
        'enviar-laboratorio': ['listar'],
        'avisos-aluno': ['listar', 'anteriores'],
        'chat-turma': ['listar', 'membros'],
        'chat-privado': ['contatos', 'conversas', 'mensagens'],
    };
    function ehLeitura(nome, corpo) {
        const regra = LEITURAS[nome];
        if (regra === true) return true;
        return Array.isArray(regra) && regra.includes(corpo && corpo.acao);
    }

    // O que o "aluno" fez durante a simulação, só para a tela mostrar o resultado.
    let sombra = { trabalhos: {}, votos: {} };
    try { sombra = { ...sombra, ...(JSON.parse(sessionStorage.getItem(CHAVE_SOMBRA) || '{}')) }; } catch (e) { /* começa limpo */ }
    const guardarSombra = () => { try { sessionStorage.setItem(CHAVE_SOMBRA, JSON.stringify(sombra)); } catch (e) { /* ok */ } };

    let ultimoAviso = 0;
    function avisar(texto) {
        const agora = Date.now();
        if (agora - ultimoAviso < 2500) return;
        ultimoAviso = agora;
        const msg = texto || 'Modo simulação: nada disso foi salvo de verdade.';
        if (window.PibiexA11y && window.PibiexA11y.aviso) window.PibiexA11y.aviso(msg);
    }

    function simulada(nome, corpo) {
        const acao = corpo && corpo.acao;
        if (nome === 'logout-aluno') { setTimeout(() => window.PibiexSimulacao.sair(), 0); return { ok: true }; }
        if (nome === 'assistente-ia') return { erro: 'Modo simulação: o assistente de IA não responde e nada é gravado.' };
        if (nome === 'enviar-trabalho' && acao === 'enviar') {
            const t = {
                id: 'simulacao-' + Date.now(), atividade_id: corpo.atividadeId, status: 'enviado', nota: null,
                resposta_texto: corpo.respostaTexto || null, arquivo_url: corpo.arquivoUrl || null,
                comentario_aluno: corpo.comentario || null, enviado_em: new Date().toISOString(),
            };
            sombra.trabalhos[corpo.atividadeId] = t; guardarSombra();
            avisar('Modo simulação: a resposta apareceu para você, mas não foi enviada ao professor.');
            return { trabalho: t };
        }
        if (acao === 'gerar_url_upload' || acao === 'preparar_anexo' || acao === 'gerar_url_upload_foto') {
            avisar('Modo simulação: arquivos não são enviados.');
            return { caminho: 'simulacao/' + Date.now(), token: 'simulacao', ok: true };
        }
        if (nome === 'enquetes-aluno' && acao === 'votar') {
            sombra.votos[corpo.enqueteId] = true; guardarSombra();
            avisar('Modo simulação: o voto apareceu para você, mas não foi contado.');
            return { ok: true };
        }
        avisar();
        return { ok: true, simulado: true };
    }

    // Respostas de leitura recebem o que o "aluno" fez durante a simulação.
    function completar(nome, corpo, data) {
        if (!data || typeof data !== 'object') return data;
        const acao = corpo && corpo.acao;
        if (nome === 'validar-sessao-aluno' && data.aluno) data.aluno.precisaAceitarTermos = false;
        if (nome === 'enviar-trabalho' && acao === 'listar') {
            const lista = (data.trabalhos || []).filter((t) => !sombra.trabalhos[t.atividade_id]);
            data.trabalhos = lista.concat(Object.values(sombra.trabalhos));
        }
        if (nome === 'enquetes-aluno') {
            if (acao === 'pendentes' && Array.isArray(data.pendentes)) data.pendentes = data.pendentes.filter((e) => !sombra.votos[e.id]);
            if (acao === 'listar' && Array.isArray(data.enquetes)) data.enquetes.forEach((e) => { if (sombra.votos[e.id]) e.jaVotou = true; });
            if (acao === 'detalhe' && data.enquete && sombra.votos[data.enquete.id]) data.enquete.jaVotou = true;
        }
        return data;
    }

    function fingir() {
        // Resultado de mentira que serve como "await", como cadeia (.select().eq()...) e como promessa.
        const alvo = { data: null, error: null, status: 200, statusText: 'OK', count: null };
        const p = new Proxy(function () {}, {
            get(_, prop) {
                if (prop === 'then') return (ok) => Promise.resolve(alvo).then(ok);
                if (prop === 'catch' || prop === 'finally') return (f) => Promise.resolve(alvo)[prop](f);
                return () => p;
            },
            apply() { return p; },
        });
        return p;
    }

    function envolver(cliente) {
        // Na biblioteca do Supabase, "functions" e "storage" são recriados a cada acesso; por isso o
        // desvio é feito com uma propriedade fixa no próprio cliente, e não mexendo no que ela devolve.
        const funcoesReais = cliente.functions;
        const invocarReal = funcoesReais.invoke.bind(funcoesReais);
        window.PibiexSimulacao._invocarReal = invocarReal;

        const funcoes = {
            setAuth: (t) => funcoesReais.setAuth(t),
            invoke: async (nome, opcoes) => {
                const corpo = (opcoes && opcoes.body) || {};
                if (ehLeitura(nome, corpo)) {
                    const r = await invocarReal(nome, opcoes);
                    if (r && r.data) r.data = completar(nome, corpo, r.data);
                    return r;
                }
                return { data: simulada(nome, corpo), error: null };
            },
        };
        Object.defineProperty(cliente, 'functions', { get: () => funcoes, configurable: true });

        const from = cliente.from.bind(cliente);
        cliente.from = (tabela) => {
            const b = from(tabela);
            ['insert', 'update', 'upsert', 'delete'].forEach((m) => { b[m] = () => { avisar(); return fingir(); }; });
            return b;
        };
        cliente.rpc = () => { avisar(); return fingir(); };

        const armazemReal = cliente.storage;
        const armazem = armazemReal.from.bind(armazemReal);
        armazemReal.from = (balde) => {
            const s = armazem(balde);
            ['upload', 'uploadToSignedUrl', 'update', 'remove', 'move', 'copy', 'createSignedUploadUrl'].forEach((m) => {
                s[m] = async () => { avisar('Modo simulação: arquivos não são enviados.'); return { data: { path: 'simulacao' }, error: null }; };
            });
            return s;
        };
        Object.defineProperty(cliente, 'storage', { get: () => armazemReal, configurable: true });
        return cliente;
    }

    window.PibiexSimulacao = {
        ativa: true,
        aluno: sim.dados.nomeCompleto,
        async sair(trocar) {
            try {
                const tokenEquipe = lerOriginal.call(window.localStorage, 'pibiex_equipe_token');
                if (this._invocarReal && tokenEquipe) await this._invocarReal('simular-aluno', { body: { tokenEquipe, acao: 'encerrar', token: sim.token } });
            } catch (e) { /* a sessão expira sozinha em 2 horas */ }
            try { sessionStorage.removeItem(CHAVE); sessionStorage.removeItem(CHAVE_SOMBRA); } catch (e) { /* ok */ }
            location.href = '/admin/inicio.html' + (trocar ? '?simular=1' : '');
        },
    };

    if (window.supabase && typeof window.supabase.createClient === 'function') {
        const criar = window.supabase.createClient;
        window.supabase.createClient = function () { return envolver(criar.apply(this, arguments)); };
    }

    // ------------------------------------------------------------------
    // 3) Faixa de aviso (sempre visível) e fim automático da simulação
    // ------------------------------------------------------------------
    function faixa() {
        const st = document.createElement('style');
        st.textContent = `
            html::before { content: ""; position: fixed; top: 0; left: 0; right: 0; height: 4px; background: #F59E0B; z-index: 2147483000; pointer-events: none; }
            body { padding-bottom: 72px !important; }
            #sim-faixa { position: fixed; left: 50%; bottom: 14px; transform: translateX(-50%); z-index: 2147483001; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center;
                         max-width: calc(100vw - 24px); padding: 10px 14px; border-radius: 16px; background: #111827; color: #fff; border: 2px solid #F59E0B;
                         box-shadow: 0 14px 40px rgba(0,0,0,.35); font: 600 13px/1.3 'Inter', system-ui, sans-serif; }
            #sim-faixa .tag { background: #F59E0B; color: #111827; font-weight: 800; font-size: 10.5px; letter-spacing: .1em; padding: 4px 8px; border-radius: 999px; }
            #sim-faixa .nome { font-weight: 800; }
            #sim-faixa button { border: 0; border-radius: 10px; padding: 8px 12px; font: 700 12.5px 'Inter', system-ui, sans-serif; cursor: pointer; }
            #sim-faixa .trocar { background: #374151; color: #fff; }
            #sim-faixa .sair { background: #F59E0B; color: #111827; }
            #sim-faixa button:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
            @media (max-width: 640px) { #sim-faixa { left: 8px; right: 8px; transform: none; max-width: none; bottom: 8px; } #sim-faixa .texto { flex-basis: 100%; text-align: center; } }
        `;
        document.head.appendChild(st);

        const el = document.createElement('div');
        el.id = 'sim-faixa';
        el.setAttribute('role', 'region');
        el.setAttribute('aria-label', 'Modo simulação');
        const nome = document.createElement('span');
        nome.className = 'nome';
        nome.textContent = sim.dados.nomeCompleto || 'aluno';
        el.innerHTML = '<span class="tag">SIMULAÇÃO</span><span class="texto">Você está vendo como <span class="nome"></span>. Nada do que fizer aqui é salvo.</span>' +
            '<button type="button" class="trocar">Trocar aluno</button><button type="button" class="sair">Sair da simulação</button>';
        el.querySelector('.nome').replaceWith(nome);
        el.querySelector('.trocar').onclick = () => window.PibiexSimulacao.sair(true);
        el.querySelector('.sair').onclick = () => window.PibiexSimulacao.sair(false);
        document.body.appendChild(el);
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', faixa); else faixa();

    setTimeout(() => {
        if (window.PibiexA11y && window.PibiexA11y.aviso) window.PibiexA11y.aviso('A simulação terminou (2 horas). Voltando ao painel.');
        setTimeout(() => window.PibiexSimulacao.sair(false), 1500);
    }, Math.max(1000, sim.expiraEm - Date.now()));
})();
