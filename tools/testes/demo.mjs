// Testa a lógica da demonstração pública (demo/falso.js) fora do navegador, sem rede e sem dados reais.
//   node tools/testes/demo.mjs
import fs from 'node:fs';
import path from 'node:path';

// o módulo guarda o estado em sessionStorage: aqui, uma memória simples
const memoria = new Map();
globalThis.sessionStorage = { getItem: (k) => (memoria.has(k) ? memoria.get(k) : null), setItem: (k, v) => memoria.set(k, String(v)), removeItem: (k) => memoria.delete(k) };

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
// o arquivo é um módulo do navegador (.js sem package.json): carregamos como módulo de dados
const codigo = fs.readFileSync(path.join(raiz, 'demo', 'falso.js'), 'utf8');
const { fetchDemo } = await import('data:text/javascript;base64,' + Buffer.from(codigo).toString('base64'));

let falhas = 0, total = 0;
function confere(nome, ok, detalhe) {
    total++;
    if (ok) { console.log('  ok     ' + nome); return; }
    falhas++; console.log('  FALHA  ' + nome + (detalhe ? '\n           - ' + detalhe : ''));
}
const chamar = async (funcao, corpo) => (await fetchDemo(`https://x.supabase.co/functions/v1/${funcao}`, { body: JSON.stringify(corpo) })).json();
const tabela = async (nome) => (await fetchDemo(`https://x.supabase.co/rest/v1/${nome}?select=*`, {})).json();

// ---- atividades: a aluna envia, o professor vê e corrige, a aluna vê a nota
let r = await chamar('enviar-trabalho', { acao: 'enviar', atividadeId: 'A1', respostaTexto: 'Minha resposta' });
confere('aluna envia a atividade', !!r.trabalho && r.trabalho.status === 'enviado', JSON.stringify(r));
r = await chamar('enviar-trabalho', { acao: 'enviar', atividadeId: 'A1', respostaTexto: 'de novo' });
confere('não aceita um segundo envio', !!r.erro);
r = await chamar('corrigir-trabalho', { acao: 'listar' });
const envioLia = r.atividades.find((a) => a.id === 'A1').envios.find((e) => e.alunoNome === 'Lia Exemplo');
confere('professor vê o trabalho da aluna', !!envioLia);
await chamar('corrigir-trabalho', { acao: 'corrigir', trabalhoId: envioLia.id, nota: '9', feedback: 'Muito bom!', horasConcedidas: 2 });
r = await chamar('enviar-trabalho', { acao: 'listar' });
const meu = r.trabalhos.find((t) => t.atividade_id === 'A1');
confere('aluna vê a nota e o comentário', meu && meu.status === 'avaliado' && meu.nota === 9 && meu.feedback_professor === 'Muito bom!');
r = await chamar('admin-pendencias', {});
confere('contagem de trabalhos para corrigir diminui', r.trabalhos === 2, JSON.stringify(r));

// ---- frequência
r = await chamar('frequencia', { acao: 'disponivel' });
confere('sem chamada aberta, nada aparece', r.chamada === null);
const aberta = await chamar('gerenciar-chamadas', { acao: 'criar', titulo: 'Aula de teste', horas: 2, duracaoMinutos: 10 });
r = await chamar('frequencia', { acao: 'disponivel' });
confere('a chamada aparece para a aluna', r.chamada && r.chamada.titulo === 'Aula de teste');
r = await chamar('frequencia', { acao: 'registrar', chamadaId: aberta.chamada.id, pin: '0000' });
confere('código errado é recusado', !!r.erro);
r = await chamar('frequencia', { acao: 'registrar', chamadaId: aberta.chamada.id, pin: aberta.chamada.pin });
confere('código certo registra a presença', r.ok === true);
r = await chamar('frequencia', { acao: 'historico' });
confere('horas entram no histórico (3 aulas + 2 h da chamada + 1 h e 2 h de atividades)', r.totalHoras === 3 + 2 + 1 + 2, String(r.totalHoras));

// ---- enquete
r = await chamar('enquetes-aluno', { acao: 'acompanhar' });
confere('antes de votar o resultado não aparece', r.enquetes.length === 0);
await chamar('enquetes-aluno', { acao: 'votar', enqueteId: 'E1', respostas: [{ perguntaId: 'p1', opcoes: ['b'] }] });
r = await chamar('gerenciar-enquetes', { acao: 'resultados', enqueteId: 'E1' });
confere('voto da aluna soma na apuração do professor', r.votos === 8, String(r.votos));

