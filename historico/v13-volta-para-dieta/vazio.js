/* Estado vazio da página de Alterações (opção B, "Troca de lugar"):
   o alimento do prato e uma opção do mesmo grupo trocam de lugar pelas duas setas do ícone de troca.
   O motor chama VAZIO.html() para montar a página e VAZIO.iniciar(el) depois de inserir.
   A animação só roda com a página de Alterações aberta e para sozinha quando ela sai da tela. */
(function () {
'use strict';
const SWAP = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3l4 4-4 4"/><path d="M20 7H8a4 4 0 0 0-4 4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h12a4 4 0 0 0 4-4"/></svg>';
const DIETA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/></svg>';
const ic = n => '<svg class="vz-ic" viewBox="0 0 64 64" aria-hidden="true">' + ((window.ICONES || {})[n] || '') + '</svg>';
const calmo = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const MOLA = 'cubic-bezier(.3,1.5,.5,1)', SUAVE = 'cubic-bezier(.32,.72,0,1)', IDA = 'cubic-bezier(.65,0,.35,1)', SAI = 'cubic-bezier(.5,0,.75,0)';
const GR = [
  { cor: '#FFD166', itens: ['Arroz branco cozido', 'Batata doce cozida', 'Mandioca cozida', 'Macarrão cozido'] },
  { cor: '#FFB4A2', itens: ['Pão francês', 'Tapioca', 'Cuscuz de milho'] },
  { cor: '#B8E0D2', itens: ['Banana', 'Morango', 'Manga', 'Kiwi'] }
];
const W = 320, H = 240, cx = W / 2, cy = 112, r = 96;
const L = { x: cx - r, y: cy }, Dd = { x: cx + r, y: cy };
const pt = g => { const a = g * Math.PI / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
function seta(a0, a1) {
  const [x0, y0] = pt(a0), [x1, y1] = pt(a1), t = a1 * Math.PI / 180;
  const tx = -Math.sin(t), ty = Math.cos(t), nx = -ty, ny = tx, s = 9, f = v => v.toFixed(1);
  return `<path class="vz-arco" d="M${f(x0)} ${f(y0)}A${r} ${r} 0 0 1 ${f(x1)} ${f(y1)}"/>`
    + `<path d="M${f(x1 - tx * s + nx * s * .8)} ${f(y1 - ty * s + ny * s * .8)}L${f(x1)} ${f(y1)}L${f(x1 - tx * s - nx * s * .8)} ${f(y1 - ty * s - ny * s * .8)}"/>`;
}

let tok = 0;
function html() {
  return '<div class="vz"><div class="vz-palco" aria-hidden="true">'
    + `<div class="vz-prato" style="left:${L.x - 59}px;top:${L.y - 59}px"></div>`
    + `<div class="vz-vaga" style="left:${Dd.x - 49}px;top:${Dd.y - 49}px"></div>`
    + `<svg class="vz-setas" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${seta(217, 323)}${seta(37, 143)}</svg>`
    + `<div class="vz-orb" style="transform-origin:${cx}px ${cy}px"></div>`
    + `<span class="vz-trk" style="top:${cy}px">${SWAP}</span>`
    + `<span class="vz-rot" style="left:${L.x}px;top:${cy + 70}px">no prato</span><span class="vz-rot" style="left:${Dd.x}px;top:${cy + 70}px">opção</span>`
    + '</div><h2>Nenhuma troca ainda</h2>'
    + '<p>Toque no selo de troca de um alimento para escolher outro do mesmo grupo. Ele aparece aqui e dá para desfazer quando quiser.</p>'
    + '<button class="vz-cta" data-view="dieta">' + DIETA + 'Ir para a dieta</button></div>';
}

function iniciar(raiz) {
  const palco = raiz && raiz.querySelector('.vz-palco');
  if (!palco) return;
  const t = ++tok;
  const orb = palco.querySelector('.vz-orb'), setas = palco.querySelector('.vz-setas'), trk = palco.querySelector('.vz-trk'), prato = palco.querySelector('.vz-prato');
  const vivo = () => t === tok && palco.isConnected && document.body.dataset.view === 'alteracoes';
  const espera = ms => new Promise(res => setTimeout(res, ms));
  /* anima e grava o estado final no estilo, para não acumular animações presas */
  const anima = (el, kf, o) => {
    const fim = kf[kf.length - 1];
    for (const k in fim) if (k !== 'offset') el.style[k] = fim[k];
    return el.animate(kf, Object.assign({ fill: 'backwards' }, o)).finished.catch(() => {});
  };
  let ang = 0;
  function bolha(nome, cor, lado) {
    const b = document.createElement('div'), p = lado === 'L' ? L : Dd;
    b.className = 'vz-b'; b.style.setProperty('--c', cor); b.innerHTML = ic(nome);
    /* posição no referencial do orbitador, que já girou ang graus */
    const a = -ang * Math.PI / 180, dx = p.x - cx, dy = p.y - cy;
    b.style.left = (cx + dx * Math.cos(a) - dy * Math.sin(a)).toFixed(1) + 'px';
    b.style.top = (cy + dx * Math.sin(a) + dy * Math.cos(a)).toFixed(1) + 'px';
    b.style.transform = `rotate(${-ang}deg) scale(0)`;
    orb.append(b);
    return b;
  }
  const entra = b => anima(b, [{ transform: `rotate(${-ang}deg) scale(0)` }, { transform: `rotate(${-ang}deg) scale(1)` }], { duration: 460, easing: MOLA });
  const sai = b => anima(b, [{ transform: `rotate(${-ang}deg) scale(1)`, opacity: 1 }, { transform: `rotate(${-ang}deg) scale(.2)`, opacity: 0 }], { duration: 300, easing: SAI }).then(() => b.remove());
  async function gira(bs) {
    const a0 = ang; ang += 180;
    setas.classList.add('ativa');
    await Promise.all([
      anima(orb, [{ transform: `rotate(${a0}deg)` }, { transform: `rotate(${ang}deg)` }], { duration: 950, easing: IDA }),
      anima(trk, [{ transform: `rotate(${a0}deg)` }, { transform: `rotate(${ang}deg)` }], { duration: 950, easing: IDA }),
      ...bs.map(b => anima(b, [{ transform: `rotate(${-a0}deg) scale(1)` }, { transform: `rotate(${-(a0 + 90)}deg) scale(1.08)` }, { transform: `rotate(${-ang}deg) scale(1)` }], { duration: 950, easing: IDA }))
    ]);
    setas.classList.remove('ativa');
    anima(prato, [{ transform: 'scale(1)' }, { transform: 'scale(1.06)' }, { transform: 'scale(1)' }], { duration: 380, easing: SUAVE });
  }

  if (calmo()) {
    [bolha(GR[0].itens[0], GR[0].cor, 'L'), bolha(GR[0].itens[1], GR[0].cor, 'D')].forEach(b => { b.style.transform = 'none'; });
    return;
  }
  (async () => {
    for (let g = 0; ; g++) {
      const gr = GR[g % GR.length];
      let noPrato = bolha(gr.itens[0], gr.cor, 'L');
      await entra(noPrato); if (!vivo()) return;
      for (let i = 1; i < gr.itens.length; i++) {
        await espera(350); if (!vivo()) return;
        const op = bolha(gr.itens[i], gr.cor, 'D');
        await entra(op); await espera(650); if (!vivo()) return;
        await gira([noPrato, op]); await espera(450); if (!vivo()) return;
        /* quem saiu do prato fica na vaga de opção e some */
        await sai(noPrato);
        noPrato = op;
      }
      await espera(900); if (!vivo()) return;
      await sai(noPrato);
    }
  })();
}

window.VAZIO = { html, iniciar };
})();
