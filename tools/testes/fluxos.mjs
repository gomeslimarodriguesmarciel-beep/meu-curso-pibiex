// Testes de fluxo no navegador de verdade (Edge ou Chrome), SEM tocar em dados reais.
//
//   node tools/testes/fluxos.mjs
//
// Sobe um servidor local só para os arquivos do site, abre as páginas num navegador sem tela e responde
// no lugar do Supabase com tools/testes/servidor-falso.js. Confere:
//   1. toda página do aluno e do professor abre sem erro de JavaScript;
//   2. fluxos principais: enviar uma atividade, busca rápida (Ctrl+K), pedido de privacidade do aluno e resposta do professor.
// Nada é gravado em lugar nenhum: nenhum dado real é lido, criado ou apagado.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FALSO = fs.readFileSync(path.join(RAIZ, 'tools', 'testes', 'servidor-falso.js'), 'utf8');
const PORTA_SITE = 8799;
const PORTA_CDP = 9455;

// ---------------------------------------------------------------- servidor de arquivos
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain' };
const servidor = http.createServer((req, res) => {
    let caminho = decodeURIComponent(req.url.split('?')[0]);
    if (caminho.endsWith('/')) caminho += 'index.html';
    const arq = path.join(RAIZ, caminho);
    if (!arq.startsWith(RAIZ) || arq.startsWith(path.join(RAIZ, 'supabase') + path.sep) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) { res.writeHead(404); res.end('não achei'); return; }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arq)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(arq).pipe(res);
});
await new Promise((r) => servidor.listen(PORTA_SITE, '127.0.0.1', r));

// ---------------------------------------------------------------- navegador
function acharNavegador() {
    const candidatos = [process.env.CHROME_PATH,
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', 'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'];
    return candidatos.find((c) => c && fs.existsSync(c));
}
const exe = acharNavegador();
if (!exe) { console.log('Nenhum Edge/Chrome encontrado. Defina CHROME_PATH com o caminho do navegador.'); servidor.close(); process.exit(2); }
const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'pibiex-teste-'));
const navegador = spawn(exe, [`--remote-debugging-port=${PORTA_CDP}`, `--user-data-dir=${perfil}`, '--headless=new', '--no-first-run', '--no-sandbox', '--disable-gpu', 'about:blank'], { stdio: 'ignore' });

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
let alvo = null;
for (let i = 0; i < 60 && !alvo; i++) {
    try { alvo = (await (await fetch(`http://127.0.0.1:${PORTA_CDP}/json/list`)).json()).find((a) => a.type === 'page'); } catch { await esperar(250); }
}
if (!alvo) { console.log('Não consegui abrir o navegador de teste.'); navegador.kill(); servidor.close(); process.exit(2); }

