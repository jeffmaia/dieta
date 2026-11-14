/* Fora do celular (tablet, notebook, desktop), abre a página dentro de uma moldura de celular.
   Decide pelo aparelho, não só pela largura da tela:
   - navegadores Chromium dizem direto se é celular (userAgentData.mobile);
   - iPhone/iPod são celular; iPad (inclusive o iPadOS que se passa por Mac com toque) é tablet;
   - Android só é celular quando o user agent traz "Mobile" (tablets Android não trazem).
   ?solto=1 abre sem moldura; ?celular=1 é usado pela própria moldura para não entrar em loop. */
(function () {
  var q = new URLSearchParams(location.search);
  /* dentro da moldura: sem barras de rolagem, como num celular */
  if (q.has('celular')) document.documentElement.classList.add('emoldura');
  if (q.has('celular') || q.has('solto')) return;
  try { if (window.top !== window) return; } catch (e) { return; }

  function ehCelular() {
    var ua = navigator.userAgent || '';
    if (/iPhone|iPod/.test(ua)) return true;
    if (/iPad/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return false;
    if (navigator.userAgentData && typeof navigator.userAgentData.mobile === 'boolean') return navigator.userAgentData.mobile;
    if (/Android/.test(ua)) return /Mobile/.test(ua);
    return /Windows Phone|IEMobile|BlackBerry|BB10|Opera Mini|webOS|Mobile Safari/.test(ua) && !/Tablet/.test(ua);
  }

  if (ehCelular()) return;
  var alvo = location.pathname + location.search + location.hash;
  location.replace('moldura.html?u=' + encodeURIComponent(alvo));
})();
