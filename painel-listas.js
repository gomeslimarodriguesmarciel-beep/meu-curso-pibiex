// /painel-listas.js
//
// Pequenas peças para telas com muitas listas (atividades, correções, avisos):
//   PibiexLista.abas(elemento, itens, atual, aoMudar)  abas com contador (setas do teclado funcionam)
//   PibiexLista.prazo(iso)      { estado: 'sem' | 'ok' | 'perto' | 'passou', texto }
//   PibiexLista.tempo(iso)      "há 5 min", "ontem", "há 3 dias"
//   PibiexLista.dataHora(iso)   "14/10 15:30"
//   PibiexLista.iniciais(nome)  "AS"
//   PibiexLista.esc(texto)      escapa HTML
//
// Nada aqui fala com o servidor.

(function () {
    function esc(t) {
        const d = document.createElement('div');
        d.textContent = t == null ? '' : String(t);
        // aspas também, porque o resultado é usado dentro de atributos (value="...")
        return d.innerHTML.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function iniciais(nome) {
        const partes = String(nome || '?').trim().split(/\s+/).filter(Boolean);
        if (!partes.length) return '?';
        const a = partes[0][0] || '?';
        const b = partes.length > 1 ? partes[partes.length - 1][0] : '';
        return (a + b).toUpperCase();
    }

    function dataHora(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d)) return '';
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' ' +
            d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    function dataCurta(iso) {
        const d = new Date(iso);
        return isNaN(d) ? '' : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function tempo(iso) {
        if (!iso) return '';
        const d = new Date(iso);
        if (isNaN(d)) return '';
        const s = (Date.now() - d.getTime()) / 1000;
        if (s < 90) return 'agora há pouco';
        if (s < 3600) return 'há ' + Math.round(s / 60) + ' min';
        if (s < 86400) return 'há ' + Math.round(s / 3600) + ' h';
        if (s < 172800) return 'ontem';
        if (s < 86400 * 30) return 'há ' + Math.floor(s / 86400) + ' dias';
        return dataCurta(iso);
    }

    function prazo(iso) {
        if (!iso) return { estado: 'sem', texto: 'Sem prazo' };
        const d = new Date(iso);
        if (isNaN(d)) return { estado: 'sem', texto: 'Sem prazo' };
        const diff = d.getTime() - Date.now();
        if (diff < 0) return { estado: 'passou', texto: 'Encerrada em ' + dataCurta(iso) };
        const horas = diff / 3600000;
        if (horas < 24) return { estado: 'perto', texto: 'Termina hoje, ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
        const dias = Math.ceil(horas / 24);
        if (dias <= 3) return { estado: 'perto', texto: 'Faltam ' + dias + ' dias (' + dataCurta(iso) + ')' };
        return { estado: 'ok', texto: 'Prazo: ' + dataCurta(iso) };
    }

    // itens: [{ id, rotulo, n, alerta? }]
    function abas(el, itens, atual, aoMudar) {
        if (!el) return;
        el.className = 'abas';
        el.setAttribute('role', 'tablist');
        el.innerHTML = itens.map((i) => `
            <button type="button" class="aba" role="tab" data-aba="${esc(i.id)}" aria-selected="${i.id === atual}" tabindex="${i.id === atual ? 0 : -1}">
                ${esc(i.rotulo)}<span class="n${i.alerta ? ' alerta' : ''}">${i.n}</span>
            </button>`).join('');
        const botoes = [...el.querySelectorAll('.aba')];
        botoes.forEach((b, idx) => {
            b.onclick = () => aoMudar(b.dataset.aba);
            b.onkeydown = (e) => {
                const passo = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
                if (!passo) return;
                e.preventDefault();
                const alvo = botoes[(idx + passo + botoes.length) % botoes.length];
                alvo.focus();
                aoMudar(alvo.dataset.aba);
            };
        });
    }

    window.PibiexLista = { abas, prazo, tempo, dataHora, dataCurta, iniciais, esc };
})();
