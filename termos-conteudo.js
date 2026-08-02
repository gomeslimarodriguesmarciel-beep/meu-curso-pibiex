// /termos-conteudo.js
//
// Texto do Termo de Uso e Responsabilidade, usado pelo painel do professor
// para mostrar ou gerar o PDF do termo que um aluno específico assinou
// (admin/alunos.html). É uma cópia do conteúdo que está em termos.html.
//
// Se o texto do termo mudar: edite termos.html normalmente, mude
// VERSAO_TERMOS_ATUAL em supabase/functions/_shared/termos.ts, E atualize
// este arquivo também (mesma "versao" abaixo) — assim quem já assinou a
// versão antiga continua vendo, no painel do professor, o texto que
// realmente assinou.

window.TERMOS_CONTEUDO = {
    versao: '2026-08-02',
    titulo: 'Termo de Uso e Responsabilidade — PIBIEX 2026',
    preambulo: 'Este Termo estabelece as condições para utilização da plataforma PIBIEX 2026 ("Plataforma"), disponibilizada no âmbito do curso de extensão em Inteligência Artificial, sob responsabilidade da instituição de ensino e do professor coordenador. O acesso à Plataforma está condicionado à leitura e ao aceite integral deste Termo.',
    clausulas: [
        {
            titulo: '1. Objeto e finalidade',
            itens: [
                '1.1. A Plataforma destina-se exclusivamente a fins educacionais, sendo de uso restrito aos alunos regularmente matriculados no curso.',
                '1.2. A Plataforma compreende, entre outras funcionalidades: acompanhamento de conteúdo e cronograma; envio de trabalhos e atividades; participação em desafios semanais; utilização das ferramentas de inteligência artificial disponibilizadas pelo curso; e comunicação entre alunos e entre alunos e o professor sobre assuntos relacionados ao curso.',
                '1.3. O acesso é pessoal e intransferível. O aluno é responsável por manter sua senha em sigilo e não deve compartilhá-la com terceiros.',
            ],
        },
        {
            titulo: '2. Conduta do usuário',
            itens: [
                '2.1. O aluno compromete-se a tratar colegas e o professor com respeito em todas as áreas da Plataforma.',
                '2.2. É vedado o uso de linguagem ofensiva, discriminatória, de assédio, ou que constranja qualquer pessoa.',
                '2.3. É vedado o compartilhamento de dados pessoais de terceiros — fotografias, números de telefone, endereços, entre outros — sem a devida autorização.',
                '2.4. A Plataforma tem finalidade estritamente educacional e não deve ser utilizada como espaço de convívio pessoal ou de relacionamento fora do contexto do curso.',
                '2.5. O descumprimento destas condutas poderá resultar em restrição ou suspensão do acesso, a critério do professor.',
            ],
        },
        {
            titulo: '3. Comunicação entre usuários',
            itens: [
                '3.1. A Plataforma disponibiliza canais de comunicação — chat da turma e mensagens privadas entre alunos, ou entre aluno e professor — destinados a facilitar a comunicação sobre o curso.',
                '3.2. Considerando que grande parte dos alunos é menor de idade, e que a instituição de ensino e o professor coordenador possuem responsabilidade legal por eles durante o uso da Plataforma, fica estabelecido que o professor poderá acessar e revisar o conteúdo das conversas, incluindo as privadas, sempre que houver motivo razoável para isso.',
                '3.3. Tal revisão não é realizada de forma rotineira, restringindo-se a situações excepcionais, tais como: suspeita de uso indevido; comportamento de risco; conflitos entre alunos; necessidade de contato com os responsáveis legais; ou exigência de autoridade competente.',
                '3.4. Ao aceitar este Termo, o aluno declara estar ciente e de acordo com a possibilidade de revisão prevista nesta cláusula.',
            ],
        },
        {
            titulo: '4. Conteúdo publicado',
            itens: [
                '4.1. Trabalhos, imagens, projetos, prompts e comentários publicados na Galeria ou em qualquer outra área da Plataforma devem ser de autoria do aluno, ou este deve possuir autorização para publicá-los, além de serem compatíveis com um ambiente educacional.',
                '4.2. É vedada a publicação de fotografias, textos ou trabalhos de terceiros sem o devido consentimento.',
                '4.3. Qualquer conteúdo inadequado, ofensivo ou que viole direitos de terceiros poderá ser removido pelo professor a qualquer momento, independentemente de aviso prévio.',
            ],
        },
        {
            titulo: '5. Proteção de dados pessoais',
            itens: [
                '5.1. O aluno é responsável pelo uso realizado por meio de sua conta.',
                '5.2. Os dados cadastrados — nome, data de nascimento e e-mail — são utilizados exclusivamente para o funcionamento do curso e para a recuperação de acesso, não sendo compartilhados com terceiros externos à instituição.',
                '5.3. Pais e responsáveis legais poderão, a qualquer momento, solicitar ao professor informações sobre o uso da Plataforma por aluno menor de idade.',
            ],
        },
        {
            titulo: '6. Disposições finais',
            itens: [
                '6.1. Dúvidas sobre este Termo poderão ser esclarecidas diretamente com o professor responsável pela turma.',
                '6.2. Este Termo poderá ser atualizado. Em caso de alteração relevante de seu conteúdo, será solicitado novo aceite.',
            ],
        },
        {
            titulo: '7. Aceite',
            itens: [
                'Declaro que li e compreendi integralmente os termos apresentados neste documento e que aceito as condições de uso da Plataforma PIBIEX 2026.',
            ],
        },
    ],
};
