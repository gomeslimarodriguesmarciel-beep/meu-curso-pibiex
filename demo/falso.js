// /demo/falso.js — servidor de demonstração que roda INTEIRO no navegador de quem visita.
//
// Quando a pessoa entra em /demo/, as telas reais da plataforma passam a falar com este arquivo no lugar do
// banco de dados. Resultado: nenhum dado sai do aparelho, nada é gravado no servidor e nenhum dado real de aluno
// aparece. O que a pessoa faz fica só nesta aba (sessionStorage) e some quando ela fecha a aba ou sai da demonstração.
//
// Carregado apenas quando existe a marca "pibiex_demo" na sessão da aba (ver aluno/shell.js e admin/shell.js).

const ME = { id: 'demo-aluno', nome: 'Lia Exemplo' };
const PROF = { id: 'demo-prof', nome: 'Professor Demonstração' };
const CHAVE = 'pibiex_demo_estado';
const NIVEIS = [{ min: 0, nome: 'Iniciante' }, { min: 50, nome: 'Explorador' }, { min: 150, nome: 'Praticante' }, { min: 300, nome: 'Avançado' }, { min: 500, nome: 'Mestre' }];

const agora = () => Date.now();
const iso = (ms) => new Date(ms).toISOString();
const hAtras = (h) => iso(agora() - h * 3600e3);
const dia = (n) => iso(agora() + n * 86400e3);
const dataCurta = (n) => iso(agora() + n * 86400e3).slice(0, 10);
const uid = (p) => p + Math.random().toString(36).slice(2, 9);

const PARES = [
    { id: 'par1', nome: 'Marina Exemplo' }, { id: 'par2', nome: 'Caio Exemplo' }, { id: 'par3', nome: 'Sofia Exemplo' },
    { id: 'par4', nome: 'Davi Exemplo' }, { id: 'par5', nome: 'Helena Exemplo' },
];

// ---------------------------------------------------------------- dados que não mudam
const MODULOS_AULAS = () => [
    { id: 'M1', titulo: 'INTRODUÇÃO À INTELIGÊNCIA ARTIFICIAL', descricao: 'Primeiros passos e conceitos', ordem: 1, aulas: [
        { id: 'u1', titulo: 'Boas-vindas e como usar a plataforma', data_aula: dataCurta(-21), horario_inicio: '18:30:00', horario_fim: '19:30:00', ordem: 1 },
        { id: 'u2', titulo: 'O que é IA, de verdade?', data_aula: dataCurta(-14), horario_inicio: '18:30:00', horario_fim: '19:30:00', ordem: 2 },
        { id: 'u3', titulo: 'Como escrever bons prompts', data_aula: dataCurta(-7), horario_inicio: '18:30:00', horario_fim: '19:30:00', ordem: 3 } ] },
    { id: 'M2', titulo: 'IA NA PRÁTICA', descricao: 'Pesquisa, texto, imagem e projetos', ordem: 2, aulas: [
        { id: 'u4', titulo: 'Pesquisa com o Perplexity', data_aula: dataCurta(2), horario_inicio: '18:30:00', horario_fim: '19:30:00', ordem: 1 },
        { id: 'u5', titulo: 'Estudando com o NotebookLM', data_aula: dataCurta(9), horario_inicio: '18:30:00', horario_fim: '19:30:00', ordem: 2 },
        { id: 'u6', titulo: 'Criando imagens com IA', data_aula: dataCurta(16), horario_inicio: '18:30:00', horario_fim: '19:30:00', ordem: 3 } ] },
    { id: 'M3', titulo: 'PROJETO FINAL', descricao: 'Apresentação dos trabalhos', ordem: 3, aulas: [
        { id: 'u7', titulo: 'Apresentação dos projetos', data_aula: dataCurta(30), horario_inicio: '18:30:00', horario_fim: '20:00:00', ordem: 1 } ] },
];
const MODULOS_CONTEUDO = () => [
    { id: 'M1', titulo: 'INTRODUÇÃO À INTELIGÊNCIA ARTIFICIAL', descricao: 'Primeiros passos e conceitos', ordem: 1, conteudos: [
        { id: 'k1', modulo_id: 'M1', titulo: 'Guia rápido: como escrever um bom prompt', tipo: 'pdf', url: null, descricao: 'Slides da aula 3, para ler na plataforma', ordem: 1, arquivo_caminho: 'demo/guia-de-prompts.pdf', arquivo_nome: 'guia-de-prompts.pdf', arquivo_tipo: 'application/pdf', arquivo_tamanho: 11031, permite_baixar: true },
        { id: 'k2', modulo_id: 'M1', titulo: 'Vídeo: o que é inteligência artificial', tipo: 'video', url: 'https://www.youtube.com/', descricao: 'Link externo', ordem: 2, arquivo_caminho: null, arquivo_nome: null, arquivo_tipo: null, arquivo_tamanho: null, permite_baixar: false } ] },
    { id: 'M2', titulo: 'IA NA PRÁTICA', descricao: 'Pesquisa, texto, imagem e projetos', ordem: 2, conteudos: [
        { id: 'k3', modulo_id: 'M2', titulo: 'Roteiro da aula de pesquisa com IA', tipo: 'slide', url: null, descricao: null, ordem: 1, arquivo_caminho: 'demo/guia-de-prompts.pdf', arquivo_nome: 'roteiro-pesquisa.pdf', arquivo_tipo: 'application/pdf', arquivo_tamanho: 11031, permite_baixar: true },
        { id: 'k4', modulo_id: 'M2', titulo: 'Perplexity: guia oficial', tipo: 'link', url: 'https://www.perplexity.ai/', descricao: null, ordem: 2, arquivo_caminho: null, arquivo_nome: null, arquivo_tipo: null, arquivo_tamanho: null, permite_baixar: false } ] },
    { id: 'M3', titulo: 'PROJETO FINAL', descricao: 'Apresentação dos trabalhos', ordem: 3, conteudos: [] },
];
const PROMPTS = [
    { id: 'pr1', categoria: 'Para qualquer IA', titulo: 'Modelo básico: Papel, Objetivo, Contexto, Formato', conteudo: 'PAPEL: [Quem a IA deve ser. Ex.: "um professor de história paciente"]\nOBJETIVO: [O que eu quero conseguir]\nCONTEXTO: [O que a IA precisa saber: idade, nível, prazo, material que tenho]\nTAREFA: [O que exatamente ela deve fazer, em passos]\nFORMATO: [Como quero a resposta: lista, tabela, tamanho]\nREGRAS: [O que ela deve ou não fazer. Ex.: "não invente dados"]' },
    { id: 'pr2', categoria: 'Perplexity', titulo: 'Pesquisa com fontes confiáveis', conteudo: 'PAPEL: Você é um pesquisador cuidadoso que só afirma o que consegue comprovar.\nOBJETIVO: Entender [TEMA] para um trabalho escolar.\nTAREFA: Explique o assunto em 5 pontos principais, com dados atuais.\nFORMATO: Um parágrafo curto por ponto, com a fonte logo depois.\nREGRAS: Priorize sites de universidades, órgãos públicos e veículos conhecidos. Diga a data de cada fonte.' },
    { id: 'pr3', categoria: 'NotebookLM', titulo: 'Guia de estudo com perguntas e respostas', conteudo: 'PAPEL: Você é um professor que prepara estudantes para uma prova.\nOBJETIVO: Criar um guia de estudo a partir das fontes deste caderno.\nTAREFA: Gere 10 perguntas de revisão (misture fáceis e difíceis) e, ao final, as respostas curtas.\nFORMATO: Lista numerada de perguntas; depois uma seção "Respostas".\nREGRAS: Baseie-se somente nas fontes. Cite a fonte de cada resposta.' },
    { id: 'pr4', categoria: 'ChatGPT', titulo: 'Explicar como se eu tivesse 12 anos', conteudo: 'PAPEL: Você é um professor que explica com exemplos do dia a dia.\nCONTEXTO: Tenho dificuldade em entender [ASSUNTO].\nTAREFA: Explique de forma simples, usando uma analogia com [ALGO QUE EU GOSTO, ex.: futebol].\nFORMATO: Explicação em até 150 palavras, depois 3 perguntas para eu testar se entendi.' },
    { id: 'pr5', categoria: 'Gemini', titulo: 'Criar um quiz para a turma', conteudo: 'PAPEL: Você é um professor que adora jogos de perguntas.\nOBJETIVO: Criar um quiz divertido sobre [TEMA] para minha turma.\nTAREFA: Faça 8 perguntas de múltipla escolha (A, B, C, D) com gabarito.\nREGRAS: Nível adequado a [IDADE/SÉRIE]. Apenas uma alternativa correta.' },
    { id: 'pr6', categoria: 'Claude', titulo: 'Tutor que me faz pensar', conteudo: 'PAPEL: Você é um tutor socrático: ajuda a pensar, não entrega a resposta pronta.\nCONTEXTO: Estou com dificuldade neste exercício: [COLE O EXERCÍCIO].\nTAREFA: Guie-me com perguntas, uma de cada vez, até eu chegar à resposta.\nREGRAS: Só mostre a resposta completa se eu pedir depois de tentar pelo menos duas vezes.' },
];
const LABS = [
    { id: 'L1', titulo: 'Resuma um texto em 5 tópicos', problema: 'Escolha uma notícia ou um trecho de livro com pelo menos 3 parágrafos. Peça a uma IA que resuma em 5 tópicos curtos.', instrucoes: 'Envie o prompt que você usou e o resumo que a IA devolveu.', dificuldade: 'facil', criado_em: '2026-10-01T10:00:00Z' },
    { id: 'L2', titulo: 'Explique um assunto de dois jeitos', problema: 'Escolha um assunto da escola que você acha difícil. Peça uma explicação para uma criança de 10 anos e outra para um adulto.', instrucoes: 'Envie as duas explicações e diga qual ajudou mais.', dificuldade: 'facil', criado_em: '2026-10-05T10:00:00Z' },
    { id: 'L3', titulo: 'Compare duas IAs', problema: 'Faça a mesma pergunta ao ChatGPT e ao Claude (ou Gemini). Compare as respostas.', instrucoes: 'Diga qual é mais clara, qual é mais correta e por quê.', dificuldade: 'medio', criado_em: '2026-10-10T10:00:00Z' },
    { id: 'L4', titulo: 'Descubra o erro da IA', problema: 'Peça a uma IA 5 fatos sobre sua cidade. Confira cada um em uma fonte confiável.', instrucoes: 'Marque quais estavam certos e como você conferiu.', dificuldade: 'dificil', criado_em: '2026-10-12T10:00:00Z' },
];
const FERRAMENTAS = [
    { id: 'fe1', nome: 'ChatGPT', categoria: 'Texto e conversa', descricao: 'Conversa, escrita e ajuda com ideias.', url: 'https://chatgpt.com', ordem: 1 },
    { id: 'fe2', nome: 'Gemini', categoria: 'Texto e conversa', descricao: 'Assistente do Google, bom para imagens e documentos.', url: 'https://gemini.google.com', ordem: 2 },
    { id: 'fe3', nome: 'Claude', categoria: 'Texto e conversa', descricao: 'Ótimo para textos longos e análise.', url: 'https://claude.ai', ordem: 3 },
    { id: 'fe4', nome: 'Perplexity', categoria: 'Pesquisa', descricao: 'Pesquisa com fontes citadas.', url: 'https://www.perplexity.ai', ordem: 4 },
    { id: 'fe5', nome: 'NotebookLM', categoria: 'Estudo', descricao: 'Estude a partir dos seus próprios materiais.', url: 'https://notebooklm.google', ordem: 5 },
    { id: 'fe6', nome: 'Canva', categoria: 'Imagem e design', descricao: 'Design com recursos de IA.', url: 'https://www.canva.com', ordem: 6 },
];
const FAQ = [
    { id: 'f1', pergunta: 'Como registro minha presença?', resposta: 'Quando o professor abrir a chamada, aparece um aviso no topo da tela. Digite o código (PIN) que ele falar em sala e toque em "Registrar presença".', ordem: 1 },
    { id: 'f2', pergunta: 'Posso enviar a atividade mais de uma vez?', resposta: 'Não. Cada atividade aceita uma única resposta, então revise antes de enviar.', ordem: 2 },
    { id: 'f3', pergunta: 'Esqueci minha senha. E agora?', resposta: 'Use "Esqueci usuário/senha" na tela de login ou fale com o professor.', ordem: 3 },
    { id: 'f4', pergunta: 'A IA pode errar?', resposta: 'Pode, e erra com confiança. Por isso peça as fontes e confira as informações importantes.', ordem: 4 },
];
const RECURSOS = [
    { id: 'r1', titulo: 'Guia: como escrever um bom prompt', tipo: 'ebook', url: null, descricao: 'Material de apoio para ler aqui ou baixar', ordem: 1, arquivo_caminho: 'demo/guia-de-prompts.pdf', arquivo_nome: 'guia-de-prompts.pdf', arquivo_tamanho: 11031, permite_baixar: true },
    { id: 'r2', titulo: 'Curso gratuito: IA para iniciantes', tipo: 'video', url: 'https://www.youtube.com/', descricao: 'Playlist com aulas curtas', ordem: 2, arquivo_caminho: null, permite_baixar: false },
    { id: 'r3', titulo: 'Blog de novidades em IA', tipo: 'site', url: 'https://www.perplexity.ai/', descricao: 'Atualizações semanais', ordem: 3, arquivo_caminho: null, permite_baixar: false },
];
const ATIVIDADES = () => [
    { id: 'A1', titulo: 'IA na Prática: Pesquisa com o Perplexity', descricao: 'Escolha UM dos três temas abaixo e pesquise usando o Perplexity:\n1) Como a IA ajuda a estudar para o ENEM\n2) Riscos e cuidados ao usar IA\n3) Uma profissão que a IA está mudando\n\nResponda com: o tema escolhido, o que você descobriu (3 a 5 linhas) e os links das fontes que você conferiu.', data_entrega: dia(2), horas_maximas: 3, criado_em: hAtras(70), modulo_id: 'M2', modulos: { titulo: 'IA NA PRÁTICA', turma_id: 'T1' } },
    { id: 'A2', titulo: 'Atividade 1: O que é IA?', descricao: 'Explique com suas palavras o que é inteligência artificial e dê um exemplo do seu dia a dia.', data_entrega: dia(-12), horas_maximas: null, criado_em: hAtras(24 * 20), modulo_id: 'M1', modulos: { titulo: 'INTRODUÇÃO À INTELIGÊNCIA ARTIFICIAL', turma_id: 'T1' } },
    { id: 'A3', titulo: 'Diagnóstico inicial', descricao: 'Conte o que você já sabe sobre IA e o que espera aprender no curso.', data_entrega: null, horas_maximas: 1, criado_em: hAtras(24 * 28), modulo_id: 'M1', modulos: { titulo: 'INTRODUÇÃO À INTELIGÊNCIA ARTIFICIAL', turma_id: 'T1' } },
];

