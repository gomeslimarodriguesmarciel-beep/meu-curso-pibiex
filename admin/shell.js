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
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjbGNzZ3F2dW51dGJ2cGF6Z3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1Njc5MTQsImV4cCI6MjEwMDE0MzkxNH0.T87bJPVYiYO9vyJtaB6_n9CREO6f-mNGumGK0phtaYk';

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Itens do menu lateral do painel. Itens sem página construída ainda ficam
// visíveis (mostrando o que vem por aí) mas podem não ter destino ainda.
const ITENS_MENU_EQUIPE = [
    { id: 'inicio',       label: 'Início',            href: 'inicio.html',       icone: '🏠' },
    { id: 'turmas',       label: 'Turmas',            href: 'turmas.html',       icone: '🏫' },
    { id: 'alunos',       label: 'Alunos',            href: 'alunos.html',       icone: '🎓' },
    { id: 'cronograma',   label: 'Cronograma',        href: 'cronograma.html',   icone: '📅' },
    { id: 'conteudo',     label: 'Conteúdo',          href: 'conteudo.html',     icone: '📚' },
    { id: 'atividades',   label: 'Atividades',        href: 'atividades.html',  icone: '📝' },
    { id: 'trabalhos',    label: 'Corrigir Trabalhos', href: 'trabalhos.html',   icone: '✅' },
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
// 4) Seletor de turma (usado pelas telas que trabalham sobre UMA turma:
//    conteúdo, atividades, avisos, chat e correção de trabalhos)
// ============================================================
const CHAVE_TURMA_SELECIONADA = 'pibiex_turma_selecionada';

function escaparHtml(texto) {
    const div = document.createElement('div');
    div.innerText = texto ?? '';
    return div.innerHTML;
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
