// /aluno/shell.js
//
// Script compartilhado por TODAS as páginas da área do aluno.
// Cada página só precisa:
//   1) Ter <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//      e <script src="shell.js"></script>
//   2) Ter estes 3 elementos vazios no HTML: <div id="sidebar-container"></div>,
//      <div id="topo-pagina"></div>, <div id="assistente-flutuante"></div>
//   3) Chamar `iniciarShellAluno('id-da-pagina')` dentro de um <script> próprio.
//
// Identidade visual: gradiente azul-marinho (#0B1B4A → #1E3A8A → #3B82F6) com
// acento lima (#A3E635) sobre cinza claro (#F9FAFB). Ícones são SVG de linha
// (sem emoji), tipografia usa Inter em peso pesado para títulos e para o resto.

const SUPABASE_URL = 'https://gclcsgqvunutbvpazgsg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjbGNzZ3F2dW51dGJ2cGF6Z3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1Njc5MTQsImV4cCI6MjEwMDE0MzkxNH0.T87bJPVYiYO9vyJtaB6_n9CREO6f-mNGumGK0phtaYk';

// O token de sessão vai como header customizado em toda consulta feita por
// este cliente — é isso que as policies de leitura das tabelas de conteúdo
// exigem agora (antes eram públicas, qualquer um na internet lia direto pela
// API). Setado aqui uma vez vale pra toda página que carrega este shell.
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { 'x-sessao-token': localStorage.getItem('pibiex_aluno_token') || '' } },
});

// ============================================================
// 0) Identidade visual: fonte + tokens de cor injetados uma vez
// ============================================================
(function injetarIdentidadeVisual() {
    const estilo = document.createElement('style');
    estilo.textContent = `
        :root {
            --pibiex-tinta: #1E3A8A;
            --pibiex-tinta-suave: #1E40AF;
            --pibiex-gradiente: linear-gradient(135deg, #0B1B4A 0%, #1E3A8A 50%, #1E40AF 100%);
            --pibiex-dourado: #A3E635;
            --pibiex-dourado-profundo: #4D7C0F;
            --pibiex-papel: #F9FAFB;
            --pibiex-texto: #111827;
            --pibiex-texto-suave: #6B7280;
            --pibiex-borda: #E5E7EB;
        }
        .fonte-display { font-family: 'Inter', sans-serif; font-weight: 800; }
        body { background: var(--pibiex-papel); }
        .pibiex-textura-grade {
            position: absolute; inset: 0; pointer-events: none;
            background-image:
                linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);
            background-size: 34px 34px;
            mask-image: radial-gradient(ellipse 85% 75% at 50% 40%, #000 30%, transparent 100%);
        }
        .pibiex-pulso { width: 7px; height: 7px; border-radius: 50%; background: var(--pibiex-dourado); box-shadow: 0 0 0 0 rgba(163,230,53,.7); animation: pibiexPulso 2s infinite; flex-shrink: 0; }
        @keyframes pibiexPulso { 0% { box-shadow: 0 0 0 0 rgba(163,230,53,.6); } 70% { box-shadow: 0 0 0 8px rgba(163,230,53,0); } 100% { box-shadow: 0 0 0 0 rgba(163,230,53,0); } }
    `;
    document.head.appendChild(estilo);
})();

