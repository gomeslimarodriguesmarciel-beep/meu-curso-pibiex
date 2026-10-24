# Testes automáticos

Nenhum destes testes lê, cria ou apaga dado real. O que precisa de "servidor" usa um servidor de mentira (`servidor-falso.js`).

## 1. Verificações do código (rápidas, sem navegador)

```
node tools/testes/verificar.mjs
```

1. Sintaxe de todo o JavaScript (arquivos e blocos dentro das páginas).
2. Todo arquivo usado pelas páginas (`src`/`href`) existe.
3. Nenhuma página pede fontes ao Google (privacidade dos alunos).
4. Ninguém usa as janelas `confirm()`/`prompt()` do navegador.
5. Toda página carrega o botão de acessibilidade e tem as proteções básicas de cabeçalho.
6. Telas do aluno escapam o texto vindo do servidor (proteção contra código malicioso digitado por outro aluno).
7. Nenhuma chave secreta no site publicado.
8. Política de privacidade e termos existem.

## 2. Testes no navegador (precisam de Edge ou Chrome instalado)

```
node tools/testes/fluxos.mjs
```

Abre cada página do aluno e do professor num navegador sem tela e confere que não há erro de JavaScript. Depois simula fluxos:
enviar uma atividade, a busca rápida (Ctrl+K), o pedido de privacidade do aluno e a resposta do professor.

Se o navegador não for achado sozinho, defina `CHROME_PATH` com o caminho dele.

## 3. Rotinas do GitHub (a aba "Actions" do repositório)

- `verificar.yml`: roda os testes 1 e 2 a cada envio para o GitHub. Se algo quebrar, o GitHub avisa por e-mail.
- `saude.yml`: **de hora em hora** confere se o site e o servidor estão no ar (só leituras). Se falhar, o GitHub avisa por e-mail.

A auditoria de segurança do servidor (permissões do banco, funções, arquivos privados) é separada e fica na pasta local `supabase/` (não vai para o GitHub).