const ws = new WebSocket(alvo.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let seq = 0; const pend = new Map(); let erros = []; let paraSupabase = [];
ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pend.has(msg.id)) { pend.get(msg.id)(msg); pend.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') erros.push('exceção: ' + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text).split('\n')[0]);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') erros.push('console: ' + msg.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 160));
    if (msg.method === 'Network.requestWillBeSent' && /supabase[.]co/.test(msg.params.request.url)) paraSupabase.push(msg.params.request.url);
    if (msg.method === 'Page.javascriptDialogOpening') cdp('Page.handleJavaScriptDialog', { accept: true });
};
const cdp = (method, params = {}) => new Promise((res) => { const i = ++seq; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
await cdp('Network.setCacheDisabled', { cacheDisabled: true });
await cdp('Emulation.setDeviceMetricsOverride', { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });
const idScript = (await cdp('Page.addScriptToEvaluateOnNewDocument', { source: FALSO })).result.identifier;

const avaliar = async (expressao) => (await cdp('Runtime.evaluate', { expression: expressao, awaitPromise: true, returnByValue: true })).result?.result?.value;
async function abrir(url, espera = 2500) { erros = []; await cdp('Page.navigate', { url: `http://127.0.0.1:${PORTA_SITE}/${url}` }); await esperar(espera); }
async function ate(expressao, ms = 5000) { const fim = Date.now() + ms; while (Date.now() < fim) { if (await avaliar(expressao)) return true; await esperar(150); } return false; }

// ---------------------------------------------------------------- resultados
let falhas = 0, total = 0;
function resultado(nome, ok, detalhe) {
    total++;
    if (ok) { console.log('  ok     ' + nome); return; }
    falhas++; console.log('  FALHA  ' + nome + (detalhe ? '\n           - ' + detalhe : ''));
}
// erros de serviços de fora (reCAPTCHA, VLibras, rede do navegador de teste) não são do nosso código
const nossos = (lista) => lista.filter((e) => !/recaptcha|gstatic|vlibras|google|net::|Failed to load resource|ERR_|favicon|Unity|WebGL|ResizeObserver/i.test(e));

// 1) todas as páginas abrem sem erro
console.log('\n== Páginas abrem sem erro de JavaScript');
const paginas = [
    'index.html', 'demo/index.html', 'sobre.html', 'transparencia.html', 'login.html', 'privacidade.html', 'termos.html', '404.html', 'trocar-senha.html',
    ...fs.readdirSync(path.join(RAIZ, 'aluno')).filter((f) => f.endsWith('.html')).filter((f) => f !== 'trabalhos.html').map((f) => `aluno/${f}?votou=1`),
    ...fs.readdirSync(path.join(RAIZ, 'admin')).filter((f) => f.endsWith('.html')).map((f) => `admin/${f}`),
];
for (const p of paginas) {
    await abrir(p, 2200);
    const ruins = nossos(erros);
    resultado(p.replace('?votou=1', ''), ruins.length === 0, ruins.slice(0, 3).join(' | '));
}

// 2) fluxos
console.log('\n== Fluxos principais');
await abrir('aluno/atividades.html?votou=1', 2500);
{
    const ok = await avaliar(`(async () => {
        const det = [...document.querySelectorAll('details.cx')].find(d => d.querySelector('textarea'));
        if (!det) return 'sem atividade a fazer';
        det.open = true;
        const t = det.querySelector('textarea'); t.value = 'Minha resposta de teste'; t.dispatchEvent(new Event('input', { bubbles: true }));
        det.querySelector('button[id^="btn-enviar-"]').click();
        return 'clicou';
    })()`);
    resultado('atividades: escrever e clicar em Enviar', ok === 'clicou', String(ok));
    const pediu = await ate(`!!document.querySelector('[role="dialog"], [role="alertdialog"], .dlg')`, 4000);
    resultado('atividades: pede confirmação antes de enviar', pediu);
    if (pediu) {
        await avaliar(`(() => { const b = [...document.querySelectorAll('[role="dialog"] button, [role="alertdialog"] button, .dlg button')].find(x => /enviar|confirmar|sim|ok/i.test(x.textContent)); if (b) b.click(); })()`);
        const enviou = await ate(`[...document.querySelectorAll('.chip')].some(c => /Enviad/i.test(c.textContent))`, 5000);
        resultado('atividades: depois de confirmar, aparece como Enviada', enviou);
    }
}

await abrir('aluno/inicio.html?votou=1', 2500);
{
    await avaliar(`document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))`);
    const abriu = await ate(`!!document.querySelector('.nav-busca')`, 4000);
    resultado('busca rápida abre com Ctrl+K', abriu);
    if (abriu) {
        await avaliar(`(() => { const c = document.querySelector('.nav-busca'); c.value = 'notas'; c.dispatchEvent(new Event('input')); })()`);
        const achou = await avaliar(`[...document.querySelectorAll('.nav-lista li')].some(li => /Bloco de notas/.test(li.textContent))`);
        resultado('busca rápida acha "Bloco de notas" ao digitar "notas"', !!achou);
    }
}

await abrir('aluno/perfil.html?votou=1', 2500);
{
    await avaliar(`(() => { document.getElementById('pedido-tipo').value = 'correcao'; document.getElementById('pedido-mensagem').value = 'Meu sobrenome está errado'; document.getElementById('btn-pedido').click(); })()`);
    const ok = await ate(`/Pedido enviado/.test(document.getElementById('msg-pedido')?.textContent || '')`, 4000);
    resultado('perfil: pedido de privacidade é enviado', ok);
}

await abrir('admin/privacidade.html', 2500);
{
    const tem = await avaliar(`document.querySelectorAll('details.cx').length > 0`);
    resultado('professor vê o pedido de privacidade', !!tem);
    await avaliar(`(() => { const d = document.querySelector('details.cx'); d.open = true; document.querySelector('textarea[id^="resp-"]').value = 'Corrigi seu nome.'; document.querySelector('button[onclick^="atender"]').click(); })()`);
    const pediu = await ate(`!!document.querySelector('[role="dialog"], [role="alertdialog"], .dlg')`, 4000);
    resultado('professor: pede confirmação ao responder', pediu);
}



// Entrada e saída: o visitante não precisa adivinhar onde clicar
await abrir('login.html', 1800);
{
    await avaliar(`document.getElementById('perfil-professor').click()`);
    resultado('login: "Sou professor / administrador" abre o acesso da equipe', !!(await ate(`!document.getElementById('modal-admin').classList.contains('hidden')`, 3000)));
    await avaliar(`document.getElementById('perfil-aluno').click()`);
    resultado('login: "Sou aluno" volta ao acesso do aluno', !!(await ate(`document.getElementById('modal-admin').classList.contains('hidden')`, 3000)));
}
await abrir('aluno/atividades.html?votou=1', 2200);
{
    resultado('aluno: botão Sair visível no topo', !!(await avaliar(`(() => { const b = document.querySelector('.botao-sair'); return !!b && b.getBoundingClientRect().width > 0; })()`)));
    resultado('aluno: "Voltar ao site" e "Sair da conta" no menu lateral', !!(await avaliar(`/Voltar ao site/.test(document.getElementById('sidebar-container').innerText) && /Sair da conta/.test(document.getElementById('sidebar-container').innerText)`)));
    await avaliar(`document.querySelector('.botao-sair').click()`);
    resultado('aluno: Sair leva à tela de login', !!(await ate(`/login\.html/.test(location.pathname)`, 5000)));
}
await abrir('admin/inicio.html', 2200);
{
    resultado('professor: botão Sair visível no topo', !!(await avaliar(`(() => { const b = document.querySelector('.botao-sair'); return !!b && b.getBoundingClientRect().width > 0; })()`)));
    resultado('professor: "Voltar ao site" e "Sair da conta" no menu lateral', !!(await avaliar(`/Voltar ao site/.test(document.getElementById('sidebar-container').innerText) && /Sair da conta/.test(document.getElementById('sidebar-container').innerText)`)));
}
await abrir('404.html', 1500);
resultado('404: oferece 4 caminhos de volta', (await avaliar(`document.querySelectorAll('a.caminho').length`)) === 4);

// 3) Demonstração pública: tudo no navegador, sem falar com o Supabase
console.log('\n== Demonstração pública (nenhuma chamada ao servidor real)');
await cdp('Page.removeScriptToEvaluateOnNewDocument', { identifier: idScript });
await avaliar(`sessionStorage.clear()`);
paraSupabase = [];
await abrir('demo/index.html', 1500);
await avaliar(`document.getElementById('entrar-aluno').click()`);
await esperar(3000);
resultado('demo: entra como aluna', /aluno\/inicio/.test(await avaliar('location.pathname')));

// 3b) O Seri no cantinho (mascote da plataforma e assistente de IA)
console.log('\n== Seri, o mascote do cantinho');
await esperar(4500);
const seri = await avaliar(`(() => { const b = document.getElementById('botao-assistente'), f = document.getElementById('seri-fala'); return { rotulo: b && b.getAttribute('aria-label'), classe: b && b.className, aberta: f && f.dataset.aberta, texto: f && f.innerText }; })()`);
resultado('seri: o botão do assistente é o Seri', !!seri && /Seri/.test(seri.rotulo || '') && /seri-botao/.test(seri.classe || ''), JSON.stringify(seri));
resultado('seri: na demonstração o recado explica a tela', !!seri && seri.aberta === 'true' && /Seri:/.test(seri.texto || ''), seri && seri.texto);
await avaliar(`document.getElementById('botao-assistente').click()`);
await esperar(500);
resultado('seri: o chat abre com saudação e aviso de dados pessoais', !!(await avaliar(`/não escreva dados pessoais/.test(document.getElementById('mensagens-assistente').innerText) && /Seri/.test(document.getElementById('assistente-titulo').innerText)`)));
// opção "Parado" (Acessibilidade): botão redondo e sem falar sozinho
await avaliar(`localStorage.setItem('pibiex_prefs', JSON.stringify({ mascote: 'parado' }))`);
await cdp('Page.navigate', { url: `http://127.0.0.1:${PORTA_SITE}/aluno/inicio.html` });
await esperar(4500);
const parado = await avaliar(`(() => { const b = document.getElementById('botao-assistente'); return { classe: b.className, aberta: document.getElementById('seri-fala').dataset.aberta, video: !!b.querySelector('video') }; })()`);
resultado('seri: opção Parado vira botão redondo, sem animação e sem falar', !!parado && /seri-redondo/.test(parado.classe) && parado.aberta === 'false' && !parado.video, JSON.stringify(parado));
// "Reduzir animações": o Seri fica na imagem parada
await avaliar(`localStorage.setItem('pibiex_prefs', JSON.stringify({ semMovimento: true }))`);
await cdp('Page.navigate', { url: `http://127.0.0.1:${PORTA_SITE}/aluno/inicio.html` });
await esperar(3200);
const reduz = await avaliar(`(() => { const b = document.getElementById('botao-assistente'); const i = b.querySelector('img'); return { img: i ? i.getAttribute('src') : null, video: !!b.querySelector('video'), aberta: document.getElementById('seri-fala').dataset.aberta }; })()`);
resultado('seri: "Reduzir animações" mostra a imagem parada, sem vídeo e sem recado automático', !!reduz && /seri-3d-parado/.test(reduz.img || '') && !reduz.video && reduz.aberta === 'false', JSON.stringify(reduz));
// o Seri animado usa vídeo (conferido só pelo elemento; o arquivo existe?)
await avaliar(`localStorage.removeItem('pibiex_prefs')`);
const arquivos = await avaliar(`Promise.all(['/img/mascote/seri-3d.webm', '/img/mascote/seri-3d-safari.webp', '/img/mascote/seri-3d-parado.webp', '/img/mascote/seri-3d-avatar.webp'].map(u => fetch(u).then(r => r.ok)))`);
resultado('seri: os 4 arquivos do mascote existem', Array.isArray(arquivos) && arquivos.every(Boolean), JSON.stringify(arquivos));
// página inicial pública: o mesmo Seri no cantinho, com Entrar e Ver a demonstração
await avaliar(`localStorage.setItem('pibiex_a11y_dica', '1'); sessionStorage.removeItem('pibiex_seri_fala')`);
await cdp('Page.navigate', { url: `http://127.0.0.1:${PORTA_SITE}/index.html` });
await esperar(5200);
const inicio = await avaliar(`(() => { const f = document.getElementById('seri-fala'); const b = document.getElementById('botao-assistente'); return { botao: b && b.className, aberta: f && f.dataset.aberta, links: f ? [...f.querySelectorAll('a')].map(a => a.textContent.trim()) : [] }; })()`);
resultado('seri: a página inicial tem o Seri no cantinho, com Entrar e Ver a demonstração', !!inicio && /seri-botao/.test(inicio.botao || '') && inicio.aberta === 'true' && inicio.links.includes('Entrar') && inicio.links.includes('Ver a demonstração'), JSON.stringify(inicio));
// volta ao ponto onde os testes da demonstração continuam
await cdp('Page.navigate', { url: `http://127.0.0.1:${PORTA_SITE}/aluno/inicio.html` });
await esperar(1500);
const paginasDemo = ['aluno/atividades.html', 'aluno/conteudo.html', 'aluno/desafios.html', 'aluno/enquetes.html', 'aluno/galeria.html', 'aluno/notas.html', 'aluno/chat.html', 'aluno/frequencia.html', 'aluno/cronograma.html', 'aluno/prompts.html', 'aluno/laboratorio-ia.html', 'aluno/recursos.html', 'aluno/ferramentas-ia.html', 'aluno/faq.html', 'aluno/perfil.html'];
for (const p of paginasDemo) {
    erros = [];
    await cdp('Page.navigate', { url: `http://127.0.0.1:${PORTA_SITE}/${p}` });
    await esperar(1800);
    const ruins = nossos(erros);
    const vazio = await avaliar(`document.querySelector('main') ? document.querySelector('main').innerText.trim().length < 40 : true`);
    resultado('demo (aluna): ' + p, ruins.length === 0 && !vazio, ruins.slice(0, 2).join(' | ') || (vazio ? 'página ficou vazia' : ''));
}

// fluxo: a aluna envia uma atividade, o professor a vê e corrige
erros = [];
await cdp('Page.navigate', { url: `http://127.0.0.1:${PORTA_SITE}/aluno/atividades.html` });
await esperar(2200);
await avaliar(`(() => { const det = [...document.querySelectorAll('details.cx')].find(d => d.querySelector('textarea')); det.open = true; const t = det.querySelector('textarea'); t.value = 'Resposta da demonstração'; t.dispatchEvent(new Event('input', { bubbles: true })); det.querySelector('button[id^="btn-enviar-"]').click(); })()`);
if (await ate(`!!document.querySelector('[role="dialog"], [role="alertdialog"], .dlg')`, 4000)) {
    await avaliar(`(() => { const b = [...document.querySelectorAll('[role="dialog"] button, [role="alertdialog"] button, .dlg button')].find(x => /enviar|confirmar|sim|ok/i.test(x.textContent)); if (b) b.click(); })()`);
}
resultado('demo: a aluna envia a atividade', await ate(`[...document.querySelectorAll('.chip')].some(c => /Enviad/i.test(c.textContent))`, 5000));

await avaliar(`document.querySelector('#demo-faixa .trocar').click()`);
await esperar(3000);
resultado('demo: troca para professor', /admin\/inicio/.test(await avaliar('location.pathname')));
await cdp('Page.navigate', { url: `http://127.0.0.1:${PORTA_SITE}/admin/trabalhos.html` });
await esperar(2500);
resultado('demo: professor vê o trabalho enviado pela aluna', !!(await avaliar(`document.body.innerText.includes('Lia Exemplo') || [...document.querySelectorAll('details')].some(d => d.textContent.includes('Lia Exemplo'))`)));

const paginasProf = ['admin/inicio.html', 'admin/painel.html', 'admin/alunos.html', 'admin/frequencia.html', 'admin/enquetes.html', 'admin/avisos.html', 'admin/desafios.html', 'admin/atividades.html', 'admin/cronograma.html', 'admin/conteudo.html', 'admin/galeria.html', 'admin/chat.html', 'admin/privacidade.html'];
for (const p of paginasProf) {
    erros = [];
    await cdp('Page.navigate', { url: `http://127.0.0.1:${PORTA_SITE}/${p}` });
    await esperar(1800);
    const ruins = nossos(erros);
    const vazio = await avaliar(`document.querySelector('main') ? document.querySelector('main').innerText.trim().length < 40 : true`);
    resultado('demo (professor): ' + p, ruins.length === 0 && !vazio, ruins.slice(0, 2).join(' | ') || (vazio ? 'página ficou vazia' : ''));
}
await cdp('Page.navigate', { url: `http://127.0.0.1:${PORTA_SITE}/admin/inicio.html` });
await esperar(2000);
await avaliar(`document.querySelector('.botao-sair').click()`);
resultado('demo: Sair da demonstração volta para /demo/', !!(await ate(`location.pathname === '/demo/' || location.pathname === '/demo/index.html'`, 5000)));
resultado('demo: nenhuma chamada saiu para o Supabase', paraSupabase.length === 0, paraSupabase.slice(0, 3).join(' | '));

ws.close(); navegador.kill(); servidor.close();
try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* o navegador ainda pode estar fechando */ }
console.log(`\n${total - falhas} de ${total} verificações de navegador passaram.`);
process.exit(falhas ? 1 : 0);