// ---------------------------------------------------------------- estado (muda durante a demonstração)
function novoEstado() {
    const env = (id, atv, quem, nome, st, nota, quando, texto, fb, horas) => ({ id, atividade_id: atv, aluno_id: quem, alunoNome: nome, status: st, nota, feedback_professor: fb || null, horas_concedidas: horas ?? null, enviado_em: quando, resposta_texto: texto, comentario_aluno: null, arquivo_url: null });
    return {
        envios: [
            env('t1', 'A1', 'par1', 'Marina Exemplo', 'enviado', null, hAtras(2), 'Escolhi o tema 1. Pesquisei no Perplexity como a IA ajuda a estudar: ela resume textos, cria simulados e explica o que não entendi. Conferi duas fontes e as duas concordam. Fontes: https://exemplo.com/estudo-com-ia'),
            env('t2', 'A1', 'par2', 'Caio Exemplo', 'enviado', null, hAtras(26), 'Tema 3. A profissão que mais muda é a de designer, porque a IA gera imagens rápido. Mas ainda precisa de alguém com bom gosto para escolher.'),
            env('t3', 'A1', 'par3', 'Sofia Exemplo', 'avaliado', 9, hAtras(50), 'Tema 2: riscos. O maior risco é acreditar em tudo o que a IA diz. Sempre peço as fontes e abro pelo menos duas.', 'Ótima pesquisa e boas fontes.', 3),
            env('t4', 'A2', ME.id, ME.nome, 'avaliado', 8.5, hAtras(24 * 13), 'IA é quando um computador aprende com exemplos para resolver problemas, como o corretor do celular que adivinha a próxima palavra.', 'Boa definição! Faltou só mais um exemplo do dia a dia.', null),
            env('t5', 'A3', ME.id, ME.nome, 'avaliado', 10, hAtras(24 * 27), 'Já usei o ChatGPT para tirar dúvidas. Quero aprender a escrever pedidos melhores.', 'Ótimo ponto de partida!', 1),
            env('t6', 'A2', 'par1', 'Marina Exemplo', 'avaliado', 9, hAtras(24 * 13), 'IA é um programa que aprende padrões.', 'Muito bom.', null),
        ],
        avisos: [
            { id: 'av1', turma_id: 'T1', titulo: 'Atividade nova: Pesquisa com o Perplexity', mensagem: 'Pessoal, publiquei uma atividade nova no menu Atividades. Escolham UM dos três temas e pesquisem usando o Perplexity. Qualquer dúvida, chamem no chat da turma.', fixado: false, criado_em: hAtras(3), expira_em: dia(6) },
            { id: 'av2', turma_id: 'T1', titulo: 'Bem-vindos ao curso!', mensagem: 'Leiam o Termo de Uso e explorem a plataforma: cronograma, conteúdo, desafios e o laboratório de IA.', fixado: true, criado_em: hAtras(24 * 28), expira_em: null },
        ],
        dispensados: [],
        enquete: { status: 'aberta', votou: false, a: 3, b: 2, c: 2 },
        chamada: null,
        presencas: [{ titulo: 'Aula 1: Boas-vindas', horas: 1, criadoEm: hAtras(24 * 21) }, { titulo: 'Aula 2: O que é IA?', horas: 1, criadoEm: hAtras(24 * 14) }, { titulo: 'Aula 3: Bons prompts', horas: 1, criadoEm: hAtras(24 * 7) }],
        dEnvios: [
            { id: 'de2', desafio_id: 'd3', aluno_id: ME.id, alunoNome: ME.nome, link: 'https://exemplo.com/meu-resumo', enviado_em: hAtras(24 * 6), pontos: null, feedback: null },
            { id: 'de3', desafio_id: 'd2', aluno_id: ME.id, alunoNome: ME.nome, link: 'https://exemplo.com/meu-prompt', enviado_em: hAtras(24 * 13), pontos: 9, feedback: 'Muito criativo!' },
            { id: 'de4', desafio_id: 'd1', aluno_id: ME.id, alunoNome: ME.nome, link: 'https://exemplo.com/apresentacao', enviado_em: hAtras(24 * 20), pontos: 5, feedback: 'Boa apresentação.' },
            { id: 'de5', desafio_id: 'd4', aluno_id: 'par3', alunoNome: 'Sofia Exemplo', link: 'https://exemplo.com/imagem-sofia', enviado_em: hAtras(5), pontos: null, feedback: null },
        ],
        projetos: [
            { id: 'g1', aluno_id: 'par3', autorNome: 'Sofia Exemplo', titulo: 'Capa de livro feita com IA', descricao: 'Pedi para uma IA de imagens criar a capa de um livro de aventura. Foram 4 tentativas até acertar o prompt.', arquivo_url: null, criado_em: hAtras(30), curtidas: ['par1', 'par2'], comentarios: [{ id: 'gc1', autorNome: 'Marina Exemplo', autor_tipo: 'aluno', comentario: 'Ficou incrível! Qual foi o prompt final?', criado_em: hAtras(28) }] },
            { id: 'g2', aluno_id: 'par2', autorNome: 'Caio Exemplo', titulo: 'Poema sobre o sertão', descricao: 'Escrevi o primeiro verso e pedi para a IA continuar no mesmo estilo.', arquivo_url: null, criado_em: hAtras(80), curtidas: ['par3'], comentarios: [] },
        ],
        notas: [
            { id: 'n1', titulo: 'Ideias de prompt', conteudo: '<div>Sempre pedir <b>exemplos</b> antes de pedir a resposta final.</div>', atualizadoEm: hAtras(48) },
            { id: 'n2', titulo: '', conteudo: '<div>Lembrar de conferir as fontes da pesquisa de sexta.</div>', atualizadoEm: hAtras(20) },
        ],
        chat: [
            { id: 'm1', autorTipo: 'equipe', autorId: PROF.id, autorNome: PROF.nome, mensagem: 'Bom dia, turma! A atividade de pesquisa com o Perplexity já está no menu Atividades.', criadoEm: hAtras(5), reacoes: [{ emoji: '👍', ids: ['par1', 'par2'] }] },
            { id: 'm2', autorTipo: 'aluno', autorId: 'par1', autorNome: 'Marina Exemplo', mensagem: 'Professor, pode ser qualquer um dos três temas?', criadoEm: hAtras(4.5), reacoes: [] },
            { id: 'm3', autorTipo: 'equipe', autorId: PROF.id, autorNome: PROF.nome, mensagem: 'Pode sim, escolham o que mais combina com vocês.', criadoEm: hAtras(4.4), reacoes: [] },
            { id: 'm4', autorTipo: 'aluno', autorId: 'par2', autorNome: 'Caio Exemplo', mensagem: 'Eu vou de profissões que a IA está mudando 😄', criadoEm: hAtras(3), reacoes: [{ emoji: '😂', ids: ['par3'] }] },
        ],
        privado: [{ id: 'pv1', autorTipo: 'equipe', autorId: PROF.id, mensagem: 'Oi, Lia! Qualquer dúvida sobre as atividades, pode falar por aqui.', criadoEm: hAtras(30), reacoes: [] }],
        labEnvios: [{ laboratorio_id: 'L1', texto_resposta: 'Usei o modelo de resumo do banco de prompts e funcionou bem.', arquivo_url: null, criado_em: hAtras(24 * 4) }],
        pedidos: [],
        assistente: 0,
        cronograma: null,
    };
}

