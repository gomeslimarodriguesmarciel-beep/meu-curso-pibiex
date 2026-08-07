// /admin/shell.js
//
// Script compartilhado por TODAS as páginas do painel do professor/admin.
// Cada página só precisa:
//   1) Ter <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//      e <script src="shell.js"></script>
//   2) Ter estes 2 elementos vazios no HTML: <div id="sidebar-container"></div>
//      e <div id="topo-pagina"></div>
//   3) Chamar `iniciarShellEquipe('id-da-pagina')` dentro de um <script> próprio.
//
// Identidade visual: mesmo gradiente azul-marinho da área do aluno, mas com
// acento vermelho (em vez de lima) para marcar "zona da equipe/restrita".

const SUPABASE_URL = 'https://gclcsgqvunutbvpazgsg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjbGNzZ3F2dW51dGJ2cGF6Z3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1Njc5MTQsImV4cCI6MjEwMDE0MzkxNH0.T87bJPVYiYO9vyJtaB6_n9CREO6f-mNGumGK0phtaYk';

// O token de sessão vai como header customizado em toda consulta feita por
// este cliente — é isso que as policies de leitura das tabelas de conteúdo
// exigem agora (antes eram públicas, qualquer um na internet lia direto pela
// API). Setado aqui uma vez vale pra toda página que carrega este shell.
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { 'x-sessao-token': localStorage.getItem('pibiex_equipe_token') || '' } },
});

// ============================================================
// 0) Identidade visual: fonte + tokens de cor injetados uma vez
// ============================================================
(function injetarIdentidadeVisualEquipe() {
    const linkFonte = document.createElement('link');
    linkFonte.rel = 'stylesheet';
    linkFonte.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
    document.head.appendChild(linkFonte);

    const estilo = document.createElement('style');
    estilo.textContent = `
        body { font-family: 'Inter', sans-serif; }
        :root {
            --pibiex-tinta: #1E3A8A;
            --pibiex-gradiente: linear-gradient(135deg, #0B1B4A 0%, #1E3A8A 50%, #1E40AF 100%);
            --pibiex-acento: #EF4444;
            --pibiex-acento-profundo: #B91C1C;
            --pibiex-papel: #F9FAFB;
            --pibiex-texto: #111827;
            --pibiex-texto-suave: #6B7280;
            --pibiex-borda: #E5E7EB;
        }
        .pibiex-textura-grade {
            position: absolute; inset: 0; pointer-events: none;
            background-image:
                linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);
            background-size: 34px 34px;
            mask-image: radial-gradient(ellipse 85% 75% at 50% 40%, #000 30%, transparent 100%);
        }
    `;
    document.head.appendChild(estilo);
})();

// Itens do menu lateral do painel. Itens sem página construída ainda ficam
// visíveis (mostrando o que vem por aí) mas podem não ter destino ainda.
const ITENS_MENU_EQUIPE = [
    { id: 'inicio',       label: 'Início',            href: 'inicio.html' },
    { id: 'turmas',       label: 'Turmas',            href: 'turmas.html' },
    { id: 'alunos',       label: 'Alunos',            href: 'alunos.html' },
    { id: 'cronograma',   label: 'Cronograma',        href: 'cronograma.html' },
    { id: 'conteudo',     label: 'Conteúdo',          href: 'conteudo.html' },
    { id: 'atividades',   label: 'Atividades',        href: 'atividades.html' },
    { id: 'trabalhos',    label: 'Corrigir Trabalhos', href: 'trabalhos.html' },
    { id: 'avisos',       label: 'Avisos',            href: 'avisos.html' },
    { id: 'chat',         label: 'Chat da Turma',     href: 'chat.html' },
    { id: 'galeria',      label: 'Galeria',           href: 'galeria.html' },
    { id: 'prompts',      label: 'Banco de Prompts',  href: 'prompts.html' },
    { id: 'desafios',     label: 'Desafios Semanais', href: 'desafios.html' },
    { id: 'laboratorio',  label: 'Laboratório de IA', href: 'laboratorio.html' },
    { id: 'faq',          label: 'FAQ',               href: 'faq.html' },
    { id: 'recursos',     label: 'Recursos Extras',   href: 'recursos.html' },
    { id: 'equipe',       label: 'Equipe',            href: 'equipe.html',       requerTotal: true },
];

