// Configuração do Tailwind (estilos da plataforma). Para gerar o CSS depois de criar ou
// mudar classes nas páginas, na raiz do projeto:
//   npx tailwindcss@3.4.17 -c tools/tailwind.config.js -i tools/tailwind-entrada.css -o tailwind.css --minify
module.exports = {
  content: ['./*.html', './aluno/*.html', './admin/*.html', './*.js', './aluno/*.js', './admin/*.js'],
  theme: { extend: {} },
  plugins: [],
};