let S = null;
function estado() {
    if (S) return S;
    try { const bruto = sessionStorage.getItem(CHAVE); if (bruto) { S = JSON.parse(bruto); return S; } } catch (e) { /* sem armazenamento */ }
    S = novoEstado();
    salvar();
    return S;
}
function salvar() { try { sessionStorage.setItem(CHAVE, JSON.stringify(S)); } catch (e) { /* ok */ } }

// ---------------------------------------------------------------- cálculos reutilizados
function pontosDoAluno() { return estado().dEnvios.filter((e) => e.aluno_id === ME.id && e.pontos != null).reduce((s, e) => s + e.pontos, 0); }
function nivelDe(pontos) {
    let i = 0; NIVEIS.forEach((n, k) => { if (pontos >= n.min) i = k; });
    const prox = NIVEIS[i + 1];
    return { faixa: i + 1, nome: NIVEIS[i].nome, pontosParaProximo: prox ? prox.min - pontos : null };
}
const DESAFIOS = () => [
    { id: 'd4', titulo: 'Desafio 4: Imagem com IA', semana: 4, pontos: 10, dataFim: dataCurta(5), descricao: 'Gere uma imagem com IA, copie o prompt que você usou e explique o que mudou entre a primeira e a última tentativa. Cole o link da imagem.' },
    { id: 'd3', titulo: 'Desafio 3: Resumo com IA', semana: 3, pontos: 10, dataFim: dataCurta(-3), descricao: 'Peça a uma IA um resumo de um texto e compare com o original: o que ela acertou e o que deixou de fora?' },
    { id: 'd2', titulo: 'Desafio 2: Prompt criativo', semana: 2, pontos: 10, dataFim: dataCurta(-10), descricao: 'Crie um prompt com papel, objetivo e formato para gerar uma pequena história.' },
    { id: 'd1', titulo: 'Desafio 1: Apresente-se com IA', semana: 1, pontos: 5, dataFim: dataCurta(-17), descricao: 'Use a IA para escrever uma apresentação sua em 5 linhas e edite do seu jeito.' },
];
function podio(lista) {
    const ord = [...lista].sort((a, b) => b.pontos - a.pontos);
    return ord.map((p, i) => ({ posicao: i + 1, nome: p.nome.split(' ')[0] === ME.nome.split(' ')[0] ? 'Você' : p.nome.split(' ')[0], pontos: p.pontos, souEu: p.id === ME.id }));
}
function painelDesafios() {
    const pts = pontosDoAluno();
    const geral = [...PARES.map((p, i) => ({ id: p.id, nome: p.nome, pontos: [31, 38, 40, 14, 22][i] })), { id: ME.id, nome: ME.nome, pontos: pts }];
    const sem = [{ id: 'par1', nome: 'Marina Exemplo', pontos: 10 }, { id: 'par3', nome: 'Sofia Exemplo', pontos: 9 }, { id: ME.id, nome: ME.nome, pontos: 0 }];
    const p = podio(geral), eu = p.find((x) => x.souEu);
    return {
        eu: { pontos: pts, desafiosFeitos: estado().dEnvios.filter((e) => e.aluno_id === ME.id).length, nivel: nivelDe(pts) },
        semanaAtual: 4,
        rankingSemana: { alguemPontuou: true, totalAlunos: 6, podio: podio(sem).slice(0, 3) },
        rankingGeral: { alguemPontuou: true, totalAlunos: 6, podio: p.slice(0, 3), eu: { posicao: eu.posicao, pontos: eu.pontos } },
        desafios: DESAFIOS().map((d) => {
            const e = estado().dEnvios.find((x) => x.desafio_id === d.id && x.aluno_id === ME.id);
            return { ...d, meuEnvio: e ? { avaliado: e.pontos != null, pontos: e.pontos, feedback: e.feedback, linkOuArquivo: e.link } : null };
        }),
    };
}