// Ícones de linha (SVG inline, sem dependência externa) — mesmo padrão da
// área do aluno, sem emoji.
const ICONES = {
    inicio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5 12 4l8 6.5"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-6h4v6"/></svg>',
    turmas: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4" width="17" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/></svg>',
    alunos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M4 19c0-3 2.5-5 5-5s5 2 5 5"/><circle cx="17" cy="9" r="2.3"/><path d="M14.5 19c.3-2.2 1.7-3.8 3.3-4.3"/></svg>',
    cronograma: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="1.5"/><path d="M4 9.5h16"/><path d="M8 3v4M16 3v4"/></svg>',
    conteudo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2 2 0 0 1 6 4h12v16H6a2 2 0 0 1-2-2z"/><path d="M8 8h6M8 12h6"/></svg>',
    atividades: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5"/><path d="M9.5 13.5h5M9.5 17h5"/></svg>',
    trabalhos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 13 4 4 10-10"/></svg>',
    avisos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10v4h3l5 4V6L7 10z"/><path d="M15 9a3.5 3.5 0 0 1 0 6M18 6.5a7 7 0 0 1 0 11"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H8l-4 4z"/></svg>',
    galeria: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="4.5" width="17" height="14" rx="1.5"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M20 15.5 15 10 5 18.5"/></svg>',
    prompts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.9.9.9 1.6v.5h5.2v-.5c0-.7.4-1.2.9-1.6A6 6 0 0 0 12 3z"/></svg>',
    desafios: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 4h8v4a4 4 0 0 1-8 0z"/><path d="M8 5H5v2a3 3 0 0 0 3 3M16 5h3v2a3 3 0 0 1-3 3"/><path d="M12 12v4M9 20h6M10 16h4v4h-4z"/></svg>',
    laboratorio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6.5L5.5 18a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.5V3"/><path d="M8.5 14h7"/></svg>',
    faq: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M9.5 9.3a2.5 2.5 0 1 1 3.7 2.2c-.7.4-1.2.9-1.2 1.7v.3"/><path d="M12 16.7h.01"/></svg>',
    recursos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 14.5 14.5 9.5"/><path d="M11 7l1.5-1.5a3.5 3.5 0 0 1 5 5L16 12M13 17l-1.5 1.5a3.5 3.5 0 0 1-5-5L8 12"/></svg>',
    equipe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7.5" r="3"/><path d="M6.5 19c0-3.2 2.5-5.5 5.5-5.5s5.5 2.3 5.5 5.5"/><circle cx="4.5" cy="10" r="2"/><circle cx="19.5" cy="10" r="2"/><path d="M2.5 19c.2-2 1.3-3.5 2.8-4M21.5 19c-.2-2-1.3-3.5-2.8-4"/></svg>',
};

function iconeSvg(id) {
    return `<span class="w-5 h-5 shrink-0">${ICONES[id] || ''}</span>`;
}

// ============================================================
// 1) Proteção de sessão da equipe
// ============================================================
function protegerPaginaEquipe() {
    const token = localStorage.getItem('pibiex_equipe_token');
    const dadosBrutos = localStorage.getItem('pibiex_equipe_dados');

    if (!token || !dadosBrutos) {
        window.location.href = '../login.html';
        return null;
    }

    return { token, dados: JSON.parse(dadosBrutos) };
}

