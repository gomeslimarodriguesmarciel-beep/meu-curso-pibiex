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
let seq = 0; const pend = new Map(); let erros = [];
ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pend.has(msg.id)) { pend.get(msg.id)(msg); pend.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') erros.push('exceção: ' + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text).split('\n')[0]);
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') erros.push('console: ' + msg.params.args.map((a) => a.value ?? a.description).join(' ').slice(0, 160));
    if (msg.method === 'Page.javascriptDialogOpening') cdp('Page.handleJavaScriptDialog', { accept: true });
};
const cdp = (method, params = {}) => new Promise((res) => { const i = ++seq; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
await cdp('Network.setCacheDisabled', { cacheDisabled: true });
await cdp('Emulation.setDeviceMetricsOverride', { width: 1200, height: 900, deviceScaleFactor: 1, mobile: false });
await cdp('Page.addScriptToEvaluateOnNewDocument', { source: FALSO });

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
    'index.html', 'login.html', 'privacidade.html', 'termos.html',
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

ws.close(); navegador.kill(); servidor.close();
try { fs.rmSync(perfil, { recursive: true, force: true }); } catch { /* o navegador ainda pode estar fechando */ }
console.log(`\n${total - falhas} de ${total} verificações de navegador passaram.`);
process.exit(falhas ? 1 : 0);
