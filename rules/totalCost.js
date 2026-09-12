/**
 * Atrio — Regra: Total Cost of Stay
 *
 * Destaca o campo "Total Cost of Stay" na tela de Manage Reservation
 * em amarelo, para alertar a recepção sobre o valor.
 */
(function (global) {
  'use strict';


  function isElementVisible(el) {
    if (!el) return false;
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function apply(root) {
    let injected = false;
    const hasRateChanges = !!(root || document).querySelector('img[title="Rate Changes"]');

    const labels = (root || document).querySelectorAll('span.xri, label, div');
    let hasLabel = false;
    for (const label of labels) {
      if (label.textContent.trim() === 'Total Cost of Stay' && isElementVisible(label)) {
        hasLabel = true;
        let valueNode = label.closest('.x43r')?.querySelector('.x43s');
        
        // 2. Fallback
        if (!valueNode) {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
          walker.currentNode = label;
          let n;
          let count = 0;
          while ((n = walker.nextNode()) && count < 15) {
            if (/R\$\s*[\d,.]+/.test(n.nodeValue) && isElementVisible(n.parentElement)) {
              valueNode = n.parentElement;
              break;
            }
            count++;
          }
        }
        
        if (valueNode) {
          // Apenas registra que encontrou o valor (usado pelo balanceCheck para ler)
          valueNode.classList.remove('atrio-border-dashed-red');
          injected = true;
        }
      }
    }
    return injected;
  }

  global.AtrioRules = global.AtrioRules || {};
  global.AtrioRules.totalCost = {
    apply,
  };
})(window);