// ============================================================
// 2) Menu lateral (tema vermelho/institucional para diferenciar da área do aluno)
// ============================================================
function montarMenuLateralEquipe(paginaAtivaId) {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    // "Equipe" (gerenciar outras contas) só aparece pra quem já tem acesso
    // total — item com "requerTotal" fica escondido pra conta restrita, sem
    // nem chegar a mostrar um botão que ia dar "sem permissão" ao clicar.
    let nivelAcesso = 'restrito';
    try {
        nivelAcesso = (JSON.parse(localStorage.getItem('pibiex_equipe_dados') || '{}').nivelAcesso) || 'restrito';
    } catch (e) { /* mantém 'restrito' se não der pra ler */ }

    const itensHtml = ITENS_MENU_EQUIPE.filter((item) => !item.requerTotal || nivelAcesso === 'total').map((item) => {
        const ativo = item.id === paginaAtivaId;
        const classesBase = 'flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-md text-sm font-semibold transition border-l-2 relative';
        const classesAtivo = ativo
            ? 'border-[var(--pibiex-acento)] bg-white/[0.06] text-white'
            : 'border-transparent text-slate-400 hover:text-white hover:bg-white/[0.04]';
        return `
            <a href="${item.href}" class="${classesBase} ${classesAtivo}">
                ${iconeSvg(item.id)}
                <span>${item.label}</span>
            </a>
        `;
    }).join('');

    // No celular a barra lateral vira uma gaveta: fica fora da tela (translate)
    // até o ☰ no topo abrir. Do md pra cima ela volta a ficar fixa no lugar,
    // como sempre foi — 'md:translate-x-0' cancela o deslocamento.
    container.outerHTML = `
        <div id="sidebar-fundo" onclick="window.fecharMenuEquipe()"
             class="hidden fixed inset-0 bg-black/60 z-30 md:hidden"></div>
        <aside id="sidebar-container" class="fixed md:sticky top-0 left-0 h-screen w-72 shrink-0 p-5 flex flex-col gap-1 z-40 -translate-x-full md:translate-x-0 transition-transform duration-200 overflow-y-auto overflow-x-hidden"
               style="background: var(--pibiex-gradiente);">
            <div class="pibiex-textura-grade"></div>
            <div class="px-2 pb-5 mb-2 border-b border-white/10 flex items-center justify-between relative">
                <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-full shrink-0 flex items-center justify-center relative" style="border: 1.5px solid var(--pibiex-acento);">
                        <div class="absolute inset-[3px] rounded-full" style="border: 1px solid rgba(239,68,68,.35);"></div>
                        <span class="text-[var(--pibiex-acento)] text-[10px] font-black leading-none relative">P26</span>
                    </div>
                    <div class="min-w-0">
                        <p class="text-white font-black text-[15px] leading-tight truncate">PIBIEX 2026</p>
                        <p class="text-[var(--pibiex-acento)] text-[9.5px] font-bold uppercase tracking-wide">Painel da equipe</p>
                    </div>
                </div>
                <button onclick="window.fecharMenuEquipe()" class="md:hidden text-white/60 hover:text-white text-xl leading-none px-1 shrink-0" aria-label="Fechar menu">✕</button>
            </div>
            <div class="relative flex flex-col gap-1">${itensHtml}</div>
        </aside>
    `;
}

window.abrirMenuEquipe = () => {
    document.getElementById('sidebar-container').classList.remove('-translate-x-full');
    document.getElementById('sidebar-fundo').classList.remove('hidden');
};
window.fecharMenuEquipe = () => {
    document.getElementById('sidebar-container').classList.add('-translate-x-full');
    document.getElementById('sidebar-fundo').classList.add('hidden');
};

// ============================================================
// 3) Barra do topo (nome + cargo + sair)
// ============================================================
function montarTopoEquipe(dados) {
    const container = document.getElementById('topo-pagina');
    if (!container) return;

    container.outerHTML = `
        <header id="topo-pagina" class="flex items-center justify-between gap-3 px-4 md:px-8 py-4 md:py-5 bg-white border-b border-gray-100">
            <div class="flex items-center gap-3 min-w-0">
                <button onclick="window.abrirMenuEquipe()" class="md:hidden shrink-0 text-gray-500 hover:text-gray-900 text-2xl leading-none" aria-label="Abrir menu">☰</button>
                <p class="text-gray-500 text-sm min-w-0 truncate">
                    <span class="font-bold text-gray-800">${dados.nomeCompleto}</span>
                    <span class="ml-2 text-xs font-bold uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-full">${dados.cargo}</span>
                </p>
            </div>
            <button onclick="sairEquipe()" class="text-sm font-bold text-gray-500 hover:text-red-600 transition shrink-0">Sair</button>
        </header>
    `;
}

async function sairEquipe() {
    const token = localStorage.getItem('pibiex_equipe_token');
    if (token) {
        try { await window.supabaseClient.functions.invoke('logout-equipe', { body: { token } }); }
        catch (e) { /* mesmo se falhar, ainda limpamos a sessão local */ }
    }
    localStorage.removeItem('pibiex_equipe_token');
    localStorage.removeItem('pibiex_equipe_dados');
    window.location.href = '../login.html';
}

// ============================================================
// 4) Seletor de turma (usado pelas telas que trabalham sobre UMA turma:
//    conteúdo, atividades, avisos, chat e correção de trabalhos)
// ============================================================
const CHAVE_TURMA_SELECIONADA = 'pibiex_turma_selecionada';

function escaparHtml(texto) {
    const div = document.createElement('div');
    div.innerText = texto ?? '';
    return div.innerHTML;
}

// Usado em todo href/src que vem de dado gravado por aluno (link de trabalho,
// desafio, laboratório etc.): escaparHtml() sozinho não barra o esquema
// "javascript:" porque ele não tem caracteres para escapar — um link desses
// clicado pelo professor executaria no contexto da própria página do painel.
function urlSegura(url) {
    return /^https?:\/\//i.test(url ?? '') ? url : '#';
}