// Ícones de linha (SVG inline, sem dependência externa)
const ICONES = {
    inicio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5 12 4l8 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-6h4v6"/></svg>',
    cronograma: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16"/><path d="M8 3v4M16 3v4"/></svg>',
    conteudo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2 2 0 0 1 6 4h12v16H6a2 2 0 0 1-2-2z"/><path d="M8 8h6M8 12h6"/></svg>',
    atividades: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M9.5 13.5h5M9.5 17h5"/></svg>',
    trabalhos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V4M8 8l4-4 4 4"/><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H8l-4 4z"/></svg>',
    'ferramentas-ia': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 6.5a3.5 3.5 0 0 0-4.7 4.2L4 16.5V20h3.5l5.8-5.8a3.5 3.5 0 0 0 4.2-4.7l-2.6 2.6-2-2z"/></svg>',
    prompts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.9.9.9 1.6v.5h5.2v-.5c0-.7.4-1.2.9-1.6A6 6 0 0 0 12 3z"/></svg>',
    desafios: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v4a4 4 0 0 1-8 0z"/><path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3"/><path d="M12 12v4M9 20h6M10 16h4v4h-4z"/></svg>',
    galeria: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="14" rx="1.5"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M20 15.5 15 10 5 18.5"/></svg>',
    'laboratorio-ia': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6.5L5.5 18a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.5V3"/><path d="M8.5 14h7"/></svg>',
    faq: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.3a2.5 2.5 0 1 1 3.7 2.2c-.7.4-1.2.9-1.2 1.7v.3"/><path d="M12 16.7h.01"/></svg>',
    recursos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 14.5 14.5 9.5"/><path d="M11 7l1.5-1.5a3.5 3.5 0 0 1 5 5L16 12M13 17l-1.5 1.5a3.5 3.5 0 0 1-5-5L8 12"/></svg>',
    avisos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10v4h3l5 4V6L7 10z"/><path d="M15 9a3.5 3.5 0 0 1 0 6M18 6.5a7 7 0 0 1 0 11"/></svg>',
    assistente: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v10H9l-3.5 3.5V15H4z"/><path d="M12 8v4M10 10h4"/></svg>',
};

// Menu lateral agrupado por finalidade real (não é decoração — cada grupo é
// uma categoria distinta do curso).
const GRUPOS_MENU = [
    {
        rotulo: 'Painel',
        itens: [
            { id: 'inicio',     label: 'Início',         href: 'inicio.html' },
            { id: 'cronograma', label: 'Cronograma',     href: 'cronograma.html' },
            { id: 'conteudo',   label: 'Conteúdo',       href: 'conteudo.html' },
            { id: 'atividades', label: 'Atividades',     href: 'atividades.html' },
            { id: 'trabalhos',  label: 'Meus Trabalhos', href: 'trabalhos.html' },
            { id: 'chat',       label: 'Chat da Turma',  href: 'chat.html' },
        ],
    },
    {
        rotulo: 'Recursos de IA',
        itens: [
            { id: 'ferramentas-ia', label: 'Ferramentas de IA', href: 'ferramentas-ia.html' },
            { id: 'prompts',        label: 'Banco de Prompts',  href: 'prompts.html' },
            { id: 'desafios',       label: 'Desafios Semanais', href: 'desafios.html' },
            { id: 'galeria',        label: 'Galeria',           href: 'galeria.html' },
            { id: 'laboratorio-ia', label: 'Laboratório de IA', href: 'laboratorio-ia.html' },
        ],
    },
    {
        rotulo: 'Ajuda',
        itens: [
            { id: 'faq',      label: 'FAQ',             href: 'faq.html' },
            { id: 'recursos', label: 'Recursos Extras', href: 'recursos.html' },
        ],
    },
];

// ============================================================
// 1) Proteção de sessão + troca de senha obrigatória
// ============================================================
function protegerPaginaAluno() {
    const token = localStorage.getItem('pibiex_aluno_token');
    const dadosBrutos = localStorage.getItem('pibiex_aluno_dados');

    if (!token || !dadosBrutos) {
        window.location.href = '../index.html';
        return null;
    }

    const dados = JSON.parse(dadosBrutos);

    if (dados.precisaTrocarSenha) {
        window.location.href = '../trocar-senha.html';
        return null;
    }

    // Checagem rápida (a partir do que foi salvo no login). A checagem que
    // realmente vale — porque consulta o banco de novo — acontece logo a
    // seguir, em sessaoAindaValida, toda vez que uma página carrega.
    if (dados.precisaAceitarTermos) {
        window.location.href = '../termos.html';
        return null;
    }

    return { token, dados };
}

// ============================================================
// 2) Menu lateral
// ============================================================
function iconeSvg(id) {
    return `<span class="w-5 h-5 shrink-0">${ICONES[id] || ''}</span>`;
}

