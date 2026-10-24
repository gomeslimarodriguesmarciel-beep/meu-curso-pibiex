// Verificações automáticas do site (sem internet, sem servidor).
// Uso, na pasta do projeto:   node tools/testes/verificar.mjs
// Sai com código 1 se alguma verificação falhar.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';

const RAIZ = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const IGNORAR = new Set(['node_modules', '.git', 'supabase', 'tools', 'vendor']);

function listar(pasta, ext, acc = []) {
    for (const nome of fs.readdirSync(pasta, { withFileTypes: true })) {
        if (IGNORAR.has(nome.name)) continue;
        const cam = path.join(pasta, nome.name);
        if (nome.isDirectory()) listar(cam, ext, acc);
        else if (ext.some((e) => nome.name.endsWith(e))) acc.push(cam);
    }
    return acc;
}

const paginas = listar(RAIZ, ['.html']);
const scripts = listar(RAIZ, ['.js']);
const rel = (f) => path.relative(RAIZ, f).replaceAll('\\', '/');
const ler = (f) => fs.readFileSync(f, 'utf8');

let falhas = 0;
let total = 0;
function verificar(nome, problemas) {
    total++;
    if (problemas.length === 0) { console.log('  ok     ' + nome); return; }
    falhas++;
    console.log('  FALHA  ' + nome);
    problemas.slice(0, 15).forEach((p) => console.log('           - ' + p));
    if (problemas.length > 15) console.log(`           … e mais ${problemas.length - 15}`);
}

