# Testes automáticos

Rodam sem internet e sem servidor, na pasta do projeto:

```
node tools/testes/verificar.mjs
```

O que é conferido:

1. Sintaxe de todo o JavaScript (arquivos e blocos dentro das páginas).
2. Todo arquivo usado pelas páginas (`src`/`href`) existe.
3. Nenhuma página pede fontes ao Google (privacidade dos alunos).
4. Ninguém usa as janelas `confirm()`/`prompt()` do navegador.
5. Toda página carrega o botão de acessibilidade.
6. Telas do aluno escapam o texto vindo do servidor (proteção contra código malicioso digitado por outro aluno).
7. Nenhuma chave secreta no site publicado.
8. Política de privacidade e termos existem.

A cada envio para o GitHub, a rotina `.github/workflows/verificar.yml` roda o mesmo teste; se algo quebrar, o GitHub avisa por e-mail.

A auditoria de segurança do servidor (permissões do banco, funções, arquivos privados) é separada e fica na pasta local `supabase/` (não vai para o GitHub).