function montarMenuLateral(paginaAtivaId) {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    const gruposHtml = GRUPOS_MENU.map((grupo) => {
        const itensHtml = grupo.itens.map((item) => {
            const ativo = item.id === paginaAtivaId;
            const classesBase = 'flex items-center gap-3 pl-4 pr-3 py-2 rounded-md text-[13.5px] font-medium transition border-l-2';
            const classesAtivo = ativo
                ? 'border-[var(--pibiex-dourado)] bg-white/[0.06] text-white'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.04]';
            return `
                <a href="${item.href}" class="${classesBase} ${classesAtivo}">
                    ${iconeSvg(item.id)}
                    <span>${item.label}</span>
                </a>
            `;
        }).join('');

        return `
            <div class="mb-5">
                <p class="px-4 mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-slate-500">${grupo.rotulo}</p>
                <div class="space-y-0.5">${itensHtml}</div>
            </div>
        `;
    }).join('');

    // No celular a barra vira uma gaveta fora da tela até o ☰ do topo abrir.
    // Do md pra cima ela volta ao lugar de sempre ('md:translate-x-0').
    container.outerHTML = `
        <div id="sidebar-fundo" onclick="window.fecharMenuAluno()"
             class="hidden fixed inset-0 bg-black/60 z-30 md:hidden"></div>
        <aside id="sidebar-container" class="fixed md:sticky top-0 left-0 h-screen w-[17rem] shrink-0 py-6 z-40 flex flex-col -translate-x-full md:translate-x-0 transition-transform duration-200 overflow-hidden"
               style="background: var(--pibiex-gradiente);">
            <div class="pibiex-textura-grade"></div>
            <div class="px-5 pb-6 mb-2 flex items-center justify-between gap-3 border-b border-white/10 relative">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-full shrink-0 flex items-center justify-center relative" style="border: 1.5px solid var(--pibiex-dourado);">
                        <div class="absolute inset-[3px] rounded-full" style="border: 1px solid rgba(163,230,53,.35);"></div>
                        <span class="fonte-display text-[var(--pibiex-dourado)] text-[10px] leading-none relative">P26</span>
                    </div>
                    <div class="min-w-0">
                        <p class="fonte-display text-white text-[15px] leading-tight truncate">PIBIEX</p>
                        <p class="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[var(--pibiex-dourado)]">Inteligência Artificial</p>
                    </div>
                </div>
                <button onclick="window.fecharMenuAluno()" class="md:hidden text-white/60 hover:text-white text-xl leading-none px-1 shrink-0" aria-label="Fechar menu">✕</button>
            </div>
            <nav class="px-3 overflow-y-auto flex-1 relative">${gruposHtml}</nav>
        </aside>
    `;
}

window.abrirMenuAluno = () => {
    document.getElementById('sidebar-container').classList.remove('-translate-x-full');
    document.getElementById('sidebar-fundo').classList.remove('hidden');
};
window.fecharMenuAluno = () => {
    document.getElementById('sidebar-container').classList.add('-translate-x-full');
    document.getElementById('sidebar-fundo').classList.add('hidden');
};

// ============================================================
// 3) Barra do topo
// ============================================================
function montarTopo(nomeCompleto) {
    const container = document.getElementById('topo-pagina');
    if (!container) return;

    const primeiroNome = (nomeCompleto || '').split(' ')[0];

    container.outerHTML = `
        <header id="topo-pagina" class="flex items-center justify-between gap-3 px-4 md:px-9 py-4 md:py-5 bg-white border-b" style="border-color: var(--pibiex-borda);">
            <div class="flex items-center gap-3 min-w-0">
                <button onclick="window.abrirMenuAluno()" class="md:hidden shrink-0 text-xl leading-none" style="color: var(--pibiex-texto-suave);" aria-label="Abrir menu">☰</button>
                <p class="text-[13.5px] min-w-0 truncate" style="color: var(--pibiex-texto-suave);">
                    Bem-vindo(a), <span class="font-semibold" style="color: var(--pibiex-texto);">${primeiroNome}</span>
                </p>
            </div>
            <button onclick="sairAluno()" class="text-[13px] font-semibold tracking-wide uppercase transition shrink-0"
                    style="color: var(--pibiex-texto-suave);"
                    onmouseover="this.style.color='var(--pibiex-tinta)'" onmouseout="this.style.color='var(--pibiex-texto-suave)'">
                Sair
            </button>
        </header>
    `;
}

