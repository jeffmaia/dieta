/* Motor compartilhado pelos 5 conceitos: estado, cálculo de trocas, folha de troca,
   página de alterações e lista de mercado. Cada conceito só desenha a tela "Dieta". */
(function () {
'use strict';
const P = DATA.plano, G = DATA.grupos, R = P.refeicoes;
const KEY = 'dieta-estado-v1';

let S;
try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { S = {}; }
S.subs = S.subs || {};
S.dias = S.dias || 7;
S.ui = Object.assign({ troca: 'cheia', menu: 'some' }, S.ui);
S.mk = S.mk || {};
const EXTRA = window.OPCOES_EXTRA || [];
EXTRA.forEach(o => { if (!o.v.some(v => v[0] === S.ui[o.k])) S.ui[o.k] = o.v[0][0]; });
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

/* proteína estimada por porção de cada grupo (g). Estimativa, não vem da nutricionista. */
const PROT = { 'Pão': 2, 'Carne ou ovo': 26, 'Arroz': 1.5, 'Feijão': 3, 'Leite': 5, 'Fruta': 0.8, 'Castanha': 1.3, 'Açúcar': 0, 'Gordura': 0, 'Vegetal refogado': 1 };
const SCOOP = 20;

/* ---------- formatação ---------- */
const nf = n => {
  const r = Math.round(n * 10) / 10;
  return (Number.isInteger(r) ? String(r) : r.toFixed(1)).replace('.', ',');
};
const fg = g => (g < 10 ? nf(g) : String(Math.round(g)));
const medida = (o, p) => {
  const q = Math.round(o.qtd * p * 10) / 10;
  return nf(q) + ' ' + (q > 1 ? o.medidaPlur : o.medidaSing);
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ---------- iconografia ---------- */
const EM = [
  [/feij|lentilha|grão de bico|ervilha|tutu/i, '🫘'], [/omelete/i, '🍳'], [/ovo/i, '🥚'],
  [/pão/i, '🍞'], [/tomate/i, '🍅'], [/salada de fruta|mix de fruta/i, '🍓'], [/salada/i, '🥗'],
  [/mussarela|queijo|brie|camembert|cottage|gorgonzola|minas|parmes|^prato|provolone|ricota|cream cheese|requeij/i, '🧀'],
  [/tofu/i, '🧊'], [/coco/i, '🥥'], [/iogurte|coalhada|leite/i, '🥛'], [/arroz/i, '🍚'], [/uva/i, '🍇'],
  [/cuscuz|milho|pipoca/i, '🌽'], [/tapioca|farinha|farelo|germe|farofa|aveia|granola|quinua/i, '🥣'],
  [/mamão|manga/i, '🥭'], [/banana/i, '🍌'], [/^mel$/i, '🍯'], [/melão/i, '🍈'], [/melancia/i, '🍉'],
  [/batata doce|inhame|cará|mandioca|baroa/i, '🍠'], [/batata/i, '🥔'], [/macarrão/i, '🍝'],
  [/maçã/i, '🍎'], [/laranja|tangerina/i, '🍊'], [/morango|framboesa|cereja|acerola|pitanga|jabuticaba/i, '🍒'],
  [/abacaxi/i, '🍍'], [/abacate/i, '🥑'], [/kiwi/i, '🥝'], [/pera/i, '🍐'],
  [/pêssego|nectarina|damasco|caqui|ameixa/i, '🍑'], [/chocolate|bis|beijinho|paçoca|bananada/i, '🍫'],
  [/chia|linhaça|gergelim|semente/i, '🌱'], [/creatina/i, '⚡'], [/protein/i, '🥤'], [/biscoito/i, '🍘'],
  [/azeitona|azeite|óleo/i, '🫒'], [/manteiga/i, '🧈'], [/geleia|açúcar/i, '🍯']
];
const EMG = { 'Pão': '🍞', 'Arroz': '🍚', 'Feijão': '🫘', 'Leite': '🥛', 'Fruta': '🍎', 'Castanha': '🥜', 'Açúcar': '🍬', 'Gordura': '🫒', 'Carne ou ovo': '🥚', 'Vegetal refogado': '🥦' };
const emoji = (nome, grupo) => {
  const ic = window.ICONES && window.ICONES[nome];
  if (ic) return '<svg class="ic" viewBox="0 0 64 64" aria-hidden="true">' + ic + '</svg>';
  const m = EM.find(e => e[0].test(nome)); return m ? m[1] : (EMG[grupo] || '🍽️');
};

/* ---------- modelo ---------- */
const opt = (grupo, nome) => G[grupo].opcoes.find(o => o.nome === nome);
const gTotal = it => { const m = it.qtd.match(/(\d+(?:[.,]\d+)?)\s*g\b/); return m ? parseFloat(m[1].replace(',', '.')) : null; };
const opcoes = it => G[it.grupo].opcoes.filter(o => o.veg !== false && !(it.match || []).includes(o.nome));
const trocavel = it => !!it.grupo && it.grupo !== 'Carne ou ovo' && gTotal(it) != null && opcoes(it).length > 0;

function linhas(ri, ii) {
  const it = R[ri].itens[ii], ps = S.subs[ri + '-' + ii];
  const e = emoji(it.nome, it.grupo);
  if (!ps) return [{ nome: it.nome, txt: it.qtd, emoji: e, orig: true, alt: it.alt }];
  return ps.map(p => {
    if (!p.n) return { nome: it.nome, txt: fg(gTotal(it) * p.p / it.porcoes) + ' g', emoji: e, orig: true };
    const o = opt(it.grupo, p.n);
    return { nome: o.nome, txt: fg(o.g * p.p) + ' g', medida: medida(o, p.p), emoji: emoji(o.nome, it.grupo), orig: false };
  });
}
const protRef = r => Math.round(r.itens.reduce((s, it) =>
  s + (it.grupo ? (PROT[it.grupo] || 0) * it.porcoes : /protein/i.test(it.nome) ? SCOOP : 0), 0));

function meals() {
  return R.map((r, ri) => {
    const itens = r.itens.map((it, ii) => ({
      id: ri + '-' + ii, nome: it.nome, grupo: it.grupo, fixo: !!(it.livre || it.suplemento),
      livre: !!it.livre, sup: !!it.suplemento, trocavel: trocavel(it),
      alterado: !!S.subs[ri + '-' + ii], linhas: linhas(ri, ii)
    }));
    return { i: ri, nome: r.nome, hora: r.hora, kcal: r.kcal, carb: r.carb, prot: protRef(r), itens, alterada: itens.some(x => x.alterado) };
  });
}
const indicadores = () => [
  { v: String(P.kcalTotal), u: 'kcal', l: 'calorias' },
  { v: String(R.reduce((s, r) => s + r.carb, 0)), u: 'g', l: 'carboidrato' },
  { v: '≈' + R.reduce((s, r) => s + protRef(r), 0), u: 'g', l: 'proteína' },
  { v: String(R.length), u: '', l: 'refeições' }
];
const nAlt = () => Object.keys(S.subs).length;

/* ---------- ícones de interface ---------- */
const ico = {
  swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3l4 4-4 4"/><path d="M20 7H8a4 4 0 0 0-4 4"/><path d="M8 21l-4-4 4-4"/><path d="M4 17h12a4 4 0 0 0 4-4"/></svg>',
  dieta: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/></svg>',
  alt: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h11"/><path d="M4 12h16"/><path d="M4 17h8"/><circle cx="18" cy="7" r="2"/><circle cx="15" cy="17" r="2"/></svg>',
  mercado: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 11H6.2z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
  grade: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 8h14"/><path d="M5 16h14"/></svg>',
  lupa: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
};

/* ---------- estrutura comum ---------- */
function montar() {
  document.body.dataset.view = 'dieta';
  document.body.insertAdjacentHTML('beforeend',
    '<main class="page" id="alteracoes"></main><main class="page" id="mercado"></main>'
    + '<nav class="tabbar" id="tabbar" aria-label="Seções">'
    + '<button data-view="dieta" aria-current="true">' + ico.dieta + '<span class="lbl">Dieta</span></button>'
    + '<button data-view="alteracoes">' + ico.alt + '<span class="lbl">Alterações</span><span class="tb-n" id="tbN" hidden></span></button>'
    + '<button data-view="mercado">' + ico.mercado + '<span class="lbl">Mercado</span></button>'
    + '<button id="tbOpc" aria-label="Opções do protótipo">' + ico.grade + '</button>'
    + '<button class="tb-menu" id="tbMenu" aria-label="Menu" aria-expanded="false">' + ico.menu + '</button>'
    + '</nav>'
    + '<div class="opc" id="opc" role="dialog" aria-label="Opções do protótipo">'
    + '<h4>Opções do protótipo</h4>'
    + '<p>Troca de alimento</p><div class="seg"><button data-ui="troca:folha">Folha</button><button data-ui="troca:cheia">Tela cheia</button></div>'
    + '<p>Menu</p><div class="seg"><button data-ui="menu:fixo">Fixo</button><button data-ui="menu:some">Some ao rolar</button><button data-ui="menu:botao">Botão</button></div>'
    + EXTRA.map(o => '<p>' + o.t + '</p><div class="seg">' + o.v.map(v => '<button data-ui="' + o.k + ':' + v[0] + '">' + v[1] + '</button>').join('') + '</div>').join('')
    + '<a href="index.html">Ver os 5 conceitos</a></div>'
    + '<div class="scrim" id="scrim"></div>'
    + '<section class="sheet" id="sheet" role="dialog" aria-modal="true" aria-labelledby="shT">'
    + '<div class="sh-colapsa"><div>'
    + '<div class="sh-grab"></div>'
    + '<div class="sh-head"><div><small id="shMeal"></small><h3 id="shT">Trocar</h3></div><button class="sh-close" id="shClose" aria-label="Fechar">✕</button></div>'
    + '<div class="sh-items" id="shItems"></div>'
    + '</div></div>'
    + '<div class="sh-tools">'
    + '<label class="sh-busca">' + ico.lupa + '<input id="shQ" type="search" enterkeyhint="search" placeholder="Buscar alimento" autocomplete="off" autocorrect="off" aria-label="Buscar alimento"></label>'
    + '<label class="sh-gramas"><input id="shG" type="text" inputmode="decimal" autocomplete="off" aria-label="Gramas a trocar"><span id="shDe"></span></label>'
    + '<button class="sh-chip" data-frac="1">Tudo</button><button class="sh-chip" data-frac="0.5">Metade</button>'
    + '<button class="sh-fim" id="shFim">OK</button>'
    + '</div>'
    + '<div class="sh-body" id="shBody"></div>'
    + '<div class="sh-foot"><div><button class="b-ghost" id="shReset" hidden>Voltar ao original</button><button class="b-primary" id="shSave" hidden></button></div></div>'
    + '</section><div class="toast" id="toast" role="status"></div>');
  aplicarUI();
}
function aplicarUI() {
  document.body.dataset.troca = S.ui.troca;
  document.body.dataset.menu = S.ui.menu;
  EXTRA.forEach(o => { document.body.dataset[o.k] = S.ui[o.k]; });
  document.body.classList.remove('menu-fora');
  document.querySelectorAll('[data-ui]').forEach(b => { const [k, v] = b.dataset.ui.split(':'); b.setAttribute('aria-pressed', String(S.ui[k] === v)); });
  fecharMenu();
}
function fecharMenu() {
  const tb = document.getElementById('tabbar'); if (!tb) return;
  tb.classList.remove('aberta'); document.getElementById('tbMenu').setAttribute('aria-expanded', 'false');
}

function refresh() {
  if (window.renderDieta) window.renderDieta(D);
  renderAlt(); renderMercado();
  const n = nAlt(), b = document.getElementById('tbN');
  b.hidden = !n; b.textContent = n;
  document.getElementById('tbMenu').classList.toggle('tem', !!n);
}
function irPara(v) {
  document.body.dataset.view = v;
  document.querySelectorAll('.tabbar [data-view]').forEach(b => b.setAttribute('aria-current', String(b.dataset.view === v)));
  document.body.classList.remove('menu-fora');
  window.scrollTo(0, 0);
}
let tT;
function toast(msg) {
  const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(tT); tT = setTimeout(() => t.classList.remove('on'), 2600);
}

/* ---------- troca de alimento (vários itens da refeição, total ou parcial) ---------- */
let cur = null, ultY = 0;
const $ = id => document.getElementById(id);

function abrir(id) {
  const [ri, ii] = id.split('-').map(Number);
  cur = { r: ri, i: ii, g: {}, sel: {} };
  R[ri].itens.forEach((it, k) => { if (trocavel(it)) cur.g[k] = gTotal(it); });
  $('shMeal').textContent = R[ri].nome;
  $('shQ').value = '';
  $('sheet').classList.remove('rolou'); foco(null);
  shTudo(true);
  $('shBody').scrollTop = 0; ultY = 0;
  $('scrim').classList.add('on'); $('sheet').classList.add('on');
  document.body.classList.add('travado');
}
function fechar() {
  foco(null);
  $('scrim').classList.remove('on'); $('sheet').classList.remove('on');
  document.body.classList.remove('travado'); cur = null;
}
/* modo de foco: o campo em uso gruda no topo e o resto some para sobrar espaço */
function foco(m) {
  const sh = $('sheet');
  if (m) { sh.dataset.foco = m; sh.classList.remove('rolou'); }
  else { delete sh.dataset.foco; $('shQ').blur(); $('shG').blur(); }
  $('shFim').textContent = m === 'busca' ? 'Cancelar' : 'OK';
}
function shTudo(anima) {
  const r = R[cur.r], it = r.itens[cur.i];
  $('shItems').innerHTML = r.itens.map((x, k) => trocavel(x)
    ? '<button data-shi="' + k + '" aria-pressed="' + (k === cur.i) + '">' + emoji(x.nome, x.grupo) + ' ' + esc(x.nome)
      + (cur.sel[k] ? '<span class="ok">' + ico.check + '</span>' : '') + '</button>' : '').join('');
  $('shT').textContent = 'Trocar ' + it.nome.toLowerCase();
  $('shG').value = fg(cur.g[cur.i]);
  $('shDe').textContent = 'g de ' + fg(gTotal(it)) + ' g';
  shLista(); shPe();
  if (anima) { const b = $('shBody'); b.classList.remove('anima'); void b.offsetWidth; b.classList.add('anima'); }
}
function shLista() {
  const it = R[cur.r].itens[cur.i], tot = gTotal(it);
  const frac = Math.min(1, Math.max(0, (cur.g[cur.i] || 0) / tot)), p = it.porcoes * frac;
  const termo = $('shQ').value.trim().toLowerCase();
  const ops = opcoes(it).filter(o => !termo || o.nome.toLowerCase().includes(termo));
  if (!frac) { $('shBody').innerHTML = '<p class="sh-vazio">Digite quantos gramas você quer trocar.</p>'; return; }
  if (!ops.length) { $('shBody').innerHTML = '<p class="sh-vazio">Nada com esse nome no grupo ' + esc(it.grupo) + '.</p>'; return; }
  const subs = [...new Set(ops.map(o => o.sub))];
  $('shBody').innerHTML = (frac < 1 ? '<p class="sh-resto">Você mantém ' + fg(tot - cur.g[cur.i]) + ' g de ' + esc(it.nome.toLowerCase()) + ' e troca o restante por:</p>' : '')
    + subs.map(s => '<div class="sh-sub">' + esc(s) + '</div>' + ops.filter(o => o.sub === s).map(o =>
      '<button class="sh-opt" data-opt="' + esc(o.nome) + '" aria-pressed="' + (cur.sel[cur.i] === o.nome) + '">'
      + '<span class="e">' + emoji(o.nome, it.grupo) + '</span>'
      + '<span class="m"><b>' + esc(o.nome) + '</b><small>' + medida(o, p) + '</small>'
      + (o.alerta ? '<em>' + esc(o.alerta) + '</em>' : '') + '</span>'
      + '<span class="g">' + fg(o.g * p) + ' g</span><span class="ck">' + ico.check + '</span></button>').join('')).join('');
}
function shPe() {
  const n = Object.keys(cur.sel).length, b = $('shSave'), alt = !!S.subs[cur.r + '-' + cur.i];
  b.hidden = !n;
  b.textContent = n === 1 ? 'Salvar troca na dieta' : 'Salvar ' + n + ' trocas na dieta';
  $('shReset').hidden = !alt;
  $('sheet').classList.toggle('tem-pe', !!n || alt);
}
function salvar() {
  Object.keys(cur.sel).forEach(k => {
    const it = R[cur.r].itens[k], frac = Math.min(1, cur.g[k] / gTotal(it));
    if (!frac) return;
    S.subs[cur.r + '-' + k] = frac < 1
      ? [{ n: null, p: it.porcoes * (1 - frac) }, { n: cur.sel[k], p: it.porcoes * frac }]
      : [{ n: cur.sel[k], p: it.porcoes }];
  });
  save(); fechar(); refresh(); toast('Dieta atualizada. A original continua guardada.');
}

/* ---------- página de alterações ---------- */
function renderAlt() {
  const ms = meals().filter(m => m.alterada);
  let h = '<header class="pg-head"><h1>Alterações</h1><p>' + (ms.length
    ? nAlt() + (nAlt() === 1 ? ' item diferente' : ' itens diferentes') + ' da dieta original.'
    : 'Sua dieta está igual à original.') + '</p></header>';
  if (!ms.length) h += '<p class="pg-vazio">Quando você salvar uma troca, ela aparece aqui, e dá para desfazer por item, por refeição ou tudo de uma vez.</p>';
  ms.forEach(m => {
    h += '<section class="alt-meal"><div class="alt-mh"><h2>' + esc(m.nome) + '</h2><button class="b-link" data-reset-meal="' + m.i + '">Restaurar refeição</button></div>';
    m.itens.filter(x => x.alterado).forEach(x => {
      const o = R[m.i].itens[+x.id.split('-')[1]];
      h += '<div class="alt-row"><div class="alt-main"><s>' + esc(o.nome) + ' · ' + esc(o.qtd) + '</s>'
        + x.linhas.map(l => '<div class="alt-to"><span>' + l.emoji + '</span>' + esc(l.nome) + ' <b>' + l.txt + '</b>'
          + (l.medida ? '<small>' + l.medida + '</small>' : '') + '</div>').join('')
        + '</div><button class="b-link" data-reset-item="' + x.id + '">Desfazer</button></div>';
    });
    h += '</section>';
  });
  if (ms.length) h += '<button class="b-ghost wide" data-reset-all>Restaurar a dieta original inteira</button>';
  $('alteracoes').innerHTML = h;
}

/* ---------- lista de mercado ---------- */
function somar(comTrocas) {
  const tot = {};
  R.forEach((r, ri) => r.itens.forEach((it, ii) => {
    if (it.livre || it.suplemento) return;
    ((comTrocas && S.subs[ri + '-' + ii]) || [{ n: null, p: it.porcoes }]).forEach(p => {
      let nome, g = 0, un = 0;
      if (p.n) { const o = opt(it.grupo, p.n); nome = o.nome; g = o.g * p.p; }
      else if (it.grupo === 'Carne ou ovo') { nome = 'Ovos'; un = 4 * p.p; }
      else { nome = (it.match && it.match.length === 1) ? it.match[0] : it.nome; g = gTotal(it) * p.p / it.porcoes; }
      const t = tot[nome] || (tot[nome] = { nome, g: 0, un: 0, grupo: it.grupo });
      t.g += g; t.un += un;
    });
  }));
  return tot;
}
const qtdTxt = (g, un) => un ? un + (un === 1 ? ' unidade' : ' unidades') : g >= 1000 ? nf(g / 1000) + ' kg' : Math.round(g) + ' g';
function listaMercado() {
  const cur = somar(true), base = somar(false), d = S.dias;
  const livres = [];
  R.forEach(r => r.itens.forEach(it => { if ((it.livre || it.suplemento) && !livres.includes(it.nome)) livres.push(it.nome); }));
  const itens = Object.values(cur).map(t => {
    const b = base[t.nome], g = t.g * d, un = Math.ceil(t.un * d), bg = b ? b.g * d : 0;
    const nota = !b ? 'entrou por troca' : Math.round(g) < Math.round(bg) - 1 ? 'era ' + qtdTxt(bg, 0) + ' antes das trocas' : '';
    return { nome: t.nome, emoji: emoji(t.nome, t.grupo), qtd: qtdTxt(g, un), nota, troca: !b };
  });
  Object.values(base).forEach(t => { if (!cur[t.nome]) itens.push({ nome: t.nome, emoji: emoji(t.nome, t.grupo), qtd: '', nota: 'saiu por troca', fora: true }); });
  itens.sort((a, b) => a.nome.localeCompare(b.nome, 'pt'));
  return { itens, livres };
}
function renderMercado() {
  const { itens, livres } = listaMercado();
  const ativos = itens.filter(i => !i.fora), todos = ativos.length + livres.length;
  const pegos = ativos.filter(i => S.mk[i.nome]).length + livres.filter(n => S.mk[n]).length;
  const li = i => '<li class="' + (S.mk[i.nome] ? 'ok' : '') + '"><button data-mk="' + esc(i.nome) + '" aria-pressed="' + !!S.mk[i.nome] + '">'
    + '<span class="mk-ck">' + ico.check + '</span><span class="mk-e">' + i.emoji + '</span>'
    + '<span class="mk-n"><b>' + esc(i.nome) + '</b>' + (i.nota ? '<small class="' + (i.troca ? 'nv' : '') + '">' + i.nota + '</small>' : '') + '</span>'
    + (i.qtd ? '<i>' + i.qtd + '</i>' : '') + '</button></li>';
  const ord = a => a.slice().sort((x, y) => (!!S.mk[x.nome]) - (!!S.mk[y.nome]));
  $('mercado').innerHTML = '<header class="pg-head"><h1>Mercado</h1><p>Toque no que já pegou. A lista segue a dieta com as suas trocas.</p></header>'
    + '<div class="seg" role="group" aria-label="Período">' + [1, 3, 7, 14].map(d =>
      '<button data-dias="' + d + '" aria-pressed="' + (S.dias === d) + '">' + d + (d === 1 ? ' dia' : ' dias') + '</button>').join('') + '</div>'
    + '<div class="mk-prog"><span><b>' + pegos + '</b> de ' + todos + ' no carrinho</span>' + (pegos ? '<button class="b-link" data-mk-limpar>Desmarcar tudo</button>' : '') + '</div>'
    + '<div class="mk-bar"><i style="width:' + (todos ? pegos / todos * 100 : 0) + '%"></i></div>'
    + '<ul class="mk">' + ord(ativos).map(li).join('') + '</ul>'
    + '<div class="sh-sub">À vontade e suplementos</div>'
    + '<ul class="mk">' + ord(livres.map(n => ({ nome: n, emoji: emoji(n), qtd: '' }))).map(li).join('') + '</ul>'
    + (itens.some(i => i.fora) ? '<div class="sh-sub">Saíram por troca</div><ul class="mk fora">' + itens.filter(i => i.fora).map(i =>
      '<li><span class="mk-e">' + i.emoji + '</span><span class="mk-n"><b>' + esc(i.nome) + '</b></span></li>').join('') + '</ul>' : '')
    + '<button class="b-primary wide" id="mkEnviar">Enviar o que falta para o Lembretes</button>'
    + '<p class="pg-nota">Neste protótipo o botão copia a lista. Na fase 4 ele abre um Atalho do iOS que cria os itens na sua lista de compras do Lembretes.</p>';
}
function enviarMercado() {
  const { itens, livres } = listaMercado();
  const falta = itens.filter(i => !i.fora && !S.mk[i.nome]).map(i => i.nome + ' — ' + i.qtd).concat(livres.filter(n => !S.mk[n]));
  const ok = () => toast('Lista copiada (' + falta.length + ' itens).');
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(falta.join('\n')).then(ok, () => toast('Não foi possível copiar aqui.'));
  else toast('Não foi possível copiar aqui.');
}

/* ---------- eventos ---------- */
function ligar() {
  document.addEventListener('click', e => {
    if (!e.target.closest('#opc,#tbOpc')) $('opc').classList.remove('on');
    if (!e.target.closest('#tabbar,#opc')) fecharMenu();
    const t = e.target.closest('[data-swap],[data-view],[data-reset-item],[data-reset-meal],[data-reset-all],[data-dias],[data-shi],[data-opt],[data-frac],[data-ui],[data-mk],[data-mk-limpar],#shClose,#scrim,#shSave,#shReset,#mkEnviar,#shFim,#tbMenu,#tbOpc');
    if (!t) return;
    const d = t.dataset;
    if (t.id === 'shClose' || t.id === 'scrim') fechar();
    else if (t.id === 'shSave') salvar();
    else if (t.id === 'mkEnviar') enviarMercado();
    else if (t.id === 'shReset') { delete S.subs[cur.r + '-' + cur.i]; save(); fechar(); refresh(); toast('Item restaurado.'); }
    else if (t.id === 'shFim') { if ($('sheet').dataset.foco === 'busca') { $('shQ').value = ''; shLista(); } foco(null); }
    else if (t.id === 'tbMenu') t.setAttribute('aria-expanded', String($('tabbar').classList.toggle('aberta')));
    else if (t.id === 'tbOpc') $('opc').classList.toggle('on');
    else if (d.ui) { const [k, v] = d.ui.split(':'); S.ui[k] = v; save(); aplicarUI(); if (EXTRA.some(o => o.k === k)) refresh(); }
    else if (d.mk) { if (S.mk[d.mk]) delete S.mk[d.mk]; else S.mk[d.mk] = 1; save(); renderMercado(); }
    else if ('mkLimpar' in d) { S.mk = {}; save(); renderMercado(); }
    else if (d.swap) abrir(d.swap);
    else if (d.view) { irPara(d.view); fecharMenu(); }
    else if (d.resetItem) { delete S.subs[d.resetItem]; save(); refresh(); toast('Item restaurado.'); }
    else if ('resetMeal' in d) {
      Object.keys(S.subs).forEach(k => { if (k.split('-')[0] === d.resetMeal) delete S.subs[k]; });
      save(); refresh(); toast('Refeição restaurada.');
    }
    else if ('resetAll' in d) { if (confirm('Restaurar a dieta original inteira?')) { S.subs = {}; save(); refresh(); toast('Dieta original restaurada.'); } }
    else if (d.dias) { S.dias = +d.dias; save(); renderMercado(); }
    else if (d.shi) { cur.i = +d.shi; $('shQ').value = ''; shTudo(true); $('shBody').scrollTop = 0; }
    else if (d.opt) {
      if (cur.sel[cur.i] === d.opt) delete cur.sel[cur.i]; else cur.sel[cur.i] = d.opt;
      foco(null); shTudo();
    }
    else if (d.frac) { const it = R[cur.r].itens[cur.i]; cur.g[cur.i] = Math.round(gTotal(it) * +d.frac); $('shG').value = fg(cur.g[cur.i]); shLista(); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (cur) fechar(); $('opc').classList.remove('on'); fecharMenu(); }
    if (e.key === 'Enter' && e.target.matches('#shQ,#shG')) e.target.blur();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-swap]:not(button)')) { e.preventDefault(); abrir(e.target.dataset.swap); }
  });
  $('shG').addEventListener('input', () => {
    const it = R[cur.r].itens[cur.i], v = parseFloat($('shG').value.replace(',', '.'));
    cur.g[cur.i] = isNaN(v) ? 0 : Math.min(gTotal(it), Math.max(0, v));
    shLista();
  });
  $('shG').addEventListener('focus', () => { foco('gramas'); setTimeout(() => $('shG').select(), 0); });
  $('shG').addEventListener('blur', () => { if (cur) $('shG').value = fg(cur.g[cur.i]); });
  $('shQ').addEventListener('focus', () => foco('busca'));
  $('shQ').addEventListener('input', shLista);

  /* cabeçalho da troca some ao rolar para baixo e volta ao rolar para cima.
     Só recolhe se a lista continuar rolável depois de recolher, e ignora o quique do iOS
     e os eventos gerados pela própria mudança de altura. */
  let trava = 0;
  $('shBody').addEventListener('scroll', () => {
    const b = $('shBody'), sh = $('sheet'), y = b.scrollTop, max = b.scrollHeight - b.clientHeight;
    const agora = Date.now();
    if (sh.dataset.foco || agora < trava || y < 0 || y > max) { ultY = y; return; }
    const cab = sh.querySelector('.sh-colapsa>div').offsetHeight;
    if (!sh.classList.contains('rolou')) {
      if (y > ultY + 6 && y > 48 && max - cab > 160 && y < max - cab - 10) { sh.classList.add('rolou'); trava = agora + 420; }
    } else if (y < ultY - 12 || y < 4) { sh.classList.remove('rolou'); trava = agora + 420; }
    ultY = y;
  }, { passive: true });

  /* menu some ao rolar para baixo (quando essa opção está ligada) */
  const pos = new WeakMap();
  document.addEventListener('scroll', e => {
    const el = e.target === document ? document.scrollingElement : e.target;
    if (!el || (el.closest && el.closest('#sheet'))) return;
    const y = el.scrollTop, a = pos.get(el) || 0; pos.set(el, y);
    if (S.ui.menu !== 'some') return;
    if (y > a + 6 && y > 60) document.body.classList.add('menu-fora');
    else if (y < a - 6 || y < 20) document.body.classList.remove('menu-fora');
  }, { capture: true, passive: true });

  /* com o teclado aberto, a troca ocupa exatamente a área visível */
  const vv = window.visualViewport;
  if (vv) {
    const aj = () => { const st = document.documentElement.style; st.setProperty('--vvh', vv.height + 'px'); st.setProperty('--vvt', vv.offsetTop + 'px'); };
    vv.addEventListener('resize', aj); vv.addEventListener('scroll', aj); aj();
  }
}

const D = window.D = {
  meals, indicadores, ico, esc, nAlt, ui: () => S.ui,
  init() { montar(); ligar(); refresh(); }
};
})();
