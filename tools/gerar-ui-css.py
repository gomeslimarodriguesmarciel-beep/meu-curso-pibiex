import re, os, glob
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

# tamanhos de texto fixos em px usados nas páginas (para o "texto maior" alcançar tudo)
tam = set()
for f in glob.glob("*.html") + glob.glob("aluno/*") + glob.glob("admin/*") + glob.glob("*.js"):
    if os.path.isfile(f):
        tam |= set(re.findall(r"text-\[([0-9.]+)px\]", open(f, encoding="utf-8", errors="ignore").read()))
tam = sorted(tam, key=float)

def esc(v): return v.replace(".", "\\.")
# Tamanhos pequenos demais para ler com conforto sobem um pouco, em todas as páginas.
# (O "texto maior" da acessibilidade parte destes valores já corrigidos.)
MINIMOS = {"9.5": 11.5, "10": 11.5, "10.5": 12, "11": 12.5, "11.5": 12.5}
base_texto = ""
for v, novo_tam in MINIMOS.items():
    if v in tam:
        base_texto += f"html .text-\\[{esc(v)}px\\] {{ font-size: {novo_tam}px; }}\n"

regras_texto = ""
for nivel, fator in ((1, 1.125), (2, 1.25)):
    for v in tam:
        base = MINIMOS.get(v, float(v))
        regras_texto += f"html.a11y-texto-{nivel} .text-\\[{esc(v)}px\\] {{ font-size: {round(base * fator, 2)}px; }}\n"