// só blocos de JavaScript (ignora JSON-LD e outros tipos de dados)
const inline = (txt) => [...txt.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
    .filter((m) => !/type="(?!module|text\/javascript)/.test(m[1])).map((m) => m[2]);

// 1. Sintaxe de todo JavaScript (arquivos e blocos dentro das páginas)
{
    const p = [];
    for (const f of scripts) {
        const texto = ler(f);
        try {
            if (/^(export|import) /m.test(texto)) { // módulo de navegador: confere como módulo
                const r = spawnSync(process.execPath, ['--input-type=module', '--check'], { input: texto, encoding: 'utf8' });
                if (r.status !== 0) throw new Error((r.stderr || 'erro de sintaxe').split('\n').slice(0, 3).join(' '));
            } else new vm.Script(texto, { filename: f });
        } catch (e) { p.push(`${rel(f)}: ${e.message}`); }
    }
    for (const f of paginas) inline(ler(f)).forEach((b, i) => { try { new vm.Script(b, { filename: f }); } catch (e) { p.push(`${rel(f)} (bloco ${i + 1}): ${e.message}`); } });
    verificar(`sintaxe de ${scripts.length} scripts e ${paginas.length} páginas`, p);
}

// 2. Todo arquivo local usado pelas páginas existe
{
    const p = [];
    for (const f of paginas) {
        const txt = ler(f);
        for (const m of txt.matchAll(/\b(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
            const alvo = m[1];
            if (/^(https?:|mailto:|tel:|data:|javascript:|\/\/)/.test(alvo) || alvo.includes('${')) continue;
            const cam = alvo.startsWith('/') ? path.join(RAIZ, alvo) : path.join(path.dirname(f), alvo);
            if (!fs.existsSync(cam) && !fs.existsSync(cam + '.html')) p.push(`${rel(f)} aponta para ${alvo}, que não existe`);
        }
    }
    verificar('todo arquivo referenciado pelas páginas existe', p);
}

// 3. Nenhuma fonte ou script de terceiros carregado sem necessidade (LGPD: nada vaza para o Google)
{
    const p = [];
    for (const f of paginas.concat(scripts)) {
        if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(ler(f))) p.push(`${rel(f)} carrega fontes do Google`);
    }
    verificar('nenhuma página pede fontes ao Google', p);
}

// 4. Sem janelas feias do navegador (confirm/prompt) — a plataforma tem as suas
{
    const p = [];
    for (const f of paginas.concat(scripts)) {
        if (rel(f) === 'acessibilidade.js') continue;
        const txt = f.endsWith('.html') ? inline(ler(f)).join('\n') : ler(f);
        if (/(?<![\w.])(?:confirm|prompt)\s*\(/.test(txt)) p.push(`${rel(f)} usa confirm()/prompt() do navegador`);
    }
    verificar('sem confirm()/prompt() do navegador', p);
}

// 5. Páginas de aluno/professor carregam a camada de acessibilidade
{
    const p = [];
    for (const f of paginas) {
        const r = rel(f);
        if (!/^(aluno|admin)\//.test(r) && !['index.html', 'login.html', 'privacidade.html', 'termos.html', 'trocar-senha.html'].includes(r)) continue;
        if (!ler(f).includes('/acessibilidade.js')) p.push(`${r} não carrega /acessibilidade.js`);
    }
    verificar('todas as páginas carregam o botão de acessibilidade', p);
}

// 5b. Proteções básicas no cabeçalho de toda página (objetos, <base> e envio de formulários)
{
    const p = [];
    for (const f of paginas) {
        const t = ler(f);
        if (/http-equiv="refresh"/.test(t)) continue; // páginas de redirecionamento
        if (!t.includes('Content-Security-Policy')) p.push(`${rel(f)} sem política de segurança de conteúdo`);
        if (!t.includes('name="referrer"')) p.push(`${rel(f)} sem política de referência`);
    }
    verificar('toda página tem as proteções básicas de cabeçalho', p);
}

// 6. Texto digitado por usuário nunca entra como HTML sem escapar nas telas do aluno
{
    const p = [];
    // Exceção conhecida: as notas têm texto formatado e o servidor sempre o resanitiza (gerenciar-notas).
    const perigosos = /\$\{\s*(?:p|n|c|lab|d|f|r|item|modulo)\.(?:titulo|descricao|nome|pergunta|resposta|conteudo|comentario|problema|instrucoes|mensagem)\s*\}/;
    for (const f of paginas.filter((x) => rel(x).startsWith('aluno/'))) {
        inline(ler(f)).join('\n').split('\n').forEach((linha, i) => {
            if (perigosos.test(linha) && !/escaparHtml|escapar\(|textContent|innerText/.test(linha) && !(rel(f) === 'aluno/notas.html' && /n\.conteudo/.test(linha))) p.push(`${rel(f)}: linha de script ${i + 1} usa dado cru: ${linha.trim().slice(0, 90)}`);
        });
    }
    verificar('telas do aluno escapam o texto vindo do servidor', p);
}

// 7. Chaves secretas nunca no site publicado
{
    const p = [];
    for (const f of paginas.concat(scripts, listar(RAIZ, ['.json', '.txt']))) {
        const txt = ler(f);
        if (/service_role|sb_secret_|SUPABASE_SERVICE/.test(txt)) p.push(`${rel(f)} menciona chave de serviço`);
        if (/eyJ[A-Za-z0-9_-]{20,}\.eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/.test(txt)) {
            try {
                const carga = JSON.parse(Buffer.from(txt.match(/eyJ[A-Za-z0-9_-]{20,}\.(eyJ[A-Za-z0-9_-]{20,})\./)[1], 'base64url').toString());
                if (carga.role && carga.role !== 'anon') p.push(`${rel(f)} contém token com papel "${carga.role}"`);
            } catch { /* não era um JWT legível */ }
        }
    }
    verificar('nenhuma chave secreta no site', p);
}

// 8. Política de privacidade e termos continuam publicados e identificam o controlador
{
    const p = [];
    const priv = fs.existsSync(path.join(RAIZ, 'privacidade.html')) ? ler(path.join(RAIZ, 'privacidade.html')) : '';
    if (!priv) p.push('privacidade.html não existe');
    if (priv && !/LGPD|13\.709/.test(priv)) p.push('a política de privacidade não cita a LGPD');
    if (!fs.existsSync(path.join(RAIZ, 'termos.html'))) p.push('termos.html não existe');
    verificar('política de privacidade e termos publicados', p);
}

console.log(`\n${total - falhas} de ${total} verificações passaram.`);
process.exit(falhas ? 1 : 0);
