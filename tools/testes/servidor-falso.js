// Servidor de mentira usado SÓ pelos testes: responde no lugar do Supabase, então nenhum dado real é lido, criado ou apagado.
try { if (!new URLSearchParams(location.search).get('prefs')) localStorage.removeItem('pibiex_prefs'); } catch (e) {}
(function () {
    const S = window.__S = { votou: false, status: 'aberta', a: 5, b: 4, c: 3, notas: [0, 1, 2, 4, 5], criado: null, encerrou: 0, chamadas: [], votoEnviado: null, identificada: false };
    const q = new URLSearchParams(location.search);
    if (q.get('votou')) S.votou = true;
    if (q.get('status')) S.status = q.get('status');
    if (q.get('ident')) S.identificada = true;
    localStorage.setItem('pibiex_aluno_token', 'tk');
    localStorage.setItem('pibiex_aluno_dados', JSON.stringify({ id: 'EU', nomeCompleto: 'Aluno Teste', turmaId: 'T1', precisaTrocarSenha: false, precisaAceitarTermos: false, fotoUrl: null }));
    localStorage.setItem('pibiex_equipe_token', 'tk');
    localStorage.setItem('pibiex_equipe_dados', JSON.stringify({ nomeCompleto: 'Professor Teste', cargo: 'professor', nivelAcesso: 'total', fotoUrl: null }));

    const perguntas = [
        { id: 'p1', ordem: 1, tipo: 'unica', texto: 'Qual tema vamos ver na próxima aula?', obrigatoria: true, opcoes: [{ id: 'a', texto: 'IA e imagens' }, { id: 'b', texto: 'IA e texto' }, { id: 'c', texto: 'IA e dados' }], escalaMax: null, maxEscolhas: null, escala_max: null, max_escolhas: null },
        { id: 'p2', ordem: 2, tipo: 'multipla', texto: 'Quais ferramentas você usa?', obrigatoria: false, opcoes: [{ id: 'x', texto: 'ChatGPT' }, { id: 'y', texto: 'Claude' }, { id: 'z', texto: 'Gemini' }], escalaMax: null, maxEscolhas: 2, escala_max: null, max_escolhas: 2 },
        { id: 'p3', ordem: 3, tipo: 'sim_nao', texto: 'Você gostou da aula de hoje?', obrigatoria: true, opcoes: [{ id: 'sim', texto: 'Sim' }, { id: 'nao', texto: 'Não' }], escalaMax: null, maxEscolhas: null, escala_max: null, max_escolhas: null },
        { id: 'p4', ordem: 4, tipo: 'escala', texto: 'Que nota você dá para a aula?', obrigatoria: true, opcoes: null, escalaMax: 5, maxEscolhas: null, escala_max: 5, max_escolhas: null },
        { id: 'p5', ordem: 5, tipo: 'texto_curto', texto: 'Uma sugestão para as próximas aulas', obrigatoria: false, opcoes: null, escalaMax: null, maxEscolhas: null, escala_max: null, max_escolhas: null },
    ];

    function apuracao(comTextos) {
        const votos = [S.a, S.b, S.c];
        const total = votos.reduce((x, y) => x + y, 0);
        const maior = Math.max(...votos);
        const pct = (v) => (total ? Math.round((v / total) * 1000) / 10 : 0);
        const ap = [
            { id: 'p1', ordem: 1, tipo: 'unica', texto: perguntas[0].texto, obrigatoria: true, totalRespostas: total, opcoes: ['a', 'b', 'c'].map((id, i) => ({ id, texto: perguntas[0].opcoes[i].texto, votos: votos[i], percentual: pct(votos[i]), lider: votos[i] === maior })) },
            { id: 'p3', ordem: 3, tipo: 'sim_nao', texto: perguntas[2].texto, obrigatoria: true, totalRespostas: 10, opcoes: [{ id: 'sim', texto: 'Sim', votos: 8, percentual: 80, lider: true }, { id: 'nao', texto: 'Não', votos: 2, percentual: 20, lider: false }] },
            { id: 'p4', ordem: 4, tipo: 'escala', texto: perguntas[3].texto, obrigatoria: true, totalRespostas: 12, escala: { max: 5, media: 4.1, distribuicao: S.notas.map((v, i) => ({ nota: i + 1, votos: v })) } },
        ];
        if (comTextos) ap.push({ id: 'p5', ordem: 5, tipo: 'texto_curto', texto: perguntas[4].texto, obrigatoria: false, totalRespostas: 2, textos: ['Mais prática com o Perplexity', 'Aulas com projetos <b>reais</b>'] });
        return ap;
    }
    const totalVotos = () => S.a + S.b + S.c;
    const resumo = (comTextos) => ({ id: 'E1', titulo: 'Qual tema da próxima aula?', status: S.status, encerraEm: null, votos: totalVotos(), totalAlunos: 21, perguntas: apuracao(comTextos), anonima: !S.identificada });

    const respostas = {
        'enquetes-aluno': (b) => {
            if (b.acao === 'pendentes') return { pendentes: S.status === 'aberta' && !S.votou ? [{ id: 'E1', titulo: 'Qual tema da próxima aula?', descricao: 'Sua opinião define o conteúdo da semana.', encerraEm: null }] : [] };
            if (b.acao === 'listar') return { enquetes: [{ id: 'E1', titulo: 'Qual tema da próxima aula?', descricao: 'Sua opinião define o conteúdo da semana.', status: S.status, anonima: !S.identificada, encerraEm: null, jaVotou: S.votou, podeVerResultado: S.status === 'encerrada' || S.votou }] };
            if (b.acao === 'detalhe') return { enquete: { id: 'E1', titulo: 'Qual tema da próxima aula?', descricao: 'Sua opinião define o conteúdo da semana.', status: S.status, anonima: !S.identificada, encerraEm: null, jaVotou: S.votou, podeVerResultado: S.status === 'encerrada' || S.votou }, perguntas };
            if (b.acao === 'votar') { S.votoEnviado = b.respostas; S.votou = true; S.a += 1; return { ok: true }; }
            if (b.acao === 'acompanhar') return { enquetes: (S.votou || S.status === 'encerrada') ? [resumo(false)] : [] };
            return {};
        },
        'gerenciar-enquetes': (b) => {
            if (b.acao === 'acompanhar') return { enquetes: [resumo(false)] };
            if (b.acao === 'listar') return { totalAlunos: 21, enquetes: [
                { id: 'E1', turma_id: 'T1', titulo: 'Qual tema da próxima aula?', descricao: null, anonima: !S.identificada, resultado_alunos: 'ao_vivo', exigir_resposta: true, status: S.status, encerra_em: null, aberta_em: '2026-10-15T14:00:00Z', encerrada_em: S.status === 'encerrada' ? '2026-10-15T15:00:00Z' : null, votos: totalVotos(), totalPerguntas: 5 },
                { id: 'E2', turma_id: 'T1', titulo: 'Avaliação da aula 7', descricao: null, anonima: false, resultado_alunos: 'apos_encerrar', exigir_resposta: true, status: 'rascunho', encerra_em: null, aberta_em: null, encerrada_em: null, votos: 0, totalPerguntas: 3 },
            ] };
            if (b.acao === 'obter') return { enquete: { id: b.enqueteId, titulo: 'Avaliação da aula 7', descricao: 'Conte como foi', anonima: false, resultado_alunos: 'apos_encerrar', exigir_resposta: true, status: 'rascunho', encerra_em: null }, perguntas, votos: 0 };
            if (b.acao === 'criar') { S.criado = b; return { enqueteId: 'NOVA' }; }
            if (b.acao === 'encerrar') { S.status = 'encerrada'; S.encerrou++; return { ok: true }; }
            if (b.acao === 'reabrir') { S.status = 'aberta'; return { ok: true }; }
            if (b.acao === 'resultados') return {
                enquete: { id: 'E1', titulo: 'Qual tema da próxima aula?', anonima: !S.identificada, resultado_alunos: 'ao_vivo', status: S.status },
                totalAlunos: 21, votos: totalVotos(),
                participantes: [{ nome: 'Ana Souza', quando: '2026-10-15T14:05:00Z' }, { nome: 'Bruno Lima', quando: '2026-10-15T14:06:00Z' }],
                faltam: ['Carla Dias', 'Diego Reis'], apuracao: apuracao(true), perguntas,
                individuais: S.identificada ? [{ alunoId: 'u1', nome: 'Ana Souza', respostas: [{ perguntaId: 'p1', valor: { opcoes: ['a'] } }, { perguntaId: 'p4', valor: { nota: 5 } }, { perguntaId: 'p5', valor: { texto: 'Mais prática' } }] }] : undefined,
            };
            return {};
        },

        'corrigir-trabalho': (b) => {
            const mk = (id, nome, st, nota, quando, texto) => ({ id, atividade_id: 'A1', aluno_id: 'u' + id, alunoNome: nome, status: st, nota, feedback_professor: st === 'avaliado' ? 'Bom trabalho' : null, horas_concedidas: null, enviado_em: quando, resposta_texto: texto, comentario_aluno: null, arquivo_url: null });
            S.envios = S.envios || [
                mk('t1', 'Ana Souza Lima', 'enviado', null, new Date(Date.now() - 2 * 3600e3).toISOString(), 'Pesquisei no Perplexity sobre o tema escolhido e comparei três fontes diferentes. A principal conclusão é que a ferramenta cita as fontes, o que facilita conferir cada informação.'),
                mk('t2', 'Bruno Carvalho', 'enviado', null, new Date(Date.now() - 26 * 3600e3).toISOString(), 'Escolhi o tema 2. Achei interessante a parte de citar fontes.'),
                mk('t3', 'Carla Dias', 'avaliado', 9, new Date(Date.now() - 50 * 3600e3).toISOString(), 'Meu trabalho completo está no anexo.'),
                mk('t4', 'Diego Reis Mota', 'enviado', null, new Date(Date.now() - 5 * 86400e3).toISOString(), 'Texto curto.'),
                mk('t5', 'Elaine Nunes', 'avaliado', 7.5, new Date(Date.now() - 6 * 86400e3).toISOString(), 'Respondi tudo.'),
            ];
            const atv = [
                { id: 'A1', titulo: 'IA na Prática: Pesquisa com o Perplexity', descricao: 'Escolha UM dos três temas e pesquise.', data_entrega: new Date(Date.now() + 2 * 86400e3).toISOString(), horas_maximas: 3, criado_em: '2026-10-19T10:00:00Z', modulos: { titulo: 'INTELIGÊNCIAS ARTIFICIAIS - IAs', turma_id: 'T1' }, envios: S.envios },
                { id: 'A2', titulo: 'Atividade 1: O que é IA?', descricao: null, data_entrega: '2026-10-05T20:00:00Z', horas_maximas: null, criado_em: '2026-09-30T10:00:00Z', modulos: { titulo: 'INTRODUÇÃO', turma_id: 'T1' }, envios: [] },
                { id: 'A3', titulo: 'Diagnóstico inicial', descricao: null, data_entrega: null, horas_maximas: 1, criado_em: '2026-09-01T10:00:00Z', modulos: { titulo: 'INTRODUÇÃO', turma_id: 'T1' }, envios: [{ id: 't9', atividade_id: 'A3', aluno_id: 'u9', alunoNome: 'Fábio Rocha', status: 'avaliado', nota: 10, feedback_professor: null, horas_concedidas: 1, enviado_em: '2026-09-02T10:00:00Z', resposta_texto: 'ok', comentario_aluno: null, arquivo_url: null }] },
            ];
            if (b.acao === 'listar') return { atividades: atv };
            if (b.acao === 'corrigir') { const e = S.envios.find((x) => x.id === b.trabalhoId); Object.assign(e, { status: 'avaliado', nota: b.nota === '' ? null : Number(b.nota), feedback_professor: b.feedback || null, horas_concedidas: b.horasConcedidas }); return { trabalho: { ...e } }; }
            if (b.acao === 'reabrir') { const e = S.envios.find((x) => x.id === b.trabalhoId); Object.assign(e, { status: 'enviado', nota: null, feedback_professor: null }); return { trabalho: { ...e } }; }
            return {};
        },
        'enviar-trabalho': (b) => {
            S.meus = S.meus || [{ atividade_id: 'A3', status: 'avaliado', nota: 10, horas_concedidas: 1, feedback_professor: 'Ótimo trabalho!', resposta_texto: 'Respondi tudo.' }, { atividade_id: 'A2', status: 'enviado', nota: null, resposta_texto: 'IA é quando computadores aprendem.' }];
            if (b.acao === 'listar') return { trabalhos: S.meus };
            if (b.acao === 'enviar') { const t = { atividade_id: b.atividadeId, status: 'enviado', nota: null, resposta_texto: b.respostaTexto }; S.meus.push(t); return { trabalho: t }; }
            return {};
        },
        'avisos-aluno': (b) => {
            S.av = S.av || [
                { id: 'a1', titulo: 'Atividade nova: Pesquisa com o Perplexity', mensagem: 'Pessoal, publiquei uma atividade nova no menu Atividades. Escolham UM dos três temas e pesquisem usando o Perplexity. O prazo é na quarta-feira às 18h. Quem tiver dúvida pode me chamar no chat da turma ou perguntar na próxima aula. Lembrem de comparar pelo menos duas fontes e de escrever o que acharam mais útil na ferramenta.', fixado: false, criado_em: new Date(Date.now() - 3600e3).toISOString() },
                { id: 'a2', titulo: 'Regras do curso', mensagem: 'Leiam o Termo de Uso.', fixado: true, criado_em: '2026-09-01T10:00:00Z' },
                { id: 'a3', titulo: 'Aula de sexta mudou de horário', mensagem: 'Começa às 19h.', fixado: false, criado_em: new Date(Date.now() - 3 * 86400e3).toISOString() },
            ];
            S.antes = S.antes || 2;
            if (b.acao === 'listar') return { avisos: S.av, anteriores: S.antes };
            if (b.acao === 'anteriores') return { avisos: [{ id: 'x1', titulo: 'Aviso antigo expirado', mensagem: 'Já passou.', fixado: false, criado_em: '2026-09-10T10:00:00Z', motivo: 'expirado' }] };
            if (b.acao === 'dispensar') { S.av = S.av.filter((x) => x.id !== b.avisoId); S.antes++; return { ok: true }; }
            if (b.acao === 'dispensar_todos') { S.av = S.av.filter((x) => x.fixado); return { ok: true }; }
            return {};
        },
        'gerenciar-avisos': (b) => {
            S.avp = S.avp || [
                { id: 'a1', turma_id: 'T1', titulo: 'Atividade nova: Pesquisa com o Perplexity', mensagem: 'Publiquei uma atividade nova no menu Atividades.', fixado: false, criado_em: new Date(Date.now() - 3600e3).toISOString(), expira_em: new Date(Date.now() + 6 * 86400e3).toISOString() },
                { id: 'a2', turma_id: 'T1', titulo: 'Regras do curso', mensagem: 'Leiam o Termo de Uso.', fixado: true, criado_em: '2026-09-01T10:00:00Z', expira_em: null },
                { id: 'a3', turma_id: 'T1', titulo: 'Aula de sexta mudou de horário', mensagem: 'Começa às 19h.', fixado: false, criado_em: '2026-09-20T10:00:00Z', expira_em: '2026-10-04T10:00:00Z' },
            ];
            if (b.acao === 'listar') return { avisos: S.avp };
            if (b.acao === 'criar') { S.criadoAviso = b; S.avp.unshift({ id: 'n' + S.avp.length, turma_id: 'T1', titulo: b.titulo, mensagem: b.mensagem, fixado: !!b.fixado, criado_em: new Date().toISOString(), expira_em: b.expiraEm }); return { aviso: {} }; }
            if (b.acao === 'atualizar') { const x = S.avp.find((y) => y.id === b.avisoId); Object.assign(x, { titulo: b.titulo, mensagem: b.mensagem, fixado: !!b.fixado }); if ('expiraEm' in b) x.expira_em = b.expiraEm; return { aviso: x }; }
            return {};
        },
        'simular-aluno': (b2) => {
            S.sim = S.sim || [];
            S.sim.push(b2.acao + ':' + (b2.modo || ''));
            if (b2.acao === 'alunos') return { turmas: [{ id: 'T1', nome: 'PIBIEX 26', ativa: true }, { id: 'T2', nome: 'Turma antiga', ativa: false }], alunos: [
                { id: '11111111-1111-1111-1111-111111111111', nome_completo: 'Ana Souza Lima', ativo: true, turma_id: 'T1' },
                { id: '22222222-2222-2222-2222-222222222222', nome_completo: 'Bruno Carvalho', ativo: true, turma_id: 'T1' },
                { id: '33333333-3333-3333-3333-333333333333', nome_completo: 'Carla Dias', ativo: true, turma_id: 'T2' } ] };
            if (b2.acao === 'iniciar') return { modo: b2.modo, token: 'sim-token-123', expiraEm: new Date(Date.now() + 2 * 3600e3).toISOString(), aluno: b2.modo === 'demo' ? { id: '00000000-0000-0000-0000-000000000000', nomeCompleto: 'Aluno de demonstração', usuario: 'demonstracao', email: null, turmaId: 'T1', precisaTrocarSenha: false, precisaAceitarTermos: false, fotoUrl: null } : { id: b2.alunoId, nomeCompleto: 'Ana Souza Lima', usuario: 'ana.lima', email: null, turmaId: 'T1', precisaTrocarSenha: false, precisaAceitarTermos: false, fotoUrl: null } };
            return { ok: true };
        },
        'cadastrar-aluno': (b2) => {
            const dia = 86400e3, agora = Date.now();
            const mk = (id, nome, usuario, turma, nasc, email, termo, primeiro, acessoDias) => ({ id, nome_completo: nome, usuario, turma_id: turma, data_nascimento: nasc, email: email, email_confirmado: !!email, precisa_trocar_senha: primeiro, criado_em: new Date(agora - 30 * dia).toISOString(), turmaNome: 'PIBIEX 26', termoAceito: termo ? { versao: 'v2', aceitoEm: new Date(agora - 20 * dia).toISOString() } : null, ultimoAcesso: acessoDias === null ? null : new Date(agora - acessoDias * dia).toISOString(), ativo: true });
            if (b2.acao === 'listar') return { turmas: [{ id: 'T1', nome: 'PIBIEX 26 · Inteligência Artificial', ativa: true }, { id: 'T2', nome: 'Turma antiga 2025', ativa: false }], alunos: [
                mk('a1', 'Ana Souza Lima', 'ana.lima', 'T1', '2009-05-10', 'ana@exemplo.com', true, false, 0.1),
                mk('a2', 'Bruno Carvalho Mota', 'bruno.mota', 'T1', '2008-02-01', null, true, false, 2),
                mk('a3', 'Carla Dias', 'carla.dias', 'T1', '2001-11-20', 'carla@exemplo.com', false, true, null),
                mk('a4', 'Diego Reis', 'diego.reis', 'T1', '2010-07-07', null, false, true, null),
                mk('a5', 'Elaine Nunes', 'elaine.nunes', 'T1', '2007-12-25', 'elaine@exemplo.com', true, false, 9),
                mk('a6', 'Fábio Rocha', 'fabio.rocha', 'T2', '1999-03-03', null, true, false, 60),
            ] };
            if (b2.acao === 'ver_senha') return { senha: '48213' };
            return {};
        },
        'gerenciar-turmas': (b) => ({ turmas: [{ id: 'T1', nome: 'PIBIEX 26 · Inteligência Artificial', ano: 2026, ativa: true, vinculos: { alunos: 21, modulos: 3, avisos: 2, mensagens: 140 } }, { id: 'T2', nome: 'Turma antiga 2025', ano: 2025, ativa: false, vinculos: { alunos: 3, modulos: 1, avisos: 0, mensagens: 0 } }, { id: 'T3', nome: 'Turma de teste', ano: 2026, ativa: true, vinculos: { alunos: 0, modulos: 0, avisos: 0, mensagens: 0 } }] }),
        'gerenciar-chamadas': (b) => {
            const agora = Date.now();
            if (b.acao === 'listar_ativas') return { chamadas: [{ id: 'c1', turma_id: 'T1', titulo: 'Aula de prompts — 21/10', horas: 2, pin: '4821', expira_em: new Date(agora + 6 * 60e3).toISOString(), totalRegistrados: 14, totalElegiveis: 21 }] };
            if (b.acao === 'listar_historico') return { chamadas: Array.from({ length: 27 }, (_, i) => ({ id: 'h' + i, titulo: i % 3 === 0 ? null : 'Aula ' + (27 - i), horas: 1 + (i % 2), criado_em: new Date(agora - (i + 1) * 3 * 86400e3).toISOString(), totalRegistrados: 21 - (i % 9), totalElegiveis: 21 })) };
            if (b.acao === 'resumo_horas') return { resumo: [
                { aluno_id: 'a1', nome_completo: 'Ana Souza Lima', horas_conquistadas: 18, horas_possiveis: 20 },
                { aluno_id: 'a2', nome_completo: 'Bruno Carvalho Mota', horas_conquistadas: 11, horas_possiveis: 20 },
                { aluno_id: 'a3', nome_completo: 'Carla Dias', horas_conquistadas: 0, horas_possiveis: 20 },
                { aluno_id: 'a4', nome_completo: 'Diego Reis', horas_conquistadas: 15, horas_possiveis: 20 },
                { aluno_id: 'a5', nome_completo: 'Elaine Nunes', horas_conquistadas: 8, horas_possiveis: 20 } ] };
            if (b.acao === 'detalhe') return { chamada: { id: b.chamadaId, titulo: 'Aula de prompts — 21/10', horas: 2, criado_em: new Date(agora - 600e3).toISOString() }, alunos: [
                { id: 'a1', nomeCompleto: 'Ana Souza Lima', presente: true, registradoEm: new Date(agora - 300e3).toISOString() },
                { id: 'a2', nomeCompleto: 'Bruno Carvalho Mota', presente: false },
                { id: 'a3', nomeCompleto: 'Carla Dias', presente: false } ] };
            if (b.acao === 'criar') return { totalElegiveis: 21, chamada: { id: 'cNova', pin: '7733' } };
            return {};
        },
        'gerenciar-desafios': (b) => {
            if (b.acao === 'listar') return { desafios: [
                { id: 'd1', titulo: 'Desafio 3: Resumo com IA', descricao: 'Peça a uma IA um resumo de um texto e compare com o original.', semana: 3, pontos: 10, data_fim: '2026-10-28', ativo: true, pendentes: 2, envios: [
                    { id: 'e1', alunoNome: 'Ana Souza Lima', enviado_em: new Date().toISOString(), link_ou_arquivo: 'https://exemplo.com/a', avaliado: false },
                    { id: 'e2', alunoNome: 'Bruno Carvalho', enviado_em: new Date().toISOString(), link_ou_arquivo: 'https://exemplo.com/b', avaliado: false },
                    { id: 'e3', alunoNome: 'Carla Dias', enviado_em: new Date().toISOString(), link_ou_arquivo: 'https://exemplo.com/c', avaliado: true, pontos: 9, feedback: 'Muito bom' } ] },
                { id: 'd2', titulo: 'Desafio 2: Prompt criativo', descricao: 'Crie um prompt para gerar uma história.', semana: 2, pontos: 10, data_fim: null, ativo: true, pendentes: 0, envios: [ { id: 'e4', alunoNome: 'Diego Reis', enviado_em: new Date().toISOString(), link_ou_arquivo: 'https://exemplo.com/d', avaliado: true, pontos: 10, feedback: null } ] },
                { id: 'd3', titulo: 'Desafio 1: Apresente-se com IA', descricao: 'Use a IA para escrever sua apresentação.', semana: 1, pontos: 5, data_fim: null, ativo: false, pendentes: 0, envios: [] } ] };
            if (b.acao === 'ranking') return { semana: [ { posicao: 1, nome: 'Ana Souza Lima', pontos: 10, desafiosFeitos: 1 }, { posicao: 2, nome: 'Carla Dias', pontos: 9, desafiosFeitos: 1 }, { posicao: 3, nome: 'Bruno Carvalho', pontos: 0, desafiosFeitos: 0 } ], geral: [ { posicao: 1, nome: 'Ana Souza Lima', pontos: 25, desafiosFeitos: 3 }, { posicao: 2, nome: 'Carla Dias', pontos: 19, desafiosFeitos: 2 }, { posicao: 3, nome: 'Diego Reis', pontos: 10, desafiosFeitos: 1 }, { posicao: 4, nome: 'Bruno Carvalho', pontos: 0, desafiosFeitos: 0 } ] };
            return {};
        },
        'meus-dados': (b) => b.acao === 'listar' ? { pedidos: [{ id: 'p1', tipo: 'correcao', mensagem: 'Meu sobrenome está errado', status: 'atendido', resposta: 'Corrigido, obrigado!', criado_em: '2026-10-20T10:00:00Z' }] } : b.acao === 'exportar' ? { exportacao: { conta: { nome: 'Aluno Teste' } } } : { ok: true },
        'gerenciar-pedidos-privacidade': (b) => b.acao === 'listar' ? { pedidos: [
            { id: 'q1', tipo: 'exclusao', mensagem: 'Quero sair do curso e apagar tudo.', status: 'aberto', criado_em: new Date(Date.now() - 3 * 86400e3).toISOString(), alunos: { nome_completo: 'Bruno Carvalho', usuario: 'bruno' } },
            { id: 'q2', tipo: 'correcao', mensagem: 'Nome errado', status: 'atendido', resposta: 'Corrigido.', criado_em: '2026-10-10T10:00:00Z', atendido_em: '2026-10-11T10:00:00Z', alunos: { nome_completo: 'Ana Souza', usuario: 'ana' } }] } : { ok: true },
        'enviar-laboratorio': (b) => b.acao === 'listar' ? { envios: [{ laboratorio_id: 'L1', texto_resposta: 'Usei o prompt de resumo.', arquivo_url: null, criado_em: '2026-10-02T10:00:00Z' }] } : { ok: true },
        'galeria': (b) => b.acao === 'listar' ? { projetos: [
            { id: 'g1', aluno_id: 'EU', titulo: 'Cartaz da feira de ciências', descricao: 'Feito com IA de imagem.', arquivo_url: null, criado_em: '2026-10-12T10:00:00Z', autorNome: 'Aluno Teste', totalCurtidas: 3, euCurti: false, comentarios: [{ autorNome: 'Ana', comentario: 'Ficou ótimo!' }] },
            { id: 'g2', aluno_id: 'OUTRO', titulo: 'Poema com ChatGPT', descricao: null, arquivo_url: null, criado_em: '2026-10-14T10:00:00Z', autorNome: 'Bruno Carvalho', totalCurtidas: 1, euCurti: true, comentarios: [] } ] } : { ok: true },
        'gerenciar-notas': (b) => b.acao === 'listar' ? { notas: [
            { id: 'n1', titulo: 'Ideias de prompt', conteudo: '<div>Pedir <b>exemplos</b> antes</div>', atualizadoEm: '2026-10-15T10:00:00Z' },
            { id: 'n2', titulo: '', conteudo: '<div>Lembrar da aula de sexta</div>', atualizadoEm: '2026-10-16T10:00:00Z' } ] } : { ok: true },
        'gerenciar-laboratorio': (b) => ({ laboratorios: [
            { id: 'l1', titulo: 'Corrija o prompt', problema: 'O prompt abaixo gera respostas confusas. Reescreva.', instrucoes: 'Envie o novo prompt e o resultado.', dificuldade: 'facil', ativo: true, envios: [ { alunoNome: 'Ana Souza', enviado_em: new Date().toISOString(), arquivo_url: null, resposta_texto: 'Reescrevi assim...' } ] },
            { id: 'l2', titulo: 'Crie um agente simples', problema: 'Monte um fluxo com 3 passos.', instrucoes: null, dificuldade: 'dificil', ativo: false, envios: [] } ] }),
        'gerenciar-equipe': (b) => ({ equipe: [
            { id: 'e1', nome_completo: 'Professor Teste', cargo: 'professor', usuario: 'prof.teste', email: 'prof@exemplo.com', nivel_acesso: 'total', ativo: true },
            { id: 'e2', nome_completo: 'Assistente Lima', cargo: 'professor', usuario: 'ass.lima', email: 'ass@exemplo.com', nivel_acesso: 'restrito', ativo: true },
            { id: 'e3', nome_completo: 'Antigo Monitor', cargo: 'professor', usuario: 'monitor', email: 'm@exemplo.com', nivel_acesso: 'restrito', ativo: false } ] }),
        'moderar-galeria': (b) => ({ projetos: [
            { id: 'p1', titulo: 'Capa do livro feita com IA', autorNome: 'Ana Souza Lima', criado_em: new Date(Date.now() - 3600e3).toISOString(), totalCurtidas: 5, descricao: 'Usei um gerador de imagens.', arquivo_url: 'https://exemplo.com/img', comentarios: [ { id: 'c1', autor_tipo: 'aluno', autorNome: 'Bruno Carvalho', comentario: 'Ficou lindo!' }, { id: 'c2', autor_tipo: 'equipe', autorNome: 'Professor Teste', comentario: 'Parabéns!' } ] },
            { id: 'p2', titulo: 'Resumo da aula 3', autorNome: 'Carla Dias', criado_em: new Date(Date.now() - 3 * 86400e3).toISOString(), totalCurtidas: 1, descricao: null, arquivo_url: null, comentarios: [] } ] }),
        'gerenciar-prompts': (b) => ({ prompts: [
            { id: 'r1', titulo: 'Resumir um texto', categoria: 'Estudos', conteudo: 'Resuma o texto abaixo em 5 tópicos curtos, em linguagem simples: [cole o texto]', publico: true },
            { id: 'r2', titulo: 'Explicar como se eu tivesse 12 anos', categoria: 'Estudos', conteudo: 'Explique [assunto] como se eu tivesse 12 anos.', publico: true },
            { id: 'r3', titulo: 'Revisar redação', categoria: 'Escrita', conteudo: 'Revise minha redação e aponte erros de gramática.', publico: false } ] }),
        'gerenciar-recursos': (b) => ({ recursos: [
            { id: 'x1', titulo: 'Curso de IA para iniciantes', tipo: 'video', url: 'https://exemplo.com/curso', descricao: 'Canal gratuito', ordem: 1 },
            { id: 'x2', titulo: 'E-book de prompts', tipo: 'ebook', url: 'https://exemplo.com/ebook', descricao: null, ordem: 2 } ] }),
        'gerenciar-faq': (b) => ({ faqs: [
            { id: 'f1', pergunta: 'Esqueci minha senha. E agora?', resposta: 'Use "Esqueci usuário/senha" na tela de login.', ordem: 1, ativo: true },
            { id: 'f2', pergunta: 'Como envio um arquivo?', resposta: 'Em Meus Trabalhos, escolha o arquivo e clique em Enviar.', ordem: 2, ativo: true },
            { id: 'f3', pergunta: 'Pergunta antiga', resposta: 'Resposta antiga.', ordem: 3, ativo: false } ] }),
        'admin-pendencias': () => { window.__pend = (window.__pend || 0) + 1; return { trabalhos: window.__pend > 1 ? 4 : 3, desafios: 2, ultimo: { tipo: 'trabalho', aluno: 'Ana Souza Lima', titulo: 'IA na Prática', quando: new Date().toISOString() } }; },
        'painel-acesso': (b) => b.acao === 'resumo' ? { resumo: { online: 3, totalAlunos: 21, acessosHoje: 14, acessosOntem: 10, picoHora: 19, picoContagem: 6, mediaDiaria7d: 12.5, inativos7d: 4 } }
            : b.acao === 'linha_tempo' ? { pontos: Array.from({ length: 24 }, (_, i) => ({ inicio: new Date(Date.now() - (23 - i) * 3600e3).toISOString(), contagem: i % 5 })) }
            : b.acao === 'ranking' ? { ranking: [{ nome: 'Ana Souza', acessos: 12 }, { nome: 'Bruno Carvalho', acessos: 8 }] }
            : b.acao === 'mapa_calor' ? { celulas: [{ dia_semana: 3, hora: 19, contagem: 5 }] }
            : { alunos: [{ id: 'a1', nome_completo: 'Ana Souza', ultimo_acesso: new Date().toISOString(), acessos: 12, online: true }] },
        'admin-dashboard': () => ({ totalAlunos: 21, trabalhosPendentes: 3, totalDesafiosEnviados: 38, totalProjetosGaleria: 7, avisosRecentes: [ { titulo: 'Atividade nova: Perplexity', criado_em: new Date(Date.now() - 3600e3).toISOString() }, { titulo: 'Regras do curso', criado_em: '2026-09-01T10:00:00Z' } ] }),
        'chat-turma': (b) => { S.chatm = S.chatm || [{ id: 'm1', autorTipo: 'equipe', autorId: 'e1', autorNome: 'Professor Teste', autorFotoUrl: null, souEu: false, mensagem: 'Bom dia, turma!', apagada: false, editada: false, criadoEm: new Date(Date.now() - 600e3).toISOString(), podeEditar: false, podeApagar: false, anexo: null, reacoes: [] }];
            if (b.acao === 'listar') return { mensagens: S.chatm };
            if (b.acao === 'membros') return { membros: [] };
            if (b.acao === 'enviar') { S.chatm.push({ id: 'real', mensagem: b.mensagem, criadoEm: new Date().toISOString() }); return { ok: true }; }
            return {}; },
        'enviar-desafio': (b) => ({ eu: { pontos: 19, desafiosFeitos: 2, nivel: { faixa: 2, nome: 'Explorador', pontosParaProximo: 11 } }, semanaAtual: 3,
            rankingSemana: { alguemPontuou: true, totalAlunos: 21, podio: [ { posicao: 1, nome: 'Ana Souza', pontos: 10, souEu: false }, { posicao: 2, nome: 'Carla Dias', pontos: 9, souEu: true }, { posicao: 3, nome: 'Diego Reis', pontos: 7, souEu: false } ], eu: { posicao: 2, pontos: 9 } },
            rankingGeral: { alguemPontuou: true, totalAlunos: 21, podio: [ { posicao: 1, nome: 'Ana Souza', pontos: 25, souEu: false } ], eu: { posicao: 5, pontos: 19 } },
            desafios: [
              { id: 'd1', titulo: 'Desafio 4: Imagem com IA', semana: 4, pontos: 10, dataFim: '2026-12-30', descricao: 'Gere uma imagem com IA e explique o prompt.', meuEnvio: null },
              { id: 'd2', titulo: 'Desafio 3: Resumo com IA', semana: 3, pontos: 10, dataFim: '2026-12-20', descricao: 'Resuma um texto.', meuEnvio: { avaliado: false, linkOuArquivo: 'https://exemplo.com/a' } },
              { id: 'd3', titulo: 'Desafio 2: Prompt criativo', semana: 2, pontos: 10, dataFim: null, descricao: 'Crie um prompt.', meuEnvio: { avaliado: true, pontos: 9, feedback: 'Muito bom', linkOuArquivo: 'https://exemplo.com/b' } },
              { id: 'd4', titulo: 'Desafio 1: Apresentação', semana: 1, pontos: 5, dataFim: '2026-09-01', descricao: 'Apresente-se.', meuEnvio: null } ] }),
        'validar-sessao-aluno': () => ({ ok: true, aluno: { precisaAceitarTermos: false } }),
        'frequencia': () => ({ chamada: null }),
        'perfil-aluno': () => ({ perfil: { foto_url: null } }),
        'perfil-equipe': () => ({ perfil: { foto_url: null } }),
        'ranking-acesso': () => ({ ranking: [] }),
    };

    const original = window.fetch.bind(window);
    window.fetch = async (url, opts) => {
        url = String(url);
        const json = (obj) => new Response(JSON.stringify(obj), { status: 200, headers: { 'Content-Type': 'application/json' } });
        const m = url.match(/\/functions\/v1\/([a-z-]+)/);
        if (m) {
            const body = opts && opts.body ? JSON.parse(opts.body) : {};
            S.chamadas.push(m[1] + ':' + (body.acao || ''));
            const fn = respostas[m[1]];
            return json(fn ? fn(body) : {});
        }
        if (url.includes('/rest/v1/atividades')) return json([
            { id: 'A1', titulo: 'IA na Prática: Pesquisa com o Perplexity', descricao: 'Escolha UM dos três temas e pesquise.', data_entrega: new Date(Date.now() + 2 * 86400e3).toISOString(), horas_maximas: 3, criado_em: '2026-10-19T10:00:00Z', modulo_id: 'M1', modulos: { titulo: 'INTELIGÊNCIAS ARTIFICIAIS - IAs', turma_id: 'T1' } },
            { id: 'A2', titulo: 'Atividade 1: O que é IA?', descricao: null, data_entrega: '2026-10-05T20:00:00Z', horas_maximas: null, criado_em: '2026-09-30T10:00:00Z', modulo_id: 'M2', modulos: { titulo: 'INTRODUÇÃO', turma_id: 'T1' } },
            { id: 'A3', titulo: 'Diagnóstico inicial', descricao: null, data_entrega: null, horas_maximas: 1, criado_em: '2026-09-01T10:00:00Z', modulo_id: 'M2', modulos: { titulo: 'INTRODUÇÃO', turma_id: 'T1' } },
        ]);
        if (url.includes('/rest/v1/trabalhos_enviados')) return json([{ atividade_id: 'A1', status: 'enviado' }, { atividade_id: 'A1', status: 'enviado' }, { atividade_id: 'A1', status: 'avaliado' }, { atividade_id: 'A3', status: 'avaliado' }]);
        if (url.includes('/rest/v1/laboratorio_ia')) return json([
            { id: 'L1', titulo: 'Resuma um texto longo com IA', problema: 'Pegue um artigo de 3 páginas e peça um resumo em 5 tópicos.', instrucoes: 'Envie o prompt usado.', dificuldade: 'facil', criado_em: '2026-10-01T10:00:00Z' },
            { id: 'L2', titulo: 'Crie uma imagem de capa', problema: 'Gere uma capa para um trabalho escolar.', instrucoes: null, dificuldade: 'medio', criado_em: '2026-10-05T10:00:00Z' },
            { id: 'L3', titulo: 'Automatize uma planilha', problema: 'Use IA para escrever uma fórmula complexa.', instrucoes: null, dificuldade: 'dificil', criado_em: '2026-10-10T10:00:00Z' } ]);
        if (url.includes('/rest/v1/prompts')) return json([
            { id: 'pr1', titulo: 'Resumo em tópicos', categoria: 'Estudo', conteudo: 'Resuma o texto abaixo em 5 tópicos curtos.', ordem: 1 },
            { id: 'pr2', titulo: 'Explique como se eu tivesse 12 anos', categoria: 'Estudo', conteudo: 'Explique {assunto} de forma simples.', ordem: 2 },
            { id: 'pr3', titulo: 'Legenda para foto', categoria: 'Criação', conteudo: 'Escreva 3 legendas criativas para uma foto de {tema}.', ordem: 3 } ]);
        if (url.includes('/rest/v1/faq')) return json([
            { id: 'f1', pergunta: 'Como registro minha presença?', resposta: 'Quando a chamada abrir, aparece um aviso no topo da tela.', ordem: 1 },
            { id: 'f2', pergunta: 'Esqueci minha senha', resposta: 'Peça ao professor para redefinir.', ordem: 2 } ]);
        if (url.includes('/rest/v1/recursos_extras')) return json([
            { id: 'r1', titulo: 'Curso grátis de prompts', tipo: 'video', url: 'https://exemplo.com/v', descricao: 'Playlist com 10 aulas', ordem: 1 },
            { id: 'r2', titulo: 'E-book de IA', tipo: 'ebook', url: 'https://exemplo.com/e', descricao: null, ordem: 2 },
            { id: 'r3', titulo: 'Blog de novidades', tipo: 'site', url: 'https://exemplo.com/b', descricao: 'Atualizações semanais', ordem: 3 } ]);
        if (url.includes('/rest/v1/ferramentas_ia')) return json([
            { id: 'fe1', nome: 'ChatGPT', categoria: 'Texto', descricao: 'Conversa e escrita', url: 'https://chatgpt.com', ordem: 1 },
            { id: 'fe2', nome: 'Claude', categoria: 'Texto', descricao: 'Textos longos', url: 'https://claude.ai', ordem: 2 },
            { id: 'fe3', nome: 'Midjourney', categoria: 'Imagem', descricao: 'Imagens artísticas', url: 'https://midjourney.com', ordem: 3 } ]);
        if (url.includes('/rest/v1/modulos') && decodeURIComponent(url).includes('aulas(')) { const d = (n) => new Date(Date.now() + n * 86400e3).toISOString().slice(0, 10); return json([
            { id: 'M2', titulo: 'INTRODUÇÃO', descricao: 'Primeiros passos', ordem: 1, aulas: [ { id: 'u1', titulo: 'Boas-vindas', data_aula: d(-14), horario_inicio: '19:00:00', horario_fim: '21:00:00', ordem: 1 }, { id: 'u2', titulo: 'O que é IA?', data_aula: d(-7), horario_inicio: '19:00:00', horario_fim: '21:00:00', ordem: 2 } ] },
            { id: 'M1', titulo: 'INTELIGÊNCIAS ARTIFICIAIS - IAs', descricao: null, ordem: 2, aulas: [ { id: 'u3', titulo: 'Perplexity na prática', data_aula: d(2), horario_inicio: '19:00:00', horario_fim: '21:00:00', ordem: 1 }, { id: 'u4', titulo: 'Gerando imagens', data_aula: d(9), horario_inicio: null, horario_fim: null, ordem: 2 }, { id: 'u5', titulo: 'Aula extra (a definir)', data_aula: null, horario_inicio: null, horario_fim: null, ordem: 3 } ] },
            { id: 'M3', titulo: 'MÓDULO FINAL', descricao: null, ordem: 3, aulas: [] } ]); }
        if (url.includes('/rest/v1/modulos') && decodeURIComponent(url).includes('conteudos(')) return json([
            { id: 'M2', titulo: 'INTRODUÇÃO', descricao: 'Primeiros passos com IA', ordem: 1, conteudos: [
                { id: 'k1', modulo_id: 'M2', titulo: 'Slides da aula 1', tipo: 'pdf', url: null, descricao: null, ordem: 1, arquivo_caminho: 'x/a.pdf', arquivo_nome: 'aula1.pdf', arquivo_tipo: 'application/pdf', arquivo_tamanho: 1800000, permite_baixar: true },
                { id: 'k2', modulo_id: 'M2', titulo: 'Vídeo: o que é IA', tipo: 'video', url: 'https://exemplo.com/v', descricao: null, ordem: 2, arquivo_caminho: null, arquivo_nome: null, arquivo_tipo: null, arquivo_tamanho: null, permite_baixar: false } ] },
            { id: 'M1', titulo: 'INTELIGÊNCIAS ARTIFICIAIS - IAs', descricao: null, ordem: 2, conteudos: [
                { id: 'k3', modulo_id: 'M1', titulo: 'Slides IA na prática', tipo: 'slide', url: null, descricao: null, ordem: 1, arquivo_caminho: 'x/b.pptx', arquivo_nome: 'ia-na-pratica.pptx', arquivo_tipo: 'x', arquivo_tamanho: 4200000, permite_baixar: true },
                { id: 'k4', modulo_id: 'M1', titulo: 'Perplexity: guia', tipo: 'link', url: 'https://perplexity.ai', descricao: null, ordem: 2, arquivo_caminho: null, arquivo_nome: null, arquivo_tipo: null, arquivo_tamanho: null, permite_baixar: false },
                { id: 'k5', modulo_id: 'M1', titulo: 'Prompt: exemplos', tipo: 'pdf', url: null, descricao: null, ordem: 3, arquivo_caminho: 'x/c.pdf', arquivo_nome: 'prompts.pdf', arquivo_tipo: 'application/pdf', arquivo_tamanho: 900000, permite_baixar: true } ] },
            { id: 'M3', titulo: 'MÓDULO NOVO (vazio)', descricao: null, ordem: 3, conteudos: [] } ]);
        if (url.includes('/rest/v1/modulos')) return json([{ id: 'M1', titulo: 'INTELIGÊNCIAS ARTIFICIAIS - IAs' }, { id: 'M2', titulo: 'INTRODUÇÃO' }]);
        if (url.includes('/rest/v1/alunos')) return json([
            { id: '11111111-1111-1111-1111-111111111111', nome_completo: 'Ana Souza Lima', ativo: true, turma_id: 'T1', turmas: { nome: 'PIBIEX 26', ativa: true } },
            { id: '22222222-2222-2222-2222-222222222222', nome_completo: 'Bruno Carvalho', ativo: true, turma_id: 'T1', turmas: { nome: 'PIBIEX 26', ativa: true } },
            { id: '33333333-3333-3333-3333-333333333333', nome_completo: 'Carla Dias', ativo: true, turma_id: 'T2', turmas: { nome: 'Turma antiga', ativa: false } },
        ]);
        if (url.includes('/rest/v1/turmas')) return json([{ id: 'T1', nome: 'PIBIEX 26', ano: 2026, ativa: true }]);
        if (url.includes('/rest/v1/')) return new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json', 'Content-Range': '0-0/0' } });
        return original(url, opts);
    };
})();
