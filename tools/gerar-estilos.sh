#!/bin/sh
# Gera tailwind.css e pibiex-ui.css. Rode na raiz do projeto, depois de criar ou mudar classes.
npx --yes tailwindcss@3.4.17 -c tools/tailwind.config.js -i tools/tailwind-entrada.css -o tailwind.css --minify && python tools/gerar-ui-css.py
