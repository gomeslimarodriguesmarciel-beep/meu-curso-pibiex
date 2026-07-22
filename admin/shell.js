// /admin/shell.js
//
// Script compartilhado por TODAS as páginas do painel do professor/admin.
// Cada página só precisa:
//   1) Ter <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//      e <script src="shell.js"></script>
//   2) Ter estes 2 elementos vazios no HTML: <div id="sidebar-container"></div>
//      e <div id="topo-pagina"></div>
//   3) Chamar `iniciarShellEquipe('id-da-pagina')` dentro de um <script> próprio.

const SUPABASE_URL = 'https://gclcsgqvunutbvpazgsg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjbGNzZ3F2dW51dGJ2cGF6Z3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1Njc5MTQsImV4cCI6MjEwMDE0MzkxNH0.T87bJPVYiYO9vyJtaB6_n9CREO6fmNGumGK0phtaYk';

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Itens do menu lateral do painel. Itens sem página construída ainda ficam
// visíveis (mostrando o que vem por aí) mas podem não ter destino ainda.
const ITENS_MENU_EQUIPE = [
    { id: 'inicio',       label: 'Início',            href: 'inicio.html',       icone: '🏠' },
    { id: 'alunos',       label: 'Alunos',            href: 'alunos.html',       icone: '🎓' },
    { id: 'cronograma',   label: 'Cronograma',        href: 'cronograma.html',   icone: '📅' },
    { id: 'conteudo',     label: 'Conteúdo',          href: 'conteudo.html',     icone: '📚' },
    { id: 'atividades',   label: 'Atividades',        href: 'atividades.html',  icone: '📝' },
    { id: 'avisos',       label: 'Avisos',            href: 'avisos.html',       icone: '📢' },
    { id: 'chat',         label: 'Chat da Turma',     href: 'chat.html',         icone: '💬' },
    { id: 'galeria',      label: 'Galeria',           href: 'galeria.html',      icone: '🖼️' },
    { id: 'prompts',      label: 'Banco de Prompts',  href: 'prompts.html',      icone: '💡' },
    { id: 'desafios',     label: 'Desafios Semanais', href: 'desafios.html',     icone: '🏆' },
    { id: 'laboratorio',  label: 'Laboratório de IA', href: 'laboratorio.html',  icone: '🧪' },
    { id: 'faq',          label: 'FAQ',               href: 'faq.html',          icone: '❓' },
    { id: 'recursos',     label: 'Recursos Extras',   href: 'recursos.html',     icone: '🔗' },
];

// ============================================================
// 1) Proteção de sessão da equipe
// ============================================================
function protegerPaginaEquipe() {
    const token = localStorage.getItem('pibiex_equipe_token');
    const dadosBrutos = localStorage.getItem('pibiex_equipe_dados');

    if (!token || !dadosBrutos) {
        window.location.href = '../index.html';
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

    const itensHtml = ITENS_MENU_EQUIPE.map((item) => {
        const ativo = item.id === paginaAtivaId;
        const classesBase = 'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition';
        const classesAtivo = ativo
            ? 'bg-red-600 text-white shadow-sm'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white';
        return `
            <a href="${item.href}" class="${classesBase} ${classesAtivo}">
                <span class="text-lg">${item.icone}</span>
                <span>${item.label}</span>
            </a>
        `;
    }).join('');

    container.outerHTML = `
        <aside id="sidebar-container" class="w-72 shrink-0 bg-gray-950 min-h-screen p-5 flex flex-col gap-1 sticky top-0">
            <div class="px-2 pb-5 mb-2 border-b border-gray-800">
                <p class="text-white font-black text-lg leading-tight">PIBIEX 2026</p>
                <p class="text-red-400 text-xs font-bold uppercase tracking-wide">Painel da equipe</p>
            </div>
            ${itensHtml}
        </aside>
    `;
}

// ============================================================
// 3) Barra do topo (nome + cargo + sair)
// ============================================================
function montarTopoEquipe(dados) {
    const container = document.getElementById('topo-pagina');
    if (!container) return;

    container.outerHTML = `
        <header id="topo-pagina" class="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
            <p class="text-gray-500 text-sm">
                <span class="font-bold text-gray-800">${dados.nomeCompleto}</span>
                <span class="ml-2 text-xs font-bold uppercase text-red-600 bg-red-50 px-2 py-0.5 rounded-full">${dados.cargo}</span>
            </p>
            <button onclick="sairEquipe()" class="text-sm font-bold text-gray-500 hover:text-red-600 transition">Sair</button>
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
    window.location.href = '../index.html';
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
