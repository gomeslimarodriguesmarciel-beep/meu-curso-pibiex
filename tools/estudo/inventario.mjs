// Inventário da arquitetura de informação do site: páginas, links, profundidade, órfãs, rótulos e inconsistências.
//   node tools/estudo/inventario.mjs            -> resumo legível
//   node tools/estudo/inventario.mjs --json     -> dados completos em JSON
// Só lê arquivos do projeto: não faz rede e não toca em dados reais.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const IGNORAR = new Set(['node_modules', '.git', 'supabase', 'tools', 'vendor', 'img', 'fonts', '.github']);

function listar(pasta, acc = []) {
    for (const e of fs.readdirSync(pasta, { withFileTypes: true })) {
        if (IGNORAR.has(e.name)) continue;
        const c = path.join(pasta, e.name);
        if (e.isDirectory()) listar(c, acc); else if (e.name.endsWith('.html')) acc.push(c);
    }
    return acc;
}
const rel = (f) => path.relative(RAIZ, f).replaceAll('\\', '/');
const limpa = (t) => String(t || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

const arquivos = listar(RAIZ);
const paginas = {};
for (const f of arquivos) {
    const r = rel(f);
    const t = fs.readFileSync(f, 'utf8');
    const area = r.startsWith('aluno/') ? 'aluno' : r.startsWith('admin/') ? 'admin' : r.startsWith('demo/') ? 'demo' : 'publica';
    const redireciona = /http-equiv="refresh"/.test(t);
    const titulo = limpa((t.match(/<title>([\s\S]*?)<\/title>/) || [])[1]);
    const h1 = limpa((t.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1]);
    const links = [];
    for (const m of t.matchAll(/<a\b[^>]*\bhref="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)) {
        const href = m[1];
        if (/^(mailto:|tel:|javascript:|data:)/.test(href) || href.includes('${')) continue; // endereços montados em JavaScript não são links fixos
        links.push({ href, texto: limpa(m[2]) || '(sem texto)' });
    }
    // itens de menu que ficam em JavaScript (shell.js): lidos à parte
    paginas[r] = { arquivo: r, area, redireciona, titulo, h1, links, tamanho: t.length };
}

// menus dos shells
function menuDoShell(arq, nome) {
    const t = fs.readFileSync(path.join(RAIZ, arq), 'utf8');
    const bloco = t.slice(t.indexOf(nome));
    const grupos = [];
    for (const g of bloco.matchAll(/rotulo:\s*'([^']+)',\s*itens:\s*\[([\s\S]*?)\],\s*\}/g)) {
        const itens = [...g[2].matchAll(/label:\s*'([^']+)',\s*href:\s*'([^']+)'/g)].map((m) => ({ rotulo: m[1], href: m[2] }));
        grupos.push({ rotulo: g[1], itens });
    }
    return grupos;
}
const menuAluno = menuDoShell('aluno/shell.js', 'GRUPOS_MENU');
const menuEquipe = menuDoShell('admin/shell.js', 'GRUPOS_MENU_EQUIPE');

// resolve um href relativo a uma página
function alvoDe(de, href) {
    const limpo = href.split('#')[0].split('?')[0];
    if (!limpo || /^https?:/.test(limpo)) return null;
    let alvo = limpo.startsWith('/') ? limpo.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(de), limpo));
    if (alvo === '' || alvo.endsWith('/')) alvo += 'index.html';
    if (!alvo.endsWith('.html') && fs.existsSync(path.join(RAIZ, alvo, 'index.html'))) alvo += '/index.html';
    return alvo;
}

// grafo (links do HTML + itens dos menus de JavaScript)
const arestas = [];
for (const p of Object.values(paginas)) {
    for (const l of p.links) { const a = alvoDe(p.arquivo, l.href); if (a) arestas.push({ de: p.arquivo, para: a, texto: l.texto, href: l.href }); }
}
for (const p of Object.values(paginas)) {
    const menu = p.area === 'aluno' ? menuAluno : p.area === 'admin' ? menuEquipe : [];
    for (const g of menu) for (const i of g.itens) { const a = alvoDe(p.arquivo, i.href); if (a) arestas.push({ de: p.arquivo, para: a, texto: i.rotulo, href: i.href, menu: true }); }
}

// o menu da conta (no shell.js) leva ao perfil
for (const p of Object.values(paginas)) {
    if (p.area === 'aluno') arestas.push({ de: p.arquivo, para: 'aluno/perfil.html', texto: 'Meu Perfil', href: 'perfil.html', menu: true });
    if (p.area === 'admin') arestas.push({ de: p.arquivo, para: 'admin/perfil.html', texto: 'Meu Perfil', href: 'perfil.html', menu: true });
}
const mortos = arestas.filter((a) => !paginas[a.para] && !fs.existsSync(path.join(RAIZ, a.para)));
const entrada = {};
arestas.forEach((a) => { (entrada[a.para] = entrada[a.para] || new Set()).add(a.de); });