// ---- desafios
const antes = (await chamar('enviar-desafio', { acao: 'painel' })).eu.pontos;
r = await chamar('enviar-desafio', { acao: 'enviar', desafioId: 'd4', linkOuArquivo: 'https://exemplo.com/img' });
confere('envio de desafio com link', r.enviado === true);
r = await chamar('enviar-desafio', { acao: 'enviar', desafioId: 'd4', linkOuArquivo: 'texto-sem-link' });
confere('recusa resposta que não é link', !!r.erro);
const lista = (await chamar('gerenciar-desafios', { acao: 'listar' })).desafios.find((d) => d.id === 'd4');
const env = lista.envios.find((e) => e.alunoNome === 'Lia Exemplo');
await chamar('gerenciar-desafios', { acao: 'avaliar', envioId: env.id, pontos: 10, feedback: 'Ótimo' });
const depois = (await chamar('enviar-desafio', { acao: 'painel' })).eu.pontos;
confere('pontos do desafio aumentam o total da aluna', depois === antes + 10, `${antes} -> ${depois}`);

// ---- notas, galeria, chat, avisos
await chamar('gerenciar-notas', { acao: 'criar', titulo: 'Teste', conteudo: '<div>oi</div>' });
let notas = (await chamar('gerenciar-notas', { acao: 'listar' })).notas;
confere('nova nota aparece', notas.some((n) => n.titulo === 'Teste'));
await chamar('gerenciar-notas', { acao: 'excluir', notaId: notas.find((n) => n.titulo === 'Teste').id });
notas = (await chamar('gerenciar-notas', { acao: 'listar' })).notas;
confere('nota apagada some', !notas.some((n) => n.titulo === 'Teste'));

await chamar('galeria', { acao: 'postar', titulo: 'Meu projeto', descricao: 'ok' });
let proj = (await chamar('galeria', { acao: 'listar' })).projetos;
const meuProj = proj.find((p) => p.titulo === 'Meu projeto');
await chamar('galeria', { acao: 'curtir', projetoId: proj[1].id });
await chamar('galeria', { acao: 'comentar', projetoId: meuProj.id, comentario: 'Gostei' });
proj = (await chamar('galeria', { acao: 'listar' })).projetos;
confere('projeto publicado, curtida e comentário', proj.some((p) => p.titulo === 'Meu projeto' && p.comentarios.length === 1) && proj.some((p) => p.euCurti));

await chamar('chat-turma', { acao: 'enviar', mensagem: 'Olá, turma!' });
const msgs = (await chamar('chat-turma', { acao: 'listar' })).mensagens;
confere('mensagem do chat aparece como minha', msgs.some((m) => m.mensagem === 'Olá, turma!' && m.souEu));

await chamar('gerenciar-avisos', { acao: 'criar', titulo: 'Aviso novo', mensagem: 'Teste' });
const avisos = (await chamar('avisos-aluno', { acao: 'listar' })).avisos;
confere('aviso criado pelo professor aparece para a aluna', avisos.some((a) => a.titulo === 'Aviso novo'));

// ---- leituras e limites
confere('atividades vêm da tabela simulada', (await tabela('atividades')).length === 3);
confere('módulos com aulas', (await fetchDemo('https://x.supabase.co/rest/v1/modulos?select=id,aulas(id)', {}).then((x) => x.json())).length === 3);
r = await chamar('enviar-trabalho', { acao: 'gerar_url_upload', atividadeId: 'A1', nomeArquivo: 'a.pdf' });
confere('envio de arquivo está desligado na demonstração', !!r.erro);
r = await chamar('assistente-ia', { mensagem: 'como escrever um bom prompt?' });
confere('assistente responde com exemplo', /papel/i.test(r.resposta));
const desconhecida = await chamar('funcao-que-nao-existe', { acao: 'x' });
confere('função desconhecida não quebra', typeof desconhecida === 'object');
const fora = await fetchDemo('https://qualquer-lugar.exemplo/arquivo', {});
confere('endereços de fora nunca vão para a rede', (await fora.json()) && fora.status === 200);

console.log(`\n${total - falhas} de ${total} verificações da demonstração passaram.`);
process.exit(falhas ? 1 : 0);