css = r"""/* /pibiex-ui.css
 *
 * Acabamento e acessibilidade compartilhados por TODAS as páginas (aluno, professor,
 * login e páginas públicas). Carregado depois do tailwind.css.
 *
 * Preferências do usuário (alto contraste, tamanho do texto, menos animações) são
 * aplicadas por /acessibilidade.js como classes no <html>: a11y-contraste,
 * a11y-texto-1, a11y-texto-2, a11y-sem-movimento.
 *
 * A seção "TEXTO MAIOR" abaixo é gerada a partir dos tamanhos em px usados nas
 * páginas (tools/gerar-ui-css.py); se criar um tamanho novo, gere de novo.
 */

/* ---------------------------------------------------------------- base */
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
[hidden] { display: none !important; }
body { text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; }

/* Foco visível em tudo que se navega pelo teclado (antes dependia de cada página). */
:focus-visible { outline: 2px solid #1E3A8A; outline-offset: 2px; border-radius: 4px; }
aside :focus-visible, .bg-gray-900 :focus-visible, [style*="gradient"] :focus-visible { outline-color: #A3E635; }
input:focus-visible, textarea:focus-visible, select:focus-visible { outline-offset: 0; }
::placeholder { color: #6B7280; opacity: 1; }

/* Cinzas claros demais para texto (contraste abaixo de 4,5:1 sobre branco). */
html body .text-gray-400 { color: #6B7280; }
html body .hover\:text-gray-700:hover { color: #374151; }

/* Link "Pular para o conteúdo": só aparece quando recebe o foco do teclado. */
.pular-conteudo { position: fixed; left: 12px; top: -80px; z-index: 2147483001; background: #fff; color: #0B1B4A; font: 700 14px/1 'Inter', system-ui, sans-serif;
                  padding: 12px 18px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,.35); text-decoration: none; transition: top .15s ease; }
.pular-conteudo:focus { top: 12px; outline: 3px solid #A3E635; }

/* Alvos de toque confortáveis no celular. */
@media (pointer: coarse) {
    button, [role="button"], select, input[type="checkbox"], input[type="radio"] { min-height: 36px; }
}

/* Respeita a preferência do sistema por menos movimento. */
@media (prefers-reduced-motion: reduce) {
    html { scroll-behavior: auto; }
    *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; }
}

/* ---------------------------------------------------------------- menos animações (escolha do usuário) */
html.a11y-sem-movimento { scroll-behavior: auto; }
html.a11y-sem-movimento *, html.a11y-sem-movimento *::before, html.a11y-sem-movimento *::after {
    animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; scroll-behavior: auto !important;
}

/* ---------------------------------------------------------------- texto maior */
html.a11y-texto-1 { font-size: 112.5%; }
html.a11y-texto-2 { font-size: 125%; }
html.a11y-texto-1 body, html.a11y-texto-2 body { line-height: 1.55; }
""" + base_texto + r"""
/* Letras claras com pouca opacidade sobre fundo azul: sobem para ler melhor (contraste mínimo 4,5:1). */
html body .text-white\/50 { color: rgb(255 255 255 / .75); } html body .text-white\/60 { color: rgb(255 255 255 / .82); }
html body .text-white\/70 { color: rgb(255 255 255 / .86); } html body .text-white\/80 { color: rgb(255 255 255 / .9); }
html body .text-blue-100\/30 { color: rgb(219 234 254 / .6); } html body .text-blue-100\/50 { color: rgb(219 234 254 / .8); }
html body .text-blue-100\/60 { color: rgb(219 234 254 / .85); } html body .text-blue-100\/70 { color: rgb(219 234 254 / .9); }
html body .text-blue-100\/80 { color: rgb(219 234 254 / .92); } html body .text-blue-100\/85 { color: rgb(219 234 254 / .95); }
""" + regras_texto + r"""
/* ---------------------------------------------------------------- alto contraste */
html.a11y-contraste {
    --pibiex-papel: #FFFFFF; --pibiex-texto: #000000; --pibiex-texto-suave: #1F2937; --pibiex-borda: #4B5563;
    --pibiex-dourado-profundo: #365314;
}
html.a11y-contraste body { background: #FFFFFF; color: #000; }

/* Textos acinzentados ficam escuros sobre fundo claro. */
html.a11y-contraste .text-gray-300, html.a11y-contraste .text-gray-400, html.a11y-contraste .text-gray-500,
html.a11y-contraste .text-gray-600, html.a11y-contraste .text-slate-500, html.a11y-contraste .text-slate-600 { color: #111827 !important; }
html.a11y-contraste .text-gray-700 { color: #000 !important; }
html.a11y-contraste ::placeholder { color: #374151; }

/* Áreas escuras: textos esmaecidos viram branco puro. */
html.a11y-contraste aside .text-slate-400, html.a11y-contraste aside .text-slate-500, html.a11y-contraste aside [class*="text-white/"], html.a11y-contraste aside [class*="text-blue-"],
html.a11y-contraste .bg-gray-900 .text-gray-300, html.a11y-contraste .bg-gray-900 .text-gray-400, html.a11y-contraste .bg-blue-950 [class*="text-blue-"],
html.a11y-contraste [style*="gradient"] [class*="text-blue-100"], html.a11y-contraste [style*="gradient"] [class*="text-white/"],
html.a11y-contraste [style*="gradient"] [class*="text-blue-200"],
html.a11y-contraste .hero-bg [class*="text-blue-"], html.a11y-contraste .hero-bg [class*="text-white/"],
html.a11y-contraste footer [class*="text-blue-"], html.a11y-contraste footer [class*="text-white/"], html.a11y-contraste footer a { color: #FFFFFF !important; }

/* Painel de Controle (tema escuro próprio): o cinza-azulado dos rótulos era fraco demais. */
html body .painel-fundo { --text-muted: #909ACB; --text-secondary: #C3CAEA; }
html.a11y-contraste body .painel-fundo { --text-muted: #E8EBFF; --text-secondary: #FFFFFF; --border: rgba(255,255,255,.55); --status-muted: #AEB6E6; }
html.a11y-contraste aside { background: #0B1B4A !important; }
html.a11y-contraste aside a { opacity: 1; }
html.a11y-contraste aside a[aria-current="page"] { outline: 2px solid #FFFFFF; outline-offset: -2px; background: rgba(255,255,255,.16) !important; }

/* Bordas e campos bem marcados. */
html.a11y-contraste .border, html.a11y-contraste .border-b, html.a11y-contraste .border-t, html.a11y-contraste .border-gray-100,
html.a11y-contraste .border-gray-200, html.a11y-contraste .border-gray-300 { border-color: #4B5563 !important; }
html.a11y-contraste input:not([type="checkbox"]):not([type="radio"]), html.a11y-contraste textarea, html.a11y-contraste select { border: 2px solid #374151 !important; background: #fff; color: #000; }
html.a11y-contraste .shadow-sm, html.a11y-contraste .shadow-lg, html.a11y-contraste .shadow-xl, html.a11y-contraste .shadow-2xl { box-shadow: 0 0 0 1.5px #4B5563 !important; }

/* Links de texto sublinhados; foco grosso. */
html.a11y-contraste main a:not([class*="bg-"]):not([class*="btn"]):not([class*="rounded"]) { text-decoration: underline; text-underline-offset: 3px; }
html.a11y-contraste :focus-visible { outline: 3px solid #000; outline-offset: 2px; box-shadow: 0 0 0 6px #FDE047; }
html.a11y-contraste aside :focus-visible, html.a11y-contraste .bg-gray-900 :focus-visible, html.a11y-contraste [style*="gradient"] :focus-visible { outline-color: #FFFFFF; box-shadow: 0 0 0 6px #000; }

/* Etiquetas e selos claros: texto no tom mais escuro. */
html.a11y-contraste [class*="bg-"][class*="-50"] { color: #000; }
html.a11y-contraste .text-green-600, html.a11y-contraste .text-green-700 { color: #14532D !important; }
html.a11y-contraste .text-red-600, html.a11y-contraste .text-red-500 { color: #7F1D1D !important; }
html.a11y-contraste .text-blue-600, html.a11y-contraste .text-blue-700 { color: #1E3A8A !important; }
html.a11y-contraste .text-amber-600, html.a11y-contraste .text-amber-700 { color: #78350F !important; }

/* ---------------------------------------------------------------- acabamento geral */
main h1 { letter-spacing: -.02em; }
/* Campos: foco mais claro, sem depender só do contorno. */
main input:focus, main select:focus, main textarea:focus { border-color: #1E3A8A; box-shadow: 0 0 0 3px rgba(30,58,138,.14); }
main input:disabled, main select:disabled, main textarea:disabled, button:disabled { cursor: not-allowed; }
/* Cartões brancos com uma sombra suave, como nas telas novas. */
main .bg-white[class*="rounded"][class*="border"] { box-shadow: 0 1px 2px rgba(15,23,42,.04); }
/* Linhas de tabela e itens clicáveis respondem ao ponteiro. */
main tbody tr { transition: background .12s; }
main tbody tr:hover { background: #F8FAFC; }

/* Esqueleto de carregamento (no lugar do texto "Carregando..."). */
.skel { display: grid; gap: 10px; padding: 6px 0; max-width: 520px; }
.skel i { display: block; height: 14px; border-radius: 8px; background: linear-gradient(90deg, #EEF2F7 25%, #E2E8F0 37%, #EEF2F7 63%); background-size: 400% 100%; animation: skel-brilho 1.4s ease infinite; }
.skel i:nth-child(1) { width: 62%; } .skel i:nth-child(2) { width: 100%; } .skel i:nth-child(3) { width: 80%; }
@keyframes skel-brilho { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

/* Mensagens de "lista vazia": centralizadas, com ícone e moldura tracejada. */
.estado-vazio { text-align: center; padding: 30px 18px !important; border: 1.5px dashed #CBD5E1 !important; border-radius: 14px !important; background: #fff !important;
                color: #4B5563 !important; font-size: 13.5px !important; line-height: 1.5; }
.estado-vazio::before { content: ""; display: block; width: 38px; height: 38px; margin: 0 auto 10px; opacity: .8;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394A3B8' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 13l2.5-7h11L20 13'/%3E%3Cpath d='M4 13v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5h-5a3 3 0 0 1-6 0z'/%3E%3C/svg%3E") center/contain no-repeat; }
html.a11y-contraste .estado-vazio { border-color: #111827 !important; color: #000 !important; }

/* Avisos na tela (no lugar do alert do navegador). */
.pibiex-avisos { position: fixed; right: 16px; bottom: 16px; z-index: 2147483100; display: flex; flex-direction: column; gap: 10px; width: min(380px, calc(100vw - 32px)); pointer-events: none; }
.pibiex-aviso { pointer-events: auto; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; padding: 13px 14px 13px 16px; border-radius: 12px;
    background: #0F172A; color: #fff; font: 600 13.5px/1.45 'Inter', system-ui, sans-serif; box-shadow: 0 14px 36px rgba(2,6,23,.35); border-left: 5px solid #A3E635; animation: aviso-entra .22s ease; }
.pibiex-aviso.erro { border-left-color: #F87171; }
.pibiex-aviso.saindo { opacity: 0; transform: translateY(6px); transition: opacity .2s, transform .2s; }
.pibiex-aviso span { overflow-wrap: anywhere; }
.pibiex-aviso button { flex-shrink: 0; background: none; border: 0; color: #CBD5E1; font-size: 20px; line-height: 1; cursor: pointer; padding: 0 2px; }
.pibiex-aviso button:hover { color: #fff; }
@keyframes aviso-entra { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@media (max-width: 640px) { .pibiex-avisos { right: 12px; left: 12px; width: auto; bottom: calc(12px + env(safe-area-inset-bottom)); } }
html.a11y-contraste .pibiex-aviso { background: #000; border: 2px solid #fff; border-left-width: 6px; }

/* ---------------------------------------------------------------- cartão "Aparência e acessibilidade" (Perfil) */
.a11y-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 2px rgba(15,23,42,.04); }
.a11y-card-topo { display: flex; align-items: center; gap: 12px; padding: 18px 20px; background: linear-gradient(135deg, #0B1B4A 0%, #1E3A8A 100%); color: #fff; }
.a11y-card-topo .icone { width: 40px; height: 40px; border-radius: 12px; background: rgba(255,255,255,.12); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.a11y-card-topo h2 { margin: 0; font-size: 16px; font-weight: 800; }
.a11y-card-topo p { margin: 2px 0 0; font-size: 12.5px; color: #C7D2FE; }
.a11y-linha { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 20px; border-top: 1px solid #F1F5F9; }
.a11y-linha:first-of-type { border-top: 0; }
.a11y-linha .texto { min-width: 0; }
.a11y-linha .titulo { font-size: 14px; font-weight: 700; color: #111827; margin: 0; }
.a11y-linha .desc { font-size: 12.5px; color: #4B5563; margin: 3px 0 0; line-height: 1.45; }
.a11y-chave { position: relative; width: 46px; height: 26px; flex-shrink: 0; border-radius: 999px; border: 0; background: #9CA3AF; cursor: pointer; transition: background .2s; padding: 0; }
.a11y-chave::after { content: ""; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.35); transition: transform .2s; }
.a11y-chave[aria-checked="true"] { background: #16A34A; }
.a11y-chave[aria-checked="true"]::after { transform: translateX(20px); }
.a11y-segmentos { display: inline-flex; border: 1.5px solid #CBD5E1; border-radius: 12px; overflow: hidden; flex-shrink: 0; }
.a11y-segmentos button { border: 0; background: #fff; padding: 8px 14px; cursor: pointer; font-weight: 800; color: #374151; line-height: 1; min-width: 44px; }
.a11y-segmentos button + button { border-left: 1.5px solid #CBD5E1; }
.a11y-segmentos button[aria-checked="true"] { background: #1E3A8A; color: #fff; }
.a11y-previa { margin: 0 20px 16px; padding: 14px 16px; border-radius: 12px; background: #F8FAFC; border: 1px dashed #CBD5E1; }
.a11y-previa b { display: block; font-size: 14px; color: #111827; }
.a11y-previa span { font-size: 12.5px; color: #4B5563; }
.a11y-rodape { padding: 0 20px 18px; }
.a11y-restaurar { background: none; border: 0; color: #1E3A8A; font-weight: 700; font-size: 13px; cursor: pointer; padding: 6px 0; text-decoration: underline; text-underline-offset: 3px; }
@media (max-width: 520px) { .a11y-linha { flex-direction: column; align-items: flex-start; } }
html.a11y-contraste .a11y-card { border: 2px solid #111827; box-shadow: none; }
html.a11y-contraste .a11y-linha .desc, html.a11y-contraste .a11y-previa span { color: #111827; }
html.a11y-contraste .a11y-chave { background: #374151; }
html.a11y-contraste .a11y-chave[aria-checked="true"] { background: #14532D; }
html.a11y-contraste .a11y-segmentos, html.a11y-contraste .a11y-segmentos button + button { border-color: #111827; }

/* Interruptor pequeno dentro do menu da conta (topo). */
.a11y-menu-item { display: flex; width: 100%; align-items: center; justify-content: space-between; gap: 10px; text-align: left; padding: 8px 16px; font-size: 13.5px; font-weight: 600; color: #374151; background: none; border: 0; cursor: pointer; }
.a11y-menu-item:hover { background: rgba(0,0,0,.04); }
.a11y-menu-item .a11y-chave { width: 36px; height: 20px; }
.a11y-menu-item .a11y-chave::after { top: 2px; left: 2px; width: 16px; height: 16px; }
.a11y-menu-item .a11y-chave[aria-checked="true"]::after { transform: translateX(16px); }
/* ---------------------------------------------------------------- listas organizadas (abas, cartões recolhíveis, selos) */
.abas { display: flex; flex-wrap: wrap; gap: 6px; }
.aba { display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 999px; border: 1.5px solid #E5E7EB; background: #fff; color: #374151;
       font-size: 13px; font-weight: 700; cursor: pointer; transition: background .15s, border-color .15s; }
.aba:hover { background: #F9FAFB; border-color: #CBD5E1; }
.aba[aria-selected="true"] { background: #111827; border-color: #111827; color: #fff; }
.aba .n { font-size: 11px; min-width: 20px; text-align: center; padding: 1px 6px; border-radius: 999px; background: #F3F4F6; color: #374151; font-weight: 800; }
.aba[aria-selected="true"] .n { background: rgba(255,255,255,.22); color: #fff; }
.aba .n.alerta { background: #FEF3C7; color: #92400E; }
.aba .n:empty { display: none; }
.aba[aria-selected="true"] .n.alerta { background: #FBBF24; color: #111827; }

.cx { background: #fff; border: 1px solid #E5E7EB; border-radius: 14px; overflow: hidden; }
.cx + .cx { margin-top: 10px; }
.cx > summary { list-style: none; cursor: pointer; display: flex; align-items: center; gap: 12px; padding: 14px 16px; }
.cx > summary::-webkit-details-marker { display: none; }
.cx > summary::after { content: ""; width: 8px; height: 8px; margin-left: auto; flex-shrink: 0; border-right: 2px solid #6B7280; border-bottom: 2px solid #6B7280; transform: rotate(45deg); transition: transform .15s; }
.cx[open] > summary::after { transform: rotate(-135deg); }
.cx[open] > summary { border-bottom: 1px solid #F1F5F9; }
.cx > summary:hover { background: #F9FAFB; }
.cx-corpo { padding: 16px; }
.cx-titulo { font-weight: 700; font-size: 14px; color: #111827; overflow-wrap: anywhere; }
.cx-sub { font-size: 12px; color: #6B7280; margin-top: 2px; overflow-wrap: anywhere; }
.cx-previa { font-size: 12.5px; color: #4B5563; margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.cx[open] .cx-previa { display: none; }
.cx.destaque { border-color: #FCD34D; box-shadow: 0 0 0 3px rgba(251,191,36,.25); }

.avatar-ini { width: 38px; height: 38px; border-radius: 50%; background: #DBEAFE; color: #1E3A8A; font-weight: 800; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.chip { display: inline-flex; align-items: center; font-size: 11px; font-weight: 800; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
.chip.ambar { background: #FEF3C7; color: #92400E; } .chip.verde { background: #DCFCE7; color: #166534; }
.chip.cinza { background: #F3F4F6; color: #4B5563; } .chip.azul { background: #DBEAFE; color: #1E40AF; } .chip.vermelho { background: #FEE2E2; color: #991B1B; }

.item-atv { display: flex; align-items: flex-start; gap: 10px; width: 100%; text-align: left; padding: 11px 12px; border-radius: 12px; border: 1.5px solid transparent; background: transparent; cursor: pointer; }
.item-atv:hover { background: #F3F4F6; }
.item-atv[aria-current="true"] { background: #fff; border-color: #111827; box-shadow: 0 2px 8px rgba(15,23,42,.08); }
.item-atv .t { font-size: 13px; font-weight: 700; color: #111827; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.item-atv .m { font-size: 11.5px; color: #6B7280; margin-top: 2px; }
.caixa-busca { width: 100%; border: 1.5px solid #E5E7EB; border-radius: 12px; padding: 9px 12px; font-size: 13px; background: #fff; }
.vazio-lista { text-align: center; padding: 34px 18px; border: 1.5px dashed #CBD5E1; border-radius: 14px; background: #fff; color: #4B5563; font-size: 13.5px; }
.vazio-lista b { display: block; color: #111827; font-size: 15px; margin-bottom: 4px; }

html.a11y-contraste .aba, html.a11y-contraste .cx, html.a11y-contraste .item-atv[aria-current="true"], html.a11y-contraste .caixa-busca { border-color: #111827; }
html.a11y-contraste .aba .n, html.a11y-contraste .chip { border: 1px solid #111827; background: #fff; color: #000; }
html.a11y-contraste .aba[aria-selected="true"] .n { background: #fff; color: #000; }
html.a11y-contraste .cx-sub, html.a11y-contraste .cx-previa, html.a11y-contraste .item-atv .m { color: #111827; }

/* ---------------------------------------------------------------- botão flutuante de acessibilidade (páginas públicas) */
.a11y-fab { position: fixed; left: 16px; bottom: 16px; z-index: 2147482000; width: 52px; height: 52px; border-radius: 50%; border: 2px solid #fff; cursor: pointer;
            background: #0B1B4A; color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(2,6,23,.35); transition: transform .15s; }
.a11y-fab:hover { transform: scale(1.06); }
.a11y-fab:focus-visible { outline: 3px solid #A3E635; outline-offset: 3px; }
.a11y-fab[aria-expanded="true"] { background: #1E3A8A; }
.a11y-dica { position: fixed; left: 16px; bottom: 80px; z-index: 2147482000; max-width: min(300px, calc(100vw - 32px)); background: #fff; color: #111827; border-radius: 14px; padding: 12px 36px 12px 14px;
             font: 600 13px/1.4 'Inter', system-ui, sans-serif; box-shadow: 0 12px 32px rgba(2,6,23,.3); border: 1.5px solid #CBD5E1; animation: a11y-sobe .3s ease; }
.a11y-dica::after { content: ""; position: absolute; left: 22px; bottom: -8px; width: 14px; height: 14px; background: #fff; border-right: 1.5px solid #CBD5E1; border-bottom: 1.5px solid #CBD5E1; transform: rotate(45deg); }
.a11y-dica button { position: absolute; top: 6px; right: 8px; border: 0; background: none; font-size: 18px; line-height: 1; color: #6B7280; cursor: pointer; padding: 2px 4px; }
.a11y-dica button:hover { color: #111827; }
.a11y-pop { position: fixed; left: 16px; bottom: 80px; z-index: 2147482001; width: min(420px, calc(100vw - 32px)); max-height: calc(100vh - 110px); overflow-y: auto; border-radius: 20px;
            box-shadow: 0 24px 60px rgba(2,6,23,.45); animation: a11y-sobe .2s ease; background: #fff; }
.a11y-pop[hidden], .a11y-dica[hidden] { display: none; }
.a11y-pop .a11y-card { box-shadow: none; margin: 0; }
.a11y-pop-fechar { position: absolute; top: 12px; right: 12px; width: 34px; height: 34px; border-radius: 50%; border: 0; background: #F1F5F9; color: #111827; font-size: 20px; line-height: 1; cursor: pointer; z-index: 1; }
.a11y-pop-fechar:hover { background: #E2E8F0; }
@keyframes a11y-sobe { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@media (max-width: 520px) { .a11y-pop { left: 8px; right: 8px; width: auto; bottom: 76px; } .a11y-fab { left: 12px; bottom: 12px; } .a11y-dica { left: 12px; } }
@media (prefers-reduced-motion: reduce) { .a11y-pop, .a11y-dica { animation: none; } }
html.a11y-contraste .a11y-fab { background: #000; border-color: #fff; outline: 2px solid #000; }
html.a11y-contraste .a11y-dica, html.a11y-contraste .a11y-pop { border: 2px solid #000; }

/* ---------------------------------------------------------------- ouvir a página (voz) */
.a11y-ouvir { padding: 16px 20px; border-bottom: 1px solid #F1F5F9; }
.a11y-ouvir .titulo { font-weight: 800; font-size: 14.5px; color: #111827; margin: 0; }
.a11y-ouvir .desc { font-size: 12.5px; color: #4B5563; margin: 3px 0 0; line-height: 1.45; }
.a11y-ouvir .interna { padding: 12px 0 0; border: 0; }
.ouvir-botoes { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.ouvir-btn { border: 1.5px solid #CBD5E1; background: #fff; color: #111827; font: 700 13px 'Inter', system-ui, sans-serif; padding: 9px 14px; border-radius: 12px; cursor: pointer; }
.ouvir-btn:hover { background: #F1F5F9; }
.ouvir-btn.principal { background: #1E3A8A; border-color: #1E3A8A; color: #fff; }
.ouvir-btn.principal:hover { background: #172F70; }
.ouvir-campos { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 10px; margin-top: 14px; }
.ouvir-campos label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 700; color: #374151; flex: 1 1 150px; min-width: 0; }
.ouvir-campos select { border: 1.5px solid #CBD5E1; border-radius: 10px; padding: 8px 10px; font-size: 13px; background: #fff; color: #111827; width: 100%; }
.ouvir-nota { font-size: 12px; color: #4B5563; margin: 10px 0 0; line-height: 1.45; }
.a11y-menu-ico { display: inline-flex; color: #6B7280; }

.ouvir-atual { outline: 3px solid #F59E0B !important; outline-offset: 3px; background-color: rgba(251,191,36,.28) !important; border-radius: 6px; scroll-margin: 110px; }
.ouvir-player { position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 2147482500; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 6px;
                max-width: min(660px, calc(100vw - 24px)); background: #0B1B4A; color: #fff; border: 2px solid #A3E635; border-radius: 18px; padding: 8px 10px;
                box-shadow: 0 14px 40px rgba(2,6,23,.45); font: 600 13px/1.3 'Inter', system-ui, sans-serif; }
.ouvir-player[hidden] { display: none; }
.ouvir-player button { width: 40px; height: 40px; border-radius: 12px; border: 0; background: rgba(255,255,255,.14); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.ouvir-player button:hover { background: rgba(255,255,255,.26); }
.ouvir-player button.principal { background: #A3E635; color: #0B1B4A; }
.ouvir-player button.vel { width: auto; padding: 0 12px; font: 800 13px 'Inter', system-ui, sans-serif; }
.ouvir-player button:focus-visible, .ouvir-player input:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
.ouvir-trecho { flex: 1 1 180px; min-width: 120px; max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; opacity: .92; padding: 0 4px; }
.ouvir-secao { display: flex; align-items: center; gap: 6px; font-size: 12px; cursor: pointer; padding: 0 6px; }
.ouvir-player.ouvir-simples [data-a="ant"], .ouvir-player.ouvir-simples [data-a="prox"], .ouvir-player.ouvir-simples [data-a="pp"], .ouvir-player.ouvir-simples .ouvir-secao { display: none; }
.ouvir-player.com-aluno-sim { bottom: 116px; }
@media (max-width: 640px) { .ouvir-player { bottom: 84px; left: 8px; right: 8px; transform: none; max-width: none; } .ouvir-player.com-aluno-sim { bottom: 150px; } }
html.a11y-contraste .ouvir-atual { outline: 4px solid #000 !important; background-color: #FDE047 !important; color: #000 !important; }
html.a11y-contraste .ouvir-player { background: #000; border-color: #fff; }
html.a11y-contraste .ouvir-btn, html.a11y-contraste .ouvir-campos select { border-color: #111827; }
html.a11y-contraste .a11y-ouvir .desc, html.a11y-contraste .ouvir-nota { color: #111827; }

/* ---------------------------------------------------------------- janelas de confirmação e de pergunta */
.dlg-fundo { position: fixed; inset: 0; z-index: 2147483200; background: rgba(15,23,42,.62); display: flex; align-items: center; justify-content: center; padding: 16px; animation: dlg-fade .15s ease; }
.dlg { width: min(440px, 100%); background: #fff; color: #111827; border-radius: 18px; padding: 22px 22px 18px; box-shadow: 0 30px 70px rgba(2,6,23,.5); font-family: 'Inter', system-ui, sans-serif; animation: dlg-sobe .18s ease; }
.dlg-titulo { margin: 0 0 8px; font-size: 17px; font-weight: 800; }
.dlg-texto { margin: 0; font-size: 14px; line-height: 1.5; color: #374151; white-space: pre-line; overflow-wrap: anywhere; }
.dlg-campo { display: block; width: 100%; margin-top: 14px; border: 1.5px solid #CBD5E1; border-radius: 12px; padding: 10px 12px; font-size: 15px; }
.dlg-botoes { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; flex-wrap: wrap; }
.dlg-botoes button { border: 0; border-radius: 12px; padding: 11px 18px; font: 700 14px 'Inter', system-ui, sans-serif; cursor: pointer; min-height: 44px; }
.dlg-nao { background: #F1F5F9; color: #111827; } .dlg-nao:hover { background: #E2E8F0; }
.dlg-sim { background: #1E3A8A; color: #fff; } .dlg-sim:hover { background: #172F70; }
.dlg-sim.perigo { background: #DC2626; } .dlg-sim.perigo:hover { background: #B91C1C; }
.dlg-botoes button:focus-visible, .dlg-campo:focus-visible { outline: 3px solid #1E3A8A; outline-offset: 2px; }
@keyframes dlg-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes dlg-sobe { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .dlg-fundo, .dlg { animation: none; } }
@media (max-width: 480px) { .dlg-botoes { flex-direction: column-reverse; } .dlg-botoes button { width: 100%; } }
html.a11y-contraste .dlg { border: 3px solid #000; } html.a11y-contraste .dlg-texto { color: #000; }
html.a11y-contraste .dlg-nao { background: #fff; border: 2px solid #000; } html.a11y-contraste .dlg-sim { background: #000; } html.a11y-contraste .dlg-sim.perigo { background: #7F1D1D; }

"""
open("pibiex-ui.css", "w", encoding="utf-8", newline="\n").write(css)
print(len(css), "bytes;", len(tam), "tamanhos px")