// profundidade (cliques) a partir de uma origem
function profundidade(origens) {
    const dist = {};
    const fila = [...origens];
    origens.forEach((o) => { dist[o] = 0; });
    while (fila.length) {
        const u = fila.shift();
        arestas.filter((a) => a.de === u).forEach((a) => { if (paginas[a.para] && dist[a.para] === undefined) { dist[a.para] = dist[u] + 1; fila.push(a.para); } });
    }
    return dist;
}
const distIndex = profundidade(['index.html']);
const distLogin = profundidade(['login.html']);

// rótulos diferentes para o mesmo destino
const rotulosPorDestino = {};
arestas.forEach((a) => { if (!paginas[a.para]) return; (rotulosPorDestino[a.para] = rotulosPorDestino[a.para] || new Map()).set(a.texto, (rotulosPorDestino[a.para].get(a.texto) || 0) + 1); });

const relatorio = {
    totais: { paginas: Object.keys(paginas).length, links: arestas.length, mortos: mortos.length },
    porArea: Object.values(paginas).reduce((o, p) => { o[p.area] = (o[p.area] || 0) + 1; return o; }, {}),
    menuAluno, menuEquipe,
    paginas: Object.values(paginas).map((p) => ({
        arquivo: p.arquivo, area: p.area, redireciona: p.redireciona, titulo: p.titulo, h1: p.h1,
        linksDeSaida: p.links.length, linksDeEntrada: (entrada[p.arquivo] || new Set()).size,
        cliquesDoIndex: distIndex[p.arquivo] ?? null, cliquesDoLogin: distLogin[p.arquivo] ?? null,
    })),
    mortos: mortos.map((m) => `${m.de} -> ${m.href}`),
    rotulosVariados: Object.entries(rotulosPorDestino).filter(([, m]) => m.size > 1).map(([alvo, m]) => ({ alvo, rotulos: [...m.entries()].map(([t, n]) => `${t} (${n})`) })),
    orfas: Object.values(paginas).filter((p) => !p.redireciona && !(entrada[p.arquivo] || new Set()).size && p.arquivo !== 'index.html').map((p) => p.arquivo),
};

if (process.argv.includes('--json')) { console.log(JSON.stringify(relatorio, null, 2)); process.exit(0); }

console.log(`\nPáginas: ${relatorio.totais.paginas} (${Object.entries(relatorio.porArea).map(([k, v]) => `${k}: ${v}`).join(', ')}) · Links: ${relatorio.totais.links} · Links quebrados: ${relatorio.totais.mortos}`);
console.log('\n== Menu do aluno');
menuAluno.forEach((g) => console.log(`  ${g.rotulo} (${g.itens.length}): ${g.itens.map((i) => i.rotulo).join(' · ')}`));
console.log('\n== Menu da equipe');
menuEquipe.forEach((g) => console.log(`  ${g.rotulo} (${g.itens.length}): ${g.itens.map((i) => i.rotulo).join(' · ')}`));
console.log('\n== Título da aba x título da página (h1) x rótulo no menu');
for (const p of relatorio.paginas.filter((x) => !x.redireciona && (x.area === 'aluno' || x.area === 'admin'))) {
    const menu = (p.area === 'aluno' ? menuAluno : menuEquipe).flatMap((g) => g.itens).find((i) => alvoDe(p.arquivo, i.href) === p.arquivo);
    const igual = menu && p.h1 && menu.rotulo.toLowerCase() === p.h1.toLowerCase();
    console.log(`  ${igual ? 'ok ' : '!! '} ${p.arquivo.padEnd(28)} menu: ${(menu ? menu.rotulo : '—').padEnd(22)} h1: ${p.h1 || '—'}`);
}
console.log('\n== Cliques a partir do index (páginas públicas)');
relatorio.paginas.filter((p) => p.area !== 'aluno' && p.area !== 'admin' && !p.redireciona).forEach((p) => console.log(`  ${String(p.cliquesDoIndex ?? '—').padStart(2)}  ${p.arquivo}  (links de entrada: ${p.linksDeEntrada})`));
console.log('\n== Rótulos diferentes para o mesmo destino');
relatorio.rotulosVariados.filter((r) => !/^(aluno|admin)\//.test(r.alvo) || r.rotulos.length > 2).forEach((r) => console.log(`  ${r.alvo}: ${r.rotulos.join(' | ')}`));
console.log('\n== Páginas órfãs (nenhum link aponta para elas):', relatorio.orfas.join(', ') || 'nenhuma');
console.log('== Links quebrados:', relatorio.mortos.join('; ') || 'nenhum');