// ---------------------------------------------------------------- enquete
const PERGUNTAS = [
    { id: 'p1', ordem: 1, tipo: 'unica', texto: 'Qual tema vamos ver na próxima aula?', obrigatoria: true, opcoes: [{ id: 'a', texto: 'IA e imagens' }, { id: 'b', texto: 'IA e texto' }, { id: 'c', texto: 'IA e dados' }], escalaMax: null, maxEscolhas: null, escala_max: null, max_escolhas: null },
    { id: 'p3', ordem: 2, tipo: 'sim_nao', texto: 'Você gostou da aula de hoje?', obrigatoria: true, opcoes: [{ id: 'sim', texto: 'Sim' }, { id: 'nao', texto: 'Não' }], escalaMax: null, maxEscolhas: null, escala_max: null, max_escolhas: null },
    { id: 'p4', ordem: 3, tipo: 'escala', texto: 'Que nota você dá para a aula?', obrigatoria: true, opcoes: null, escalaMax: 5, maxEscolhas: null, escala_max: 5, max_escolhas: null },
];
function apuracao(comTextos) {
    const E = estado().enquete, v = [E.a, E.b, E.c], total = v.reduce((x, y) => x + y, 0), maior = Math.max(...v);
    const pct = (n) => (total ? Math.round((n / total) * 1000) / 10 : 0);
    const ap = [
        { id: 'p1', ordem: 1, tipo: 'unica', texto: PERGUNTAS[0].texto, obrigatoria: true, totalRespostas: total, opcoes: ['a', 'b', 'c'].map((id, i) => ({ id, texto: PERGUNTAS[0].opcoes[i].texto, votos: v[i], percentual: pct(v[i]), lider: v[i] === maior })) },
        { id: 'p3', ordem: 2, tipo: 'sim_nao', texto: PERGUNTAS[1].texto, obrigatoria: true, totalRespostas: 7, opcoes: [{ id: 'sim', texto: 'Sim', votos: 6, percentual: 85.7, lider: true }, { id: 'nao', texto: 'Não', votos: 1, percentual: 14.3, lider: false }] },
        { id: 'p4', ordem: 3, tipo: 'escala', texto: PERGUNTAS[2].texto, obrigatoria: true, totalRespostas: 7, escala: { max: 5, media: 4.3, distribuicao: [0, 0, 1, 3, 3].map((x, i) => ({ nota: i + 1, votos: x })) } },
    ];
    return ap;
}
const resumoEnquete = () => ({ id: 'E1', titulo: 'Qual tema da próxima aula?', status: estado().enquete.status, encerraEm: null, votos: estado().enquete.a + estado().enquete.b + estado().enquete.c, totalAlunos: 8, perguntas: apuracao(false), anonima: true });

// ---------------------------------------------------------------- respostas por função
const ok = { ok: true };
const NAO_NA_DEMO = { erro: 'Nesta demonstração o envio de arquivos está desligado. Cole um link ou escreva o texto.' };

function chatDe(souProf) {
    return estado().chat.map((m) => ({
        id: m.id, autorTipo: m.autorTipo, autorId: m.autorId, autorNome: m.autorNome, autorFotoUrl: null,
        souEu: souProf ? m.autorTipo === 'equipe' : m.autorId === ME.id, mensagem: m.apagada ? null : m.mensagem, apagada: !!m.apagada,
        criadoEm: m.criadoEm, editada: !!m.editada, anexo: null,
        reacoes: (m.reacoes || []).map((r) => ({ emoji: r.emoji, total: r.ids.length, souEu: r.ids.includes(souProf ? PROF.id : ME.id) })),
        podeEditar: souProf ? m.autorTipo === 'equipe' : m.autorId === ME.id, podeApagar: souProf ? true : m.autorId === ME.id,
    }));
}
function reagirEm(lista, b, quem) {
    const m = lista.find((x) => x.id === b.mensagemId); if (!m) return;
    m.reacoes = m.reacoes || [];
    let r = m.reacoes.find((x) => x.emoji === b.emoji);
    if (!r) { r = { emoji: b.emoji, ids: [] }; m.reacoes.push(r); }
    const i = r.ids.indexOf(quem);
    if (i >= 0) r.ids.splice(i, 1); else r.ids.push(quem);
    m.reacoes = m.reacoes.filter((x) => x.ids.length);
}
function chatAcoes(b, souProf) {
    const quem = souProf ? PROF : ME;
    const autorTipo = souProf ? 'equipe' : 'aluno';
    if (b.acao === 'listar') return { mensagens: chatDe(souProf) };
    if (b.acao === 'membros') return { membros: PARES.map((p) => ({ id: p.id, nome: p.nome })) };
    if (b.acao === 'enviar') { estado().chat.push({ id: uid('m'), autorTipo, autorId: quem.id, autorNome: quem.nome, mensagem: String(b.mensagem || '').slice(0, 2000), criadoEm: iso(agora()), reacoes: [] }); return ok; }
    if (b.acao === 'reagir') { reagirEm(estado().chat, b, quem.id); return ok; }
    if (b.acao === 'apagar' || b.acao === 'excluir') { const m = estado().chat.find((x) => x.id === b.mensagemId); if (m) m.apagada = true; return ok; }
    if (b.acao === 'editar') { const m = estado().chat.find((x) => x.id === b.mensagemId); if (m) { m.mensagem = b.mensagem; m.editada = true; } return ok; }
    if (b.acao === 'preparar_anexo') return NAO_NA_DEMO;
    return {};
}
function privadoDe(souProf) {
    return estado().privado.map((m) => ({
        id: m.id, autorTipo: m.autorTipo, souEu: souProf ? m.autorTipo === 'equipe' : m.autorTipo === 'aluno', mensagem: m.apagada ? null : m.mensagem, apagada: !!m.apagada,
        criadoEm: m.criadoEm, editada: !!m.editada, anexo: null, autorNome: m.autorTipo === 'equipe' ? PROF.nome : ME.nome, autorFotoUrl: null,
        reacoes: (m.reacoes || []).map((r) => ({ emoji: r.emoji, total: r.ids.length, souEu: r.ids.includes(souProf ? PROF.id : ME.id) })),
        podeEditar: souProf ? m.autorTipo === 'equipe' : m.autorTipo === 'aluno', podeApagar: souProf ? m.autorTipo === 'equipe' : m.autorTipo === 'aluno',
    }));
}

const RESPOSTAS_IA = [
    [/onde.*(post|envi|entreg|mand)|atividade|trabalho/i, 'Você envia suas atividades em [Atividades](/aluno/atividades.html). Abra a atividade, escreva a resposta ou anexe um arquivo ou link e envie. Depois da correção, a nota, as horas e o comentário do professor aparecem ali mesmo.'],
    [/presen|frequ|chamada|c[óo]digo|pin/i, 'Quando o professor abre a chamada, aparece um aviso no topo da tela: é só digitar o código da aula. O histórico e o total de horas ficam em [Minha Frequência](/aluno/frequencia.html).'],
    [/chat|colega|conversa|turma/i, 'No [Chat da Turma](/aluno/chat.html) todo mundo vê o que você escreve. Lá também dá para conversar em privado com um colega ou com a equipe.'],
    [/desafio|ranking|ponto|n[íi]vel/i, 'Os [Desafios Semanais](/aluno/desafios.html) rendem pontos e te levam pelos níveis, de Iniciante a Mestre, com ranking da semana e geral.'],
    [/acessib|libras|contraste|letra|ouvir/i, 'As opções de acessibilidade (Libras, alto contraste, texto maior, ouvir a página e até me deixar parado) ficam no botão redondo no canto inferior esquerdo e também em [Meu Perfil](/aluno/perfil.html).'],
    [/prompt|pedido|escrev/i, 'Um bom prompt tem 5 partes: papel (quem a IA deve ser), objetivo, contexto, formato da resposta e regras. Exemplo: "Você é um professor de história. Explique a Revolução Industrial em 5 tópicos curtos, com um exemplo do dia a dia. Use só fatos que possam ser conferidos."'],
    [/fonte|confi|erro|mentir|inventa/i, 'A IA pode errar com muita confiança. Peça as fontes, abra pelo menos duas e pergunte "em que parte você não tem certeza?". Confira nomes, datas e números.'],
    [/estudar|prova|enem|revis/i, 'Para estudar com IA: cole o seu material e peça 10 perguntas de revisão com respostas, depois tente responder sem olhar. Se errar, peça uma explicação mais simples.'],
    [/imagem|desenho|foto/i, 'Para imagens, descreva assunto, estilo, luz e cores. Faça várias tentativas e mude uma coisa de cada vez. Guarde o prompt que funcionou.'],
];
const RESPOSTA_IA_PADRAO = 'Aqui quem fala é o Seri, mas na demonstração eu só sei responder alguns exemplos. Na plataforma de verdade eu uso inteligência artificial para tirar dúvidas durante o estudo. Tente me perguntar "como escrever um bom prompt" ou "como conferir fontes".';

