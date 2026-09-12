/**
 * Atrio — Regra: Balance Check
 *
 * Lê o saldo financeiro da reserva e exibe alertas na Sidebar.
 */
(function (global) {
  'use strict';


  function isElementVisible(el) {
    if (!el) return false;
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function findBalanceElement(root) {
    const labels = (root || document).querySelectorAll('label, span.xri');
    for (const l of labels) {
      if (l.textContent.trim() === 'Balance' && isElementVisible(l)) {
        const container = l.closest('.x43t, .x43p, .x43r, td') || l.parentElement;
        if (container && container.parentElement) {
          const valueSpan = container.parentElement.querySelector('.x43s') || container.nextElementSibling;
          if (valueSpan) return valueSpan;
        }
      }
    }
    return null;
  }

  function apply(root) {
    const balanceEl = findBalanceElement(root);
    if (!balanceEl) {
      if (global.AtrioRules.sidebar) {
        global.AtrioRules.sidebar.removeItem('balance-check');
      }
      return false;
    }

    // Helper para parsear moeda
    function parseCurrency(str) {
      if (!str) return NaN;
      let cleanStr = str.replace(/[^\d.,-]/g, '');
      let lastDot = cleanStr.lastIndexOf('.');
      let lastComma = cleanStr.lastIndexOf(',');

      if (lastDot > lastComma) {
        // US format: R$ 1,894.75
        cleanStr = cleanStr.replace(/,/g, '');
      } else if (lastComma > lastDot) {
        // BR format: R$ 1.894,75
        cleanStr = cleanStr.replace(/\./g, '').replace(',', '.');
      } else if (lastDot !== -1) {
        // Only dot exists.
        // Assuming it's decimal if the user confirmed US format, 
        // e.g. R$ 50.00
      }
      return parseFloat(cleanStr);
    }

    const textValue = balanceEl.textContent.trim();
    let isNegative = textValue.includes('-');
    let balanceVal = parseCurrency(textValue);
    
    if (isNaN(balanceVal)) return false;
    if (isNegative && balanceVal > 0) balanceVal = -balanceVal;

    function findTotalCostValue(root) {
      const labels = (root || document).querySelectorAll('span.xri, label, div');
      for (const label of labels) {
        if (label.textContent.trim() === 'Total Cost of Stay' && isElementVisible(label)) {
          let valueNode = label.closest('.x43r')?.querySelector('.x43s');
          if (!valueNode) {
            const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
            walker.currentNode = label;
            let n;
            let count = 0;
            while ((n = walker.nextNode()) && count < 15) {
              if (/R\$\s*[\d,.]+/.test(n.nodeValue) && isElementVisible(n.parentElement)) {
                return parseCurrency(n.nodeValue);
              }
              count++;
            }
          }
          if (valueNode) return parseCurrency(valueNode.textContent);
        }
      }
      return null;
    }

    const totalCostVal = findTotalCostValue(root);

    const isFluctuating = !!document.querySelector('img[id*="feRateAmnt:ss17:odec_img"][title="Rate Changes"]');
    
    // Formatação de moeda para display
    const formatCurrency = (val) => {
      if (val === null || isNaN(val)) return 'R$ --';
      return 'R$' + val.toFixed(2);
    };
    
    const totalDisplay = formatCurrency(totalCostVal);
    const textValueDisplay = isNegative ? '-R$' + formatCurrency(Math.abs(balanceVal)).substring(2) : formatCurrency(balanceVal);

    if (balanceVal > 0) {
      if (global.AtrioRules.checklist) {
        global.AtrioRules.checklist.setStatus('valores', {
          status: 'error',
          lines: [`TOTAL: ${totalDisplay}`, `SALDO DEVEDOR: ${textValueDisplay} — PASSAR CARTÃO`]
        });
      }
    } else if (balanceVal < 0) {
      if (global.AtrioRules.checklist) {
        if (totalCostVal !== null && Math.abs(balanceVal) === totalCostVal) {
          global.AtrioRules.checklist.setStatus('valores', {
            status: 'ok',
            lines: [`TOTAL: ${totalDisplay}`, `PAGAMENTO REALIZADO`]
          });
        } else {
          global.AtrioRules.checklist.setStatus('valores', {
            status: 'warning',
            lines: [`TOTAL: ${totalDisplay}`, `CRÉDITO DE ${textValueDisplay}`]
          });
        }
      }
    } else {
      if (global.AtrioRules.checklist) {
        if (totalCostVal === 0) {
          global.AtrioRules.checklist.setStatus('valores', {
            status: 'ok',
            lines: [`TOTAL: ${totalDisplay}`, `SEM COBRANÇA`]
          });
        } else if (isFluctuating) {
          global.AtrioRules.checklist.setStatus('valores', {
            status: 'warning',
            lines: [`TOTAL: ${totalDisplay}`, `TARIFA FLUTUOU - VERIFICAR VALOR`]
          });
        } else {
          global.AtrioRules.checklist.setStatus('valores', {
            status: 'warning',
            lines: [`TOTAL: ${totalDisplay}`, `BALANCE ZERADO - VERIFICAR PAGAMENTO`]
          });
        }
      }
    }

    return true;
  }

  global.AtrioRules = global.AtrioRules || {};
  global.AtrioRules.balanceCheck = {
    apply,
  };
})(window);
