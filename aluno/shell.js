// /aluno/shell.js
//
// Script compartilhado por TODAS as páginas da área do aluno.
// Cada página só precisa:
//   1) Ter <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
//      e <script src="shell.js"></script> no <head> ou fim do <body>
//   2) Ter estes 3 elementos vazios no HTML: <div id="sidebar-container"></div>,
//      <div id="topo-pagina"></div>, <div id="assistente-flutuante"></div>
//   3) Chamar `iniciarShellAluno('id-da-pagina')` dentro de um <script> próprio,
//      onde 'id-da-pagina' é um dos ids da lista ITENS_MENU abaixo.
//
// O que ele garante:
//   - Se não houver sessão salva -> manda para a tela de login.
//   - Se a sessão exigir troca de senha (precisa_trocar_senha) -> manda para
//     a tela de troca de senha, em QUALQUER página, não só logo após o login.
//   - Menu lateral consistente, com o item da página atual destacado.
//   - Botão flutuante do assistente de IA, disponível em todas as páginas.

const SUPABASE_URL = 'https://gclcsgqvunutbvpazgsg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjbGNzZ3F2dW51dGJ2cGF6Z3NnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1Njc5MTQsImV4cCI6MjEwMDE0MzkxNH0.T87bJPVYiYO9vyJtaB6_n9CREO6fmNGumGK0phtaYk';

window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Itens do menu lateral. Adicionar um novo item aqui já reflete em todas as páginas.
const ITENS_MENU = [
    { id: 'inicio',         label: 'Início',              href: 'inicio.html',         icone: '🏠' },
    { id: 'cronograma',     label: 'Cronograma',          href: 'cronograma.html',     icone: '📅' },
    { id: 'conteudo',       label: 'Conteúdo',            href: 'conteudo.html',       icone: '📚' },
    { id: 'atividades',     label: 'Atividades',          href: 'atividades.html',     icone: '📝' },
    { id: 'trabalhos',      label: 'Meus Trabalhos',      href: 'trabalhos.html',      icone: '📤' },
    { id: 'chat',           label: 'Chat da Turma',       href: 'chat.html',           icone: '💬' },
    { id: 'ferramentas-ia', label: 'Ferramentas de IA',   href: 'ferramentas-ia.html', icone: '🧰' },
    { id: 'prompts',        label: 'Banco de Prompts',    href: 'prompts.html',        icone: '💡' },
    { id: 'desafios',       label: 'Desafios Semanais',   href: 'desafios.html',       icone: '🏆' },
    { id: 'galeria',        label: 'Galeria',             href: 'galeria.html',        icone: '🖼️' },
    { id: 'laboratorio-ia', label: 'Laboratório de IA',   href: 'laboratorio-ia.html', icone: '🧪' },
    { id: 'faq',            label: 'FAQ',                 href: 'faq.html',            icone: '❓' },
    { id: 'recursos',       label: 'Recursos Extras',     href: 'recursos.html',       icone: '🔗' },
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

    // Isso vale em QUALQUER página do aluno, não só logo após o login: se por
    // algum motivo a conta ainda estiver marcada como "precisa trocar senha"
    // (ex: o aluno fechou o navegador no meio da troca), ele é barrado aqui.
    if (dados.precisaTrocarSenha) {
        window.location.href = '../trocar-senha.html';
        return null;
    }

    return { token, dados };
}

// ============================================================
// 2) Menu lateral
// ============================================================
function montarMenuLateral(paginaAtivaId) {
    const container = document.getElementById('sidebar-container');
    if (!container) return;

    const itensHtml = ITENS_MENU.map((item) => {
        const ativo = item.id === paginaAtivaId;
        const classesBase = 'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition';
        const classesAtivo = ativo
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-blue-100 hover:bg-blue-800/60 hover:text-white';
        return `
            <a href="${item.href}" class="${classesBase} ${classesAtivo}">
                <span class="text-lg">${item.icone}</span>
                <span>${item.label}</span>
            </a>
        `;
    }).join('');

    container.outerHTML = `
        <aside id="sidebar-container" class="w-72 shrink-0 bg-blue-950 min-h-screen p-5 flex flex-col gap-1 sticky top-0">
            <div class="px-2 pb-5 mb-2 border-b border-blue-800">
                <p class="text-white font-black text-lg leading-tight">PIBIEX 2026</p>
                <p class="text-blue-300 text-xs font-medium">Curso de Inteligência Artificial</p>
            </div>
            ${itensHtml}
        </aside>
    `;
}

// ============================================================
// 3) Barra do topo (nome do aluno + sair)
// ============================================================
function montarTopo(nomeCompleto) {
    const container = document.getElementById('topo-pagina');
    if (!container) return;

    const primeiroNome = (nomeCompleto || '').split(' ')[0];

    container.outerHTML = `
        <header id="topo-pagina" class="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
            <p class="text-gray-500 text-sm">Bem-vindo(a), <span class="font-bold text-gray-800">${primeiroNome}</span></p>
            <button onclick="sairAluno()" class="text-sm font-bold text-gray-500 hover:text-red-600 transition">Sair</button>
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
// 4) Assistente de IA flutuante (disponível em toda página do aluno)
// ============================================================
let conversaIaAtual = null;

function montarAssistenteFlutuante() {
    const container = document.getElementById('assistente-flutuante');
    if (!container) return;

    container.outerHTML = `
        <div id="assistente-flutuante">
            <button id="botao-assistente" onclick="alternarPainelAssistente()"
                    class="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-16 h-16 shadow-xl flex items-center justify-center text-2xl transition transform hover:scale-105">
                🤖
            </button>

            <div id="painel-assistente" class="hidden fixed bottom-24 right-6 z-40 w-96 max-w-[90vw] h-[32rem] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
                <div class="bg-blue-600 text-white px-5 py-4 flex justify-between items-center">
                    <div>
                        <p class="font-bold">Assistente PIBIEX</p>
                        <p class="text-blue-100 text-xs">Tire dúvidas sobre IA, 24h</p>
                    </div>
                    <button onclick="alternarPainelAssistente()" class="text-white/80 hover:text-white font-bold">✖</button>
                </div>
                <div id="mensagens-assistente" class="flex-1 overflow-y-auto p-4 space-y-3 text-sm bg-gray-50"></div>
                <form id="form-assistente" class="p-3 border-t border-gray-100 flex gap-2">
                    <input id="input-assistente" type="text" placeholder="Digite sua dúvida..."
                           class="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                    <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-10 h-10 flex items-center justify-center shrink-0">➤</button>
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
        bolha.className = 'bg-blue-600 text-white rounded-2xl rounded-br-sm px-4 py-2 ml-auto max-w-[85%] w-fit';
    } else {
        bolha.className = 'bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-2 max-w-[85%] w-fit';
    }
    bolha.innerText = texto;
    box.appendChild(bolha);
    box.scrollTop = box.scrollHeight;
}

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

// ============================================================
// Ponto de entrada — cada página chama isso passando seu próprio id
// ============================================================
async function iniciarShellAluno(paginaAtivaId) {
    const sessao = protegerPaginaAluno();
    if (!sessao) return null; // já foi redirecionado

    montarMenuLateral(paginaAtivaId);
    montarTopo(sessao.dados.nomeCompleto);
    montarAssistenteFlutuante();

    return sessao.dados;
}