const FUNCOES = {
    // ---------- sessão e conta
    'validar-sessao-aluno': () => ({ ok: true, aluno: { precisaAceitarTermos: false } }),
    'perfil-aluno': (b) => b.acao === 'ver' ? { perfil: { id: ME.id, nome_completo: ME.nome, usuario: 'lia.exemplo', email: null, email_confirmado: false, data_nascimento: null, foto_url: null } } : ok,
    'perfil-equipe': () => ({ perfil: { foto_url: null } }),
    'ranking-acesso': () => ({ ranking: [] }),
    'meus-dados': (b) => {
        if (b.acao === 'listar') return { pedidos: estado().pedidos };
        if (b.acao === 'exportar') return { exportacao: { aviso: 'Aluno de demonstração: não há dados pessoais.' } };
        if (b.acao === 'pedir') { estado().pedidos.unshift({ id: uid('q'), tipo: b.tipo, mensagem: b.mensagem || null, status: 'aberto', resposta: null, criado_em: iso(agora()) }); return ok; }
        return {};
    },
    'gerenciar-pedidos-privacidade': (b) => {
        if (b.acao === 'listar') return { pedidos: estado().pedidos.map((p) => ({ ...p, aluno_id: ME.id, atendido_em: p.atendido_em || null, alunos: { nome_completo: ME.nome, usuario: 'lia.exemplo' } })) };
        if (b.acao === 'atender') { const p = estado().pedidos.find((x) => x.id === b.pedidoId); if (p) Object.assign(p, { status: 'atendido', resposta: b.resposta, atendido_em: iso(agora()) }); return ok; }
        return {};
    },
    // ---------- avisos
    'avisos-aluno': (b) => {
        const ativos = estado().avisos.filter((a) => !a.expira_em || new Date(a.expira_em) > new Date());
        if (b.acao === 'listar') return { avisos: ativos.filter((a) => !estado().dispensados.includes(a.id) || a.fixado), anteriores: estado().dispensados.length };
        if (b.acao === 'anteriores') return { avisos: estado().avisos.filter((a) => estado().dispensados.includes(a.id)).map((a) => ({ ...a, motivo: 'dispensado' })) };
        if (b.acao === 'dispensar') { estado().dispensados.push(b.avisoId); return ok; }
        if (b.acao === 'dispensar_todos') { ativos.filter((a) => !a.fixado).forEach((a) => estado().dispensados.push(a.id)); return ok; }
        return {};
    },
    'gerenciar-avisos': (b) => {
        const A = estado().avisos;
        if (b.acao === 'listar') return { avisos: A };
        if (b.acao === 'criar') { A.unshift({ id: uid('av'), turma_id: 'T1', titulo: b.titulo, mensagem: b.mensagem, fixado: !!b.fixado, criado_em: iso(agora()), expira_em: b.expiraEm || null }); return { aviso: A[0] }; }
        if (b.acao === 'atualizar') { const x = A.find((y) => y.id === b.avisoId); if (x) { Object.assign(x, { titulo: b.titulo, mensagem: b.mensagem, fixado: !!b.fixado }); if ('expiraEm' in b) x.expira_em = b.expiraEm; } return { aviso: x }; }
        if (b.acao === 'excluir') { estado().avisos = A.filter((y) => y.id !== b.avisoId); return ok; }
        return ok;
    },
    // ---------- atividades e trabalhos
    'enviar-trabalho': (b) => {
        const E = estado().envios;
        if (b.acao === 'listar') return { trabalhos: E.filter((e) => e.aluno_id === ME.id).map((e) => ({ atividade_id: e.atividade_id, status: e.status, nota: e.nota, horas_concedidas: e.horas_concedidas, feedback_professor: e.feedback_professor, resposta_texto: e.resposta_texto, arquivo_url: e.arquivo_url, enviado_em: e.enviado_em })) };
        if (b.acao === 'gerar_url_upload') return NAO_NA_DEMO;
        if (b.acao === 'enviar') {
            if (E.some((e) => e.atividade_id === b.atividadeId && e.aluno_id === ME.id)) return { erro: 'Você já enviou esta atividade.' };
            const link = b.arquivoUrl && /^https?:\/\//i.test(b.arquivoUrl) ? b.arquivoUrl : null;
            const novo = { id: uid('t'), atividade_id: b.atividadeId, aluno_id: ME.id, alunoNome: ME.nome, status: 'enviado', nota: null, feedback_professor: null, horas_concedidas: null, enviado_em: iso(agora()), resposta_texto: b.respostaTexto || '', comentario_aluno: b.comentario || null, arquivo_url: link };
            E.push(novo);
            return { trabalho: { atividade_id: novo.atividade_id, status: 'enviado', nota: null, resposta_texto: novo.resposta_texto, arquivo_url: link } };
        }
        return {};
    },
    'corrigir-trabalho': (b) => {
        const E = estado().envios;
        if (b.acao === 'listar') return { atividades: ATIVIDADES().map((a) => ({ ...a, envios: E.filter((e) => e.atividade_id === a.id) })) };
        if (b.acao === 'corrigir') { const e = E.find((x) => x.id === b.trabalhoId); if (e) Object.assign(e, { status: 'avaliado', nota: b.nota === '' || b.nota == null ? null : Number(b.nota), feedback_professor: b.feedback || null, horas_concedidas: b.horasConcedidas ?? null }); return { trabalho: { ...e } }; }
        if (b.acao === 'reabrir') { const e = E.find((x) => x.id === b.trabalhoId); if (e) Object.assign(e, { status: 'enviado', nota: null, feedback_professor: null }); return { trabalho: { ...e } }; }
        return {};
    },
    'admin-pendencias': () => {
        const E = estado().envios.filter((e) => e.status !== 'avaliado');
        const D = estado().dEnvios.filter((e) => e.pontos == null);
        const ult = E.sort((a, b) => b.enviado_em.localeCompare(a.enviado_em))[0];
        return { trabalhos: E.length, desafios: D.length, pedidosPrivacidade: estado().pedidos.filter((p) => p.status === 'aberto').length, ultimo: ult ? { tipo: 'trabalho', aluno: ult.alunoNome, titulo: (ATIVIDADES().find((a) => a.id === ult.atividade_id) || {}).titulo || '', quando: ult.enviado_em } : null };
    },
    'admin-dashboard': () => ({ totalAlunos: 8, trabalhosPendentes: estado().envios.filter((e) => e.status !== 'avaliado').length, totalDesafiosEnviados: estado().dEnvios.length, totalProjetosGaleria: estado().projetos.length, avisosRecentes: estado().avisos.slice(0, 3).map((a) => ({ titulo: a.titulo, criado_em: a.criado_em })) }),
    // ---------- enquetes
    'enquetes-aluno': (b) => {
        const E = estado().enquete;
        const base = { id: 'E1', titulo: 'Qual tema da próxima aula?', descricao: 'Sua opinião define o conteúdo da semana.', status: E.status, anonima: true, encerraEm: null, jaVotou: E.votou, podeVerResultado: E.status === 'encerrada' || E.votou };
        if (b.acao === 'pendentes') return { pendentes: [] };
        if (b.acao === 'listar') return { enquetes: [base] };
        if (b.acao === 'detalhe') return { enquete: base, perguntas: PERGUNTAS };
        if (b.acao === 'votar') {
            const r = (b.respostas || []).find((x) => x.perguntaId === 'p1');
            const escolha = r && r.opcoes && r.opcoes[0];
            if (escolha === 'b') E.b++; else if (escolha === 'c') E.c++; else E.a++;
            E.votou = true; return ok;
        }
        if (b.acao === 'acompanhar') return { enquetes: (E.votou || E.status === 'encerrada') ? [resumoEnquete()] : [] };
        return {};
    },
    'gerenciar-enquetes': (b) => {
        const E = estado().enquete;
        if (b.acao === 'acompanhar') return { enquetes: [resumoEnquete()] };
        if (b.acao === 'listar') return { totalAlunos: 8, enquetes: [{ id: 'E1', turma_id: 'T1', titulo: 'Qual tema da próxima aula?', descricao: null, anonima: true, resultado_alunos: 'ao_vivo', exigir_resposta: false, status: E.status, encerra_em: null, aberta_em: hAtras(20), encerrada_em: E.status === 'encerrada' ? hAtras(1) : null, votos: E.a + E.b + E.c, totalPerguntas: 3 }] };
        if (b.acao === 'encerrar') { E.status = 'encerrada'; return ok; }
        if (b.acao === 'reabrir') { E.status = 'aberta'; return ok; }
        if (b.acao === 'resultados') return { enquete: { id: 'E1', titulo: 'Qual tema da próxima aula?', anonima: true, resultado_alunos: 'ao_vivo', status: E.status }, totalAlunos: 8, votos: E.a + E.b + E.c, participantes: [{ nome: 'Marina Exemplo', quando: hAtras(19) }, { nome: 'Caio Exemplo', quando: hAtras(18) }], faltam: ['Davi Exemplo', 'Helena Exemplo'], apuracao: apuracao(false), perguntas: PERGUNTAS };
        if (b.acao === 'obter') return { enquete: { id: 'E1', titulo: 'Qual tema da próxima aula?', descricao: null, anonima: true, resultado_alunos: 'ao_vivo', exigir_resposta: false, status: E.status, encerra_em: null }, perguntas: PERGUNTAS, votos: E.a + E.b + E.c };
        return ok;
    },
    // ---------- frequência
    'frequencia': (b) => {
        const C = estado().chamada;
        const ativa = C && !C.encerrada && new Date(C.expira_em) > new Date();
        if (b.acao === 'disponivel') return { chamada: ativa && !C.registrados.includes(ME.id) ? { id: C.id, titulo: C.titulo, expira_em: C.expira_em } : null };
        if (b.acao === 'registrar') {
            if (!ativa) return { erro: 'Esta chamada já foi encerrada.' };
            if (String(b.pin) !== C.pin) return { erro: 'Código incorreto. Confira com o professor.' };
            if (!C.registrados.includes(ME.id)) { C.registrados.push(ME.id); estado().presencas.unshift({ titulo: C.titulo, horas: C.horas, criadoEm: iso(agora()) }); }
            return ok;
        }
        if (b.acao === 'historico') {
            const regs = estado().presencas.map((p) => ({ origem: 'chamada', titulo: p.titulo, horas: p.horas, criadoEm: p.criadoEm, registradoEm: p.criadoEm }));
            const ativ = estado().envios.filter((e) => e.aluno_id === ME.id && e.horas_concedidas).map((e) => ({ origem: 'atividade', titulo: (ATIVIDADES().find((a) => a.id === e.atividade_id) || {}).titulo, horas: e.horas_concedidas, criadoEm: e.enviado_em, registradoEm: e.enviado_em }));
            return { registros: [...regs, ...ativ], totalHoras: [...regs, ...ativ].reduce((s, r) => s + Number(r.horas || 0), 0) };
        }
        return {};
    },
    'gerenciar-chamadas': (b) => {
        const C = estado().chamada;
        const ativa = C && !C.encerrada && new Date(C.expira_em) > new Date();
        const alunos = [ME, ...PARES];
        if (b.acao === 'listar_ativas') return { chamadas: ativa ? [{ id: C.id, turma_id: 'T1', titulo: C.titulo, horas: C.horas, pin: C.pin, expira_em: C.expira_em, totalRegistrados: C.registrados.length, totalElegiveis: alunos.length }] : [] };
        if (b.acao === 'criar') {
            const pin = String(1000 + Math.floor(Math.random() * 9000));
            estado().chamada = { id: uid('c'), titulo: b.titulo || 'Chamada de demonstração', horas: Number(b.horas) || 1, pin, expira_em: iso(agora() + (Number(b.duracaoMinutos) || 10) * 60e3), registrados: ['par1', 'par2', 'par3'], encerrada: false };
            return { totalElegiveis: alunos.length, chamada: { id: estado().chamada.id, pin } };
        }
        if (b.acao === 'encerrar') { if (C) C.encerrada = true; return ok; }
        if (b.acao === 'reabrir') { if (C) { C.encerrada = false; C.expira_em = iso(agora() + (Number(b.duracaoMinutos) || 10) * 60e3); } return ok; }
        if (b.acao === 'detalhe') return { chamada: { id: b.chamadaId, titulo: C ? C.titulo : 'Aula', horas: C ? C.horas : 1, criado_em: hAtras(0.2) }, alunos: alunos.map((a) => ({ id: a.id, nomeCompleto: a.nome, presente: !!C && C.registrados.includes(a.id), registradoEm: C && C.registrados.includes(a.id) ? hAtras(0.1) : null })) };
        if (b.acao === 'listar_historico') return { chamadas: [3, 2, 1].map((n, i) => ({ id: 'h' + n, titulo: ['Aula 3: Bons prompts', 'Aula 2: O que é IA?', 'Aula 1: Boas-vindas'][i], horas: 1, criado_em: hAtras(24 * 7 * (i + 1)), totalRegistrados: 7 - i, totalElegiveis: 8 })).concat(C ? [{ id: C.id, titulo: C.titulo, horas: C.horas, criado_em: hAtras(0.2), totalRegistrados: C.registrados.length, totalElegiveis: alunos.length }] : []) };
        if (b.acao === 'resumo_horas') return { resumo: alunos.map((a, i) => ({ aluno_id: a.id, nome_completo: a.nome, horas_conquistadas: a.id === ME.id ? estado().presencas.reduce((s, p) => s + p.horas, 0) : [3, 2, 3, 1, 2][i - 1] ?? 2, horas_possiveis: 3 + (C ? 1 : 0) })) };
        return {};
    },
    // ---------- desafios
    'enviar-desafio': (b) => {
        if (b.acao === 'gerar_url_upload') return NAO_NA_DEMO;
        if (b.acao === 'enviar') {
            const link = b.linkOuArquivo;
            if (!link || !/^https?:\/\//i.test(link)) return { erro: 'Cole um link válido (começando com https://).' };
            const D = estado().dEnvios;
            const ja = D.find((e) => e.desafio_id === b.desafioId && e.aluno_id === ME.id);
            if (ja) Object.assign(ja, { link, enviado_em: iso(agora()), pontos: null, feedback: null }); else D.push({ id: uid('de'), desafio_id: b.desafioId, aluno_id: ME.id, alunoNome: ME.nome, link, enviado_em: iso(agora()), pontos: null, feedback: null });
            return { enviado: true };
        }
        return painelDesafios();
    },
    'gerenciar-desafios': (b) => {
        const D = estado().dEnvios;
        if (b.acao === 'listar') return { desafios: DESAFIOS().map((d) => {
            const envios = D.filter((e) => e.desafio_id === d.id).map((e) => ({ id: e.id, alunoNome: e.alunoNome, enviado_em: e.enviado_em, link_ou_arquivo: e.link, avaliado: e.pontos != null, pontos: e.pontos, feedback: e.feedback }));
            return { id: d.id, titulo: d.titulo, descricao: d.descricao, semana: d.semana, pontos: d.pontos, data_fim: d.dataFim, ativo: true, pendentes: envios.filter((e) => !e.avaliado).length, envios };
        }) };
        if (b.acao === 'avaliar') { const e = D.find((x) => x.id === b.envioId); if (e) Object.assign(e, { pontos: Number(b.pontos), feedback: b.feedback || null }); return ok; }
        if (b.acao === 'reabrir_envio') { const e = D.find((x) => x.id === b.envioId); if (e) Object.assign(e, { pontos: null, feedback: null }); return ok; }
        if (b.acao === 'ranking') return { semana: [{ posicao: 1, nome: 'Marina Exemplo', pontos: 10, desafiosFeitos: 1 }, { posicao: 2, nome: 'Sofia Exemplo', pontos: 9, desafiosFeitos: 1 }], geral: [{ posicao: 1, nome: 'Sofia Exemplo', pontos: 40, desafiosFeitos: 4 }, { posicao: 2, nome: 'Marina Exemplo', pontos: 38, desafiosFeitos: 4 }, { posicao: 3, nome: ME.nome, pontos: pontosDoAluno(), desafiosFeitos: 3 }] };
        return ok;
    },
    // ---------- galeria
    'galeria': (b) => {
        const P = estado().projetos;
        if (b.acao === 'listar') return { projetos: P.map((p) => ({ id: p.id, aluno_id: p.aluno_id, titulo: p.titulo, descricao: p.descricao, arquivo_url: p.arquivo_url, criado_em: p.criado_em, autorNome: p.autorNome, totalCurtidas: p.curtidas.length, euCurti: p.curtidas.includes(ME.id), comentarios: p.comentarios })) };
        const p = P.find((x) => x.id === b.projetoId);
        if (b.acao === 'curtir' && p && !p.curtidas.includes(ME.id)) p.curtidas.push(ME.id);
        if (b.acao === 'descurtir' && p) p.curtidas = p.curtidas.filter((x) => x !== ME.id);
        if (b.acao === 'comentar' && p) p.comentarios.push({ id: uid('gc'), autorNome: ME.nome, autor_tipo: 'aluno', comentario: String(b.comentario || '').slice(0, 500), criado_em: iso(agora()) });
        if (b.acao === 'postar') P.unshift({ id: uid('g'), aluno_id: ME.id, autorNome: ME.nome, titulo: b.titulo, descricao: b.descricao || null, arquivo_url: b.arquivoUrl && /^https?:\/\//i.test(b.arquivoUrl) ? b.arquivoUrl : null, criado_em: iso(agora()), curtidas: [], comentarios: [] });
        if (b.acao === 'gerar_url_upload') return NAO_NA_DEMO;
        return ok;
    },
    'moderar-galeria': (b) => {
        const P = estado().projetos;
        if (b.acao === 'excluir_projeto') { estado().projetos = P.filter((x) => x.id !== b.projetoId); return ok; }
        if (b.acao === 'excluir_comentario') { P.forEach((p) => { p.comentarios = p.comentarios.filter((c) => c.id !== b.comentarioId); }); return ok; }
        if (b.acao === 'comentar') { const p = P.find((x) => x.id === b.projetoId); if (p) p.comentarios.push({ id: uid('gc'), autorNome: PROF.nome, autor_tipo: 'equipe', comentario: b.comentario, criado_em: iso(agora()) }); return ok; }
        return { projetos: P.map((p) => ({ id: p.id, titulo: p.titulo, autorNome: p.autorNome, criado_em: p.criado_em, totalCurtidas: p.curtidas.length, descricao: p.descricao, arquivo_url: p.arquivo_url, comentarios: p.comentarios })) };
    },
    // ---------- bloco de notas
    'gerenciar-notas': (b) => {
        const N = estado().notas;
        if (b.acao === 'listar') return { notas: [...N].sort((a, c) => c.atualizadoEm.localeCompare(a.atualizadoEm)) };
        if (b.acao === 'criar') { N.push({ id: uid('n'), titulo: b.titulo || '', conteudo: String(b.conteudo || '').slice(0, 20000), atualizadoEm: iso(agora()) }); return ok; }
        if (b.acao === 'atualizar') { const n = N.find((x) => x.id === b.notaId); if (n) Object.assign(n, { titulo: b.titulo || '', conteudo: String(b.conteudo || '').slice(0, 20000), atualizadoEm: iso(agora()) }); return ok; }
        if (b.acao === 'excluir') { estado().notas = N.filter((x) => x.id !== b.notaId); return ok; }
        return {};
    },
    // ---------- laboratório
    'enviar-laboratorio': (b) => {
        const L = estado().labEnvios;
        if (b.acao === 'listar') return { envios: L };
        if (b.acao === 'gerar_url_upload') return NAO_NA_DEMO;
        if (b.acao === 'enviar') { const i = L.findIndex((x) => x.laboratorio_id === b.laboratorioId); const e = { laboratorio_id: b.laboratorioId, texto_resposta: b.respostaTexto || '', arquivo_url: b.arquivoUrl || null, criado_em: iso(agora()) }; if (i >= 0) L[i] = e; else L.push(e); return ok; }
        return {};
    },
    'gerenciar-laboratorio': () => ({ laboratorios: LABS.map((l) => ({ ...l, ativo: true, envios: [] })) }),
    // ---------- chat
    'chat-turma': (b) => chatAcoes(b, false),
    'moderar-chat': (b) => {
        if (['listar', 'membros', 'enviar', 'reagir', 'apagar', 'excluir', 'editar'].includes(b.acao)) return chatAcoes(b, true);
        if (b.acao === 'conversas') return { conversas: [{ id: 'pv1', com: { tipo: 'aluno', id: ME.id, nome: ME.nome }, previa: estado().privado.slice(-1)[0].mensagem, naoLidas: 0, atualizadaEm: estado().privado.slice(-1)[0].criadoEm }] };
        if (b.acao === 'contatos') return { contatos: [{ tipo: 'aluno', id: ME.id, nome: ME.nome }, ...PARES.map((p) => ({ tipo: 'aluno', id: p.id, nome: p.nome }))] };
        if (b.acao === 'abrir') return { conversaId: 'pv1' };
        if (b.acao === 'mensagens') return { com: { tipo: 'aluno', id: ME.id, nome: ME.nome }, mensagens: privadoDe(true) };
        if (b.acao === 'enviar_privado') { estado().privado.push({ id: uid('pm'), autorTipo: 'equipe', autorId: PROF.id, mensagem: b.mensagem, criadoEm: iso(agora()), reacoes: [] }); return ok; }
        if (b.acao === 'conversas_turma') return { conversas: [] };
        return {};
    },
    'chat-privado': (b) => {
        if (b.acao === 'conversas') { const u = estado().privado.slice(-1)[0]; return { conversas: [{ id: 'pv1', com: { tipo: 'equipe', id: PROF.id, nome: PROF.nome }, previa: u.mensagem, naoLidas: 0, atualizadaEm: u.criadoEm }] }; }
        if (b.acao === 'contatos') return { contatos: [{ tipo: 'equipe', id: PROF.id, nome: PROF.nome }, ...PARES.map((p) => ({ tipo: 'aluno', id: p.id, nome: p.nome }))] };
        if (b.acao === 'abrir') return { conversaId: 'pv1' };
        if (b.acao === 'mensagens') return { com: { tipo: 'equipe', id: PROF.id, nome: PROF.nome }, mensagens: privadoDe(false) };
        if (b.acao === 'enviar') {
            estado().privado.push({ id: uid('pm'), autorTipo: 'aluno', autorId: ME.id, mensagem: String(b.mensagem || '').slice(0, 2000), criadoEm: iso(agora()), reacoes: [] });
            estado().privado.push({ id: uid('pm'), autorTipo: 'equipe', autorId: PROF.id, mensagem: 'Recebi! Esta é uma conversa de demonstração: na plataforma real, o professor responde por aqui.', criadoEm: iso(agora() + 4000), reacoes: [] });
            return ok;
        }
        if (b.acao === 'preparar_anexo') return NAO_NA_DEMO;
        return ok;
    },
    // ---------- assistente e materiais
    'assistente-ia': (b) => {
        if (b.acao === 'apagar_conversa') return ok;
        const hit = RESPOSTAS_IA.find(([re]) => re.test(String(b.mensagem || '')));
        return { conversaId: 'demo-conversa', resposta: hit ? hit[1] : RESPOSTA_IA_PADRAO };
    },
    'comparar-ias': (b) => {
        if (b.acao === 'saldo') return { restantes: { 'gemini': 5, 'llama': 5, 'gpt-oss': 5 }, limite: 5 };
        const EX = {
            'gemini': 'Um prompt é a instrução que você escreve para a IA. Quanto mais claro for o pedido (quem ela deve ser, o que fazer e em que formato), melhor tende a ser a resposta.\n\nExemplo: em vez de "fale de energia", peça "explique energia solar em 5 linhas para um aluno do 9º ano".',
            'llama': 'Prompt é o texto que você manda para a IA. Pense nele como uma pergunta ou uma ordem: se for vaga, a resposta fica vaga; se tiver detalhes, a resposta fica mais útil.',
            'gpt-oss': 'Passo a passo: 1) a IA só sabe o que está no seu pedido; 2) o pedido é o prompt; 3) logo, dar contexto, objetivo e formato no prompt melhora o resultado. Por isso se diz que escrever prompts é uma habilidade.',
        };
        const NOMES = { 'gemini': ['Gemini', 'Google'], 'llama': ['Llama', 'Meta'], 'gpt-oss': ['gpt-oss', 'OpenAI'] };
        const ias = Array.isArray(b.ias) && b.ias.length ? b.ias : ['gemini'];
        return { exemplo: true, restantes: { 'gemini': 5, 'llama': 5, 'gpt-oss': 5 }, limite: 5, resultados: ias.map((ia, i) => ({ ia, nome: (NOMES[ia] || [ia])[0], empresa: (NOMES[ia] || ['', ''])[1], ok: true, resposta: EX[ia] || EX.gemini, ms: 900 + i * 350 })) };
    },
    'ver-material': (b) => ({ url: '/demo/guia-de-prompts.pdf', titulo: 'Guia rápido de prompts', nome: 'guia-de-prompts.pdf', tamanho: 11031, permiteBaixar: true, visualiza: 'pdf' }),
    // ---------- professor: cadastros e painéis
    'cadastrar-aluno': (b) => {
        const dia1 = 86400e3, a = agora();
        const mk = (id, nome, usuario, nasc, termo, primeiro, acessoDias) => ({ id, nome_completo: nome, usuario, turma_id: 'T1', data_nascimento: nasc, email: null, email_confirmado: false, ativo: true, precisa_trocar_senha: primeiro, aceitou_termos: termo, ultimo_acesso: acessoDias == null ? null : iso(a - acessoDias * dia1), criado_em: hAtras(24 * 30) });
        if (b.acao === 'listar') return { turmas: [{ id: 'T1', nome: 'Turma Demonstração', ativa: true }], alunos: [mk(ME.id, ME.nome, 'lia.exemplo', '2009-03-14', true, false, 0.01), mk('par1', 'Marina Exemplo', 'marina.exemplo', '2008-11-02', true, false, 0.2), mk('par2', 'Caio Exemplo', 'caio.exemplo', '2009-06-21', true, false, 1), mk('par3', 'Sofia Exemplo', 'sofia.exemplo', '2008-08-30', true, false, 0.5), mk('par4', 'Davi Exemplo', 'davi.exemplo', '2009-01-10', true, false, 4), mk('par5', 'Helena Exemplo', 'helena.exemplo', '2008-12-05', false, true, null)] };
        if (b.acao === 'ver_senha') return { senha: '(não existe na demonstração)' };
        return ok;
    },
    'simular-aluno': () => ({ erro: 'Indisponível na demonstração.' }),
    'gerenciar-turmas': () => ({ turmas: [{ id: 'T1', nome: 'Turma Demonstração', ano: 2026, ativa: true, vinculos: { alunos: 6, modulos: 3, avisos: estado().avisos.length, mensagens: estado().chat.length } }] }),
    'gerenciar-equipe': () => ({ equipe: [{ id: PROF.id, nome_completo: PROF.nome, cargo: 'professor', usuario: 'professor.demo', email: null, nivel_acesso: 'total', ativo: true }] }),
    'gerenciar-prompts': () => ({ prompts: PROMPTS.map((p) => ({ ...p, publico: true })) }),
    'gerenciar-recursos': () => ({ recursos: RECURSOS }),
    'gerenciar-faq': () => ({ faqs: FAQ.map((f) => ({ ...f, ativo: true })) }),
    'gerenciar-conteudo': (b) => b.acao === 'gerar_url_upload' ? NAO_NA_DEMO : (b.acao === 'ver_arquivo' ? { url: '/demo/guia-de-prompts.pdf', titulo: 'Guia', nome: 'guia-de-prompts.pdf', tamanho: 11031, permiteBaixar: true, visualiza: 'pdf' } : ok),
    'painel-acesso': (b) => b.acao === 'resumo' ? { resumo: { online: 3, totalAlunos: 6, acessosHoje: 14, acessosOntem: 10, picoHora: 19, picoContagem: 6, mediaDiaria7d: 12.5, inativos7d: 1 } }
        : b.acao === 'linha_tempo' ? { pontos: Array.from({ length: 24 }, (_, i) => ({ inicio: iso(agora() - (23 - i) * 3600e3), contagem: [0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 1, 2, 1, 0, 1, 1, 2, 5, 6, 4, 2, 1, 0][i] })) }
        : b.acao === 'ranking' ? { ranking: [{ nome: 'Marina Exemplo', acessos: 12 }, { nome: 'Sofia Exemplo', acessos: 10 }, { nome: ME.nome, acessos: 8 }, { nome: 'Caio Exemplo', acessos: 6 }] }
        : b.acao === 'mapa_calor' ? { celulas: [{ dia_semana: 1, hora: 19, contagem: 5 }, { dia_semana: 3, hora: 19, contagem: 6 }, { dia_semana: 3, hora: 20, contagem: 3 }, { dia_semana: 5, hora: 18, contagem: 2 }] }
        : { alunos: [ME, ...PARES].map((a, i) => ({ id: a.id, nome_completo: a.nome, ultimo_acesso: iso(agora() - i * 5 * 3600e3), acessos: 12 - i, online: i < 2 })) },
};

// ---------------------------------------------------------------- tabelas lidas direto (REST)
function rest(url) {
    const u = decodeURIComponent(url);
    if (u.includes('/rest/v1/atividades')) return ATIVIDADES();
    if (u.includes('/rest/v1/trabalhos_enviados')) return estado().envios.map((e) => ({ atividade_id: e.atividade_id, status: e.status }));
    if (u.includes('/rest/v1/laboratorio_ia')) return LABS;
    if (u.includes('/rest/v1/prompts')) return PROMPTS;
    if (u.includes('/rest/v1/faq')) return FAQ;
    if (u.includes('/rest/v1/recursos_extras')) return RECURSOS;
    if (u.includes('/rest/v1/ferramentas_ia')) return FERRAMENTAS;
    if (u.includes('/rest/v1/aulas')) {
        const de = (u.match(/data_aula=gte\.(\d{4}-\d{2}-\d{2})/) || [])[1] || '0000-00-00';
        return MODULOS_AULAS().flatMap((m) => m.aulas.map((x) => ({ ...x, modulo_id: m.id, modulos: { titulo: m.titulo, turma_id: 'T1' } })))
            .filter((x) => x.data_aula >= de).sort((x, y) => x.data_aula.localeCompare(y.data_aula));
    }
    if (u.includes('/rest/v1/modulos') && u.includes('aulas(')) return MODULOS_AULAS();
    if (u.includes('/rest/v1/modulos') && u.includes('conteudos(')) return MODULOS_CONTEUDO();
    if (u.includes('/rest/v1/modulos')) return MODULOS_AULAS().map((m) => ({ id: m.id, titulo: m.titulo }));
    if (u.includes('/rest/v1/alunos')) return [ME, ...PARES].map((a) => ({ id: a.id, nome_completo: a.nome, ativo: true, turma_id: 'T1', turmas: { nome: 'Turma Demonstração', ativa: true } }));
    if (u.includes('/rest/v1/turmas')) return [{ id: 'T1', nome: 'Turma Demonstração', ano: 2026, ativa: true }];
    return [];
}

// ---------------------------------------------------------------- ponto de entrada: substitui o fetch do cliente
export async function fetchDemo(url, opts) {
    url = String(url);
    const json = (obj, extra) => new Response(JSON.stringify(obj), { status: 200, headers: Object.assign({ 'Content-Type': 'application/json' }, extra || {}) });
    const m = url.match(/\/functions\/v1\/([a-z-]+)/);
    if (m) {
        let corpo = {};
        try { corpo = opts && opts.body ? JSON.parse(opts.body) : {}; } catch (e) { corpo = {}; }
        const fn = FUNCOES[m[1]];
        estado();
        const r = fn ? fn(corpo) : {};
        salvar();
        return json(r === undefined ? {} : r);
    }
    if (url.includes('/rest/v1/')) {
        const linhas = rest(url);
        return json(linhas, { 'Content-Range': `0-${Math.max(0, linhas.length - 1)}/${linhas.length}` });
    }
    // qualquer outra coisa (armazenamento etc.): nunca sai para a rede
    return json({});
}

// ---------------------------------------------------------------- faixa de aviso da demonstração
function faixa() {
    if (document.getElementById('demo-faixa')) return;
    const perfil = sessionStorage.getItem('pibiex_demo');
    const st = document.createElement('style');
    st.textContent = `
        html::before { content: ""; position: fixed; top: 0; left: 0; right: 0; height: 4px; background: #A3E635; z-index: 2147483000; pointer-events: none; }
        body { padding-bottom: 64px !important; }
        button[onclick*="verComoAluno"] { display: none !important; }
        #demo-faixa { position: fixed; left: 50%; bottom: 14px; transform: translateX(-50%); z-index: 2147483001; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center;
            max-width: calc(100vw - 24px); padding: 10px 14px; border-radius: 16px; background: #0B1B4A; color: #fff; border: 2px solid #A3E635; box-shadow: 0 14px 40px rgba(0,0,0,.35); font: 600 13px/1.35 'Inter', system-ui, sans-serif; }
        #demo-faixa .tag { background: #A3E635; color: #0B1B4A; font-weight: 800; font-size: 10.5px; letter-spacing: .1em; padding: 4px 9px; border-radius: 999px; cursor: pointer; border: 0; }
        #demo-faixa button { border: 0; border-radius: 10px; padding: 8px 12px; font: 700 12.5px 'Inter', system-ui, sans-serif; cursor: pointer; }
        #demo-faixa .trocar { background: #1E3A8A; color: #fff; }
        #demo-faixa .sair { background: #fff; color: #0B1B4A; }
        #demo-faixa .minimizar { background: transparent; color: #fff; border: 1px solid #4B5CA0 !important; padding: 6px 10px !important; }
        #demo-faixa button:focus-visible { outline: 3px solid #A3E635; outline-offset: 2px; }
        #demo-faixa.compacto { left: 12px; transform: none; bottom: 12px; padding: 6px 8px; gap: 8px; flex-wrap: nowrap; border-radius: 14px; }
        #demo-faixa.compacto .texto, #demo-faixa.compacto .trocar, #demo-faixa.compacto .minimizar { display: none; }
        @media (max-width: 640px) { #demo-faixa { left: 8px; right: 8px; transform: none; max-width: none; bottom: 8px; } #demo-faixa.compacto { right: auto; } }
    `;
    document.head.appendChild(st);
    const el = document.createElement('div');
    el.id = 'demo-faixa';
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', 'Modo demonstração');
    const dica = perfil === 'professor'
        ? 'Você é o <b>professor</b>. Abra uma chamada, corrija um trabalho ou crie um aviso: tudo vale só nesta aba.'
        : 'Você é a aluna <b>Lia</b>. Envie uma atividade e depois use <b>Ver como professor</b> para corrigi-la.';
    el.innerHTML = `<button type="button" class="tag" aria-label="Mostrar ou esconder os detalhes da demonstração">DEMONSTRAÇÃO</button>
        <span class="texto">${dica} Dados de exemplo, nada é enviado a servidor.</span>
        <button type="button" class="trocar">${perfil === 'professor' ? 'Ver como aluno' : 'Ver como professor'}</button>
        <button type="button" class="sair">Sair da demonstração</button>
        <button type="button" class="minimizar" aria-label="Minimizar" title="Minimizar">—</button>`;
    document.body.appendChild(el);
    const alternar = () => { el.classList.toggle('compacto'); try { sessionStorage.setItem('pibiex_demo_faixa', el.classList.contains('compacto') ? '1' : '0'); } catch (e) { /* ok */ } };
    el.querySelector('.tag').onclick = alternar;
    el.querySelector('.minimizar').onclick = alternar;
    el.querySelector('.trocar').onclick = () => {
        const novo = perfil === 'professor' ? 'aluno' : 'professor';
        sessionStorage.setItem('pibiex_demo', novo);
        location.href = novo === 'professor' ? '/admin/inicio.html' : '/aluno/inicio.html';
    };
    el.querySelector('.sair').onclick = () => {
        try { Object.keys(sessionStorage).filter((k) => k.startsWith('demo:') || k === 'pibiex_demo' || k === 'pibiex_demo_faixa' || k === CHAVE).forEach((k) => sessionStorage.removeItem(k)); } catch (e) { /* ok */ }
        location.href = '/demo/';
    };
    let pref = null;
    try { pref = sessionStorage.getItem('pibiex_demo_faixa'); } catch (e) { /* ok */ }
    if (pref === '1') el.classList.add('compacto');
    else if (pref === null) setTimeout(() => { el.classList.add('compacto'); try { sessionStorage.setItem('pibiex_demo_faixa', '1'); } catch (e) { /* ok */ } }, 9000);
}
if (typeof document !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', faixa); else faixa(); }