async function sairAluno() {
    const token = localStorage.getItem('pibiex_aluno_token');
    if (token) {
        try { await window.supabaseClient.functions.invoke('logout-aluno', { body: { token } }); }
        catch (e) { /* mesmo se falhar, ainda limpamos a sessão local */ }
    }
    localStorage.removeItem('pibiex_aluno_token');
    localStorage.removeItem('pibiex_aluno_dados');
    window.location.href = '../index.html';
}

// ============================================================
// 4) Assistente de IA flutuante
// ============================================================
let conversaIaAtual = null;

function montarAssistenteFlutuante() {
    const container = document.getElementById('assistente-flutuante');
    if (!container) return;

    container.outerHTML = `
        <div id="assistente-flutuante">
            <button id="botao-assistente" onclick="alternarPainelAssistente()"
                    class="fixed bottom-6 right-6 z-40 text-white rounded-full w-14 h-14 shadow-lg flex items-center justify-center transition transform hover:scale-105"
                    style="background: var(--pibiex-tinta); border: 1.5px solid var(--pibiex-dourado);">
                <span class="w-6 h-6" style="color: var(--pibiex-dourado);">${ICONES.assistente}</span>
            </button>

            <div id="painel-assistente" class="hidden fixed bottom-24 right-6 z-40 w-96 max-w-[90vw] h-[32rem] max-h-[70vh] bg-white rounded-lg shadow-2xl border flex flex-col overflow-hidden"
                 style="border-color: var(--pibiex-borda);">
                <div class="text-white px-5 py-4 flex justify-between items-center" style="background: var(--pibiex-tinta);">
                    <div>
                        <p class="fonte-display font-semibold text-[15px]">Assistente PIBIEX</p>
                        <p class="text-[11.5px]" style="color: var(--pibiex-dourado);">Tire dúvidas sobre IA, 24h</p>
                    </div>
                    <div class="flex items-center gap-3 shrink-0">
                        <button onclick="novoChatAssistente()" title="Apaga esta conversa e começa outra"
                                class="text-[11.5px] font-semibold border rounded-full px-3 py-1 transition hover:bg-white/10"
                                style="color: var(--pibiex-dourado); border-color: var(--pibiex-dourado);">
                            Novo chat
                        </button>
                        <button onclick="alternarPainelAssistente()" class="text-white/70 hover:text-white font-bold">✕</button>
                    </div>
                </div>
                <div id="mensagens-assistente" class="flex-1 overflow-y-auto p-4 space-y-3 text-[13.5px]" style="background: var(--pibiex-papel);"></div>
                <form id="form-assistente" class="p-3 border-t flex gap-2" style="border-color: var(--pibiex-borda);">
                    <input id="input-assistente" type="text" placeholder="Digite sua dúvida..."
                           class="flex-1 border rounded-full px-4 py-2 text-[13.5px] outline-none focus:ring-1"
                           style="border-color: var(--pibiex-borda);">
                    <button type="submit" class="text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0"
                            style="background: var(--pibiex-tinta);">➤</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('form-assistente').addEventListener('submit', enviarMensagemAssistente);
}

window.alternarPainelAssistente = () => {
    document.getElementById('painel-assistente').classList.toggle('hidden');
};

function adicionarMensagemNaTela(autor, texto) {
    const box = document.getElementById('mensagens-assistente');
    const bolha = document.createElement('div');
    if (autor === 'aluno') {
        bolha.className = 'text-white rounded-lg rounded-br-sm px-4 py-2 ml-auto max-w-[85%] w-fit';
        bolha.style.background = 'var(--pibiex-tinta)';
    } else {
        bolha.className = 'bg-white border rounded-lg rounded-bl-sm px-4 py-2 max-w-[85%] w-fit';
        bolha.style.borderColor = 'var(--pibiex-borda)';
    }
    bolha.innerText = texto;
    box.appendChild(bolha);
    box.scrollTop = box.scrollHeight;
}

function mostrarAvisoAssistente(texto) {
    const box = document.getElementById('mensagens-assistente');
    const linha = document.createElement('p');
    linha.className = 'text-center text-[12px] py-2';
    linha.style.color = 'var(--pibiex-texto-suave)';
    linha.innerText = texto;
    box.appendChild(linha);
    box.scrollTop = box.scrollHeight;
}

// Apaga a conversa atual no banco e limpa a tela. Se ainda não houve pergunta
// nenhuma, não existe conversa salva — aí é só limpar.
window.novoChatAssistente = async () => {
    const box = document.getElementById('mensagens-assistente');

    if (!conversaIaAtual) {
        box.innerHTML = '';
        mostrarAvisoAssistente('Novo chat. Pode perguntar.');
        return;
    }

    if (!confirm('Isso apaga esta conversa com o assistente. Começar um novo chat?')) return;

    const token = localStorage.getItem('pibiex_aluno_token');
    const { data, error } = await window.supabaseClient.functions.invoke('assistente-ia', {
        body: { token, acao: 'apagar_conversa', conversaId: conversaIaAtual },
    });

    if (error || !data || data.erro) {
        mostrarAvisoAssistente('Não consegui apagar a conversa agora. Tente novamente em instantes.');
        return;
    }

    conversaIaAtual = null;
    box.innerHTML = '';
    mostrarAvisoAssistente('Conversa apagada. Pode começar de novo.');
};

async function enviarMensagemAssistente(e) {
    e.preventDefault();
    const input = document.getElementById('input-assistente');
    const mensagem = input.value.trim();
    if (!mensagem) return;

    adicionarMensagemNaTela('aluno', mensagem);
    input.value = '';

    const token = localStorage.getItem('pibiex_aluno_token');
    const { data, error } = await window.supabaseClient.functions.invoke('assistente-ia', {
        body: { token, mensagem, conversaId: conversaIaAtual },
    });

    if (error || !data || data.erro) {
        adicionarMensagemNaTela('ia', 'Desculpe, não consegui responder agora. Tente novamente em instantes.');
        return;
    }

    conversaIaAtual = data.conversaId;
    adicionarMensagemNaTela('ia', data.resposta);
}

// Confere no servidor se a sessão ainda vale — e de quebra traz o estado
// atual do aluno direto do banco (turma ativa? aceitou o termo de uso?). O
// token e os dados no localStorage não bastam sozinhos: se o professor pausar
// a turma, ou se a versão do termo de uso mudar, isso só é refletido aqui.
//
// Devolve os dados do aluno se a sessão vale, ou null se não vale (turma
// pausada, sessão expirada, etc.). Se a rede falhar, devolve um objeto
// "neutro" — não expulsa o aluno nem força o termo de uso à toa por causa de
// uma falha de conexão.
async function conferirSessaoNoServidor(token) {
    try {
        const { data, error } = await window.supabaseClient.functions.invoke('validar-sessao-aluno', {
            body: { token },
        });
        if (error || !data || data.erro || data.ok !== true) return null;
        return data.aluno;
    } catch (e) {
        return { precisaAceitarTermos: false };
    }
}

function encerrarSessaoLocal(motivo) {
    localStorage.removeItem('pibiex_aluno_token');
    localStorage.removeItem('pibiex_aluno_dados');
    window.location.href = '../index.html?sessao=' + motivo;
}

// ============================================================
// Ponto de entrada — cada página chama isso passando seu próprio id
// ============================================================
async function iniciarShellAluno(paginaAtivaId) {
    const sessao = protegerPaginaAluno();
    if (!sessao) return null;

    const alunoNoServidor = await conferirSessaoNoServidor(sessao.token);
    if (!alunoNoServidor) {
        encerrarSessaoLocal('encerrada');
        return null;
    }

    if (alunoNoServidor.precisaAceitarTermos) {
        window.location.href = '../termos.html';
        return null;
    }

    montarMenuLateral(paginaAtivaId);
    montarTopo(sessao.dados.nomeCompleto);
    montarAssistenteFlutuante();

    return sessao.dados;
}
