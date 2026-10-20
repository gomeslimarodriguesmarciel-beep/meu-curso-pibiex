import re, os, glob
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

# tamanhos de texto fixos em px usados nas páginas (para o "texto maior" alcançar tudo)
tam = set()
for f in glob.glob("*.html") + glob.glob("aluno/*") + glob.glob("admin/*") + glob.glob("*.js"):
    if os.path.isfile(f):
        tam |= set(re.findall(r"text-\[([0-9.]+)px\]", open(f, encoding="utf-8", errors="ignore").read()))
tam = sorted(tam, key=float)

def esc(v): return v.replace(".", "\\.")
regras_texto = ""
for nivel, fator in ((1, 1.125), (2, 1.25)):
    for v in tam:
        regras_texto += f"html.a11y-texto-{nivel} .text-\\[{esc(v)}px\\] {{ font-size: {round(float(v) * fator, 2)}px; }}\n"

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
"""
open("pibiex-ui.css", "w", encoding="utf-8", newline="\n").write(css)
print(len(css), "bytes;", len(tam), "tamanhos px")
