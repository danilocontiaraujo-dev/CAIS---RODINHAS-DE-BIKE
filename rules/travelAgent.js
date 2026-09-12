/**
 * Atrio — Regra: Travel Agent
 *
 * Localiza a label "Travel Agent" na tela e verifica
 * se há um nome configurado abaixo dela. Se houver, alerta para VCC/Faturado.
 */
(function (global) {
  'use strict';

  function findTravelAgentLabel(root) {
    const labels = (root || document).querySelectorAll('span.xri');
    for (const l of labels) {
      if (l.textContent.trim() === 'Travel Agent') {
        return l;
      }
    }
    return null;
  }

  function buildTravelAgentBadge() {
    const badge = document.createElement('div');
    badge.className = 'atrio-badge atrio-badge--warn';
    badge.setAttribute('data-atrio-injected', 'travel-agent');
    badge.textContent = '💳 Verificar VCC/Faturado ou Pagamento Direto';
    badge.style.marginTop = '4px';
    badge.style.display = 'inline-block';
    return badge;
  }

  function isElementVisible(el) {
    if (!el) return false;
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function apply(root) {
    let injected = false;
    
    const labels = (root || document).querySelectorAll('span.xri, label, div');
    let travelAgentValueNode = null;
    let travelAgentName = '';

    for (const label of labels) {
      if (label.textContent.trim() === 'Travel Agent' && isElementVisible(label)) {
        travelAgentValueNode = label.closest('.x43r')?.querySelector('.x43s');
        
        if (!travelAgentValueNode) {
          const td = label.closest('td');
          if (td && td.nextElementSibling) {
            travelAgentValueNode = td.nextElementSibling;
          }
        }
        
        if (travelAgentValueNode) {
          let name = travelAgentValueNode.textContent.trim();
          const words = name.split(/\s+/);
          if (words.length > 2) {
            name = words.slice(0, 2).join(' ');
          }
          travelAgentName = name;
          break;
        }
      }
    }

    // Detectar "Faturado" ou "Pagamento Direto" no campo Display Color - Reservation
    let paymentType = null;
    const displayColorAddtl = document.querySelector('span[id*="occ_prflbc_bc:feClr:odec_flem_addtl"]');
    if (displayColorAddtl) {
      const displayColorText = displayColorAddtl.textContent.trim().toLowerCase();
      if (displayColorText.includes('faturado')) {
        paymentType = 'FATURADO';
      } else if (displayColorText.includes('pagamento direto')) {
        paymentType = 'PAGAMENTO DIRETO';
      }
    }

    if (travelAgentValueNode && travelAgentName && travelAgentName !== '' && travelAgentName !== '-' && travelAgentName !== '–') {
      if (global.AtrioRules.checklist) {
        const lines = [travelAgentName];
        if (paymentType) {
          lines.push(paymentType);
        } else {
          lines.push('VERIFICAR MEIO DE PAGAMENTO');
        }
        global.AtrioRules.checklist.setStatus('travel-agent', {
          status: 'warning',
          lines: lines
        });
      }
      injected = true;
    } else {
      if (global.AtrioRules.checklist) {
        if (paymentType) {
          global.AtrioRules.checklist.setStatus('travel-agent', {
            status: 'warning',
            lines: [paymentType]
          });
        } else {
          global.AtrioRules.checklist.setStatus('travel-agent', {
            status: 'ok',
            lines: ['NÃO IDENTIFICADO']
          });
        }
      }
    }
    return injected;
  }

  global.AtrioRules = global.AtrioRules || {};
  global.AtrioRules.travelAgent = {
    apply,
  };
})(window);