function seloTurma(turma) {
    return turma.ativa
        ? '<span class="text-xs font-bold uppercase text-green-700 bg-green-50 px-2 py-0.5 rounded-full shrink-0">Ativa</span>'
        : '<span class="text-xs font-bold uppercase text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">Pausada</span>';
}

function rotuloTurma(turma) {
    return turma.ano ? `${turma.nome} · ${turma.ano}` : turma.nome;
}

// Monta a barra de escolha de turma dentro de `idContainer` e devolve o id da
// turma que ficou selecionada (ou null se não houver turma nenhuma).
// `aoTrocar(turmaId)` é chamado só quando o professor troca de turma — na
// primeira carga a página usa o valor devolvido e carrega os dados por conta.
async function montarSeletorTurma(idContainer, aoTrocar) {
    const container = document.getElementById(idContainer);
    if (!container) return null;

    const { data: turmas, error } = await window.supabaseClient
        .from('turmas')
        .select('id, nome, ano, ativa')
        .order('ativa', { ascending: false })
        .order('ano', { ascending: false })
        .order('nome', { ascending: true });

    if (error) {
        container.innerHTML = '<p class="text-red-500 text-sm">Erro ao carregar as turmas.</p>';
        console.error(error);
        return null;
    }

    if (!turmas || turmas.length === 0) {
        container.innerHTML = `
            <p class="text-amber-700 text-sm bg-amber-50 border border-amber-100 rounded-xl p-4">
                Nenhuma turma cadastrada ainda. Crie a primeira em
                <a href="turmas.html" class="underline font-bold">Turmas</a>.
            </p>
        `;
        return null;
    }

    // Reaproveita a turma escolhida na tela anterior, para o professor não ter
    // que escolher de novo a cada página. Se aquela turma foi apagada, cai na
    // primeira da lista (que é a mais recente entre as ativas).
    const salva = localStorage.getItem(CHAVE_TURMA_SELECIONADA);
    let turmaAtual = turmas.some(t => t.id === salva) ? salva : turmas[0].id;
    localStorage.setItem(CHAVE_TURMA_SELECIONADA, turmaAtual);

    const molduraBarra = 'flex items-center gap-3 bg-white border border-gray-100 shadow-sm rounded-2xl px-4 py-3';

    function desenhar() {
        const turma = turmas.find(t => t.id === turmaAtual);

        // Com uma turma só, um menu de uma opção seria ruído: mostra o nome direto.
        const escolha = turmas.length === 1
            ? `<p class="font-bold text-gray-800 text-sm truncate">${escaparHtml(rotuloTurma(turma))}</p>`
            : `<select id="${idContainer}-campo" class="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 bg-white">
                    ${turmas.map(t => `
                        <option value="${t.id}" ${t.id === turmaAtual ? 'selected' : ''}>
                            ${escaparHtml(rotuloTurma(t))}${t.ativa ? '' : ' (pausada)'}
                        </option>
                    `).join('')}
               </select>`;

        container.innerHTML = `
            <div class="${molduraBarra}">
                <span class="text-xs font-bold uppercase tracking-wide text-gray-500 shrink-0">Turma</span>
                ${escolha}
                ${seloTurma(turma)}
            </div>
            ${turma.ativa ? '' : `
                <p class="text-xs text-amber-700 mt-2">
                    Esta turma está pausada: os alunos dela não conseguem entrar na plataforma.
                    O que você editar aqui fica guardado e volta a aparecer quando ela for reativada.
                </p>
            `}
        `;

        const campo = document.getElementById(`${idContainer}-campo`);
        if (campo) {
            campo.addEventListener('change', () => {
                turmaAtual = campo.value;
                localStorage.setItem(CHAVE_TURMA_SELECIONADA, turmaAtual);
                desenhar();
                if (aoTrocar) aoTrocar(turmaAtual);
            });
        }
    }

    desenhar();
    return turmaAtual;
}

// ============================================================
// Ponto de entrada — cada página chama isso passando seu próprio id
// ============================================================
async function iniciarShellEquipe(paginaAtivaId) {
    const sessao = protegerPaginaEquipe();
    if (!sessao) return null;

    montarMenuLateralEquipe(paginaAtivaId);
    montarTopoEquipe(sessao.dados);

    return { token: sessao.token, dados: sessao.dados };
}
