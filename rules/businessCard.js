/**
 * Atrio — Utilitário de leitura do Business Card
 *
 * Centraliza a leitura dos campos do business card do Opera Cloud usando
 * fragmentos de ID estáveis dos ícones como âncoras.
 */
(function (global) {
  'use strict';

  const CARD_FIELDS = {
    membership: { idFragment: 'occ_prflbc_memrs' }, // Ícone: ID ...
    address:    { idFragment: 'occ_bcrd_adrs' },    // Ícone: HOME
    email:      { idFragment: 'occ_bcrd_eml' },     // Ícone: EMAILP
    phone:      { idFragment: 'occ_bcrd_phn' },     // Ícone: MOBILEP
  };


  function findElementByRegex(regex) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    while (node = walker.nextNode()) {
      if (regex.test(node.nodeValue.trim())) {
        const el = node.parentElement;
        if (isElementVisible(el)) {
          return el;
        }
      }
    }
    return null;
  }

  /**
   * Lê um campo específico do business card.
   * @param {string} fieldName - 'membership' | 'address' | 'email' | 'phone'
   * @returns {{ container: Element, icon: Element, value: string, rawText: string } | null}
   */
  function read(fieldName) {
    const conf = CARD_FIELDS[fieldName];
    if (!conf) return null;

    let container = document.querySelector(`span[id*="${conf.idFragment}"]`);
    
    if (!container) return null;

    const icon = container.querySelector('img.odec_img');
    
    // Extrai o valor
    let valueStr = '';
    const spanTitle = container.querySelector('span[title]:not(:empty)');
    const anchorTitle = container.querySelector('a[title]');
    
    if (spanTitle) {
      valueStr = spanTitle.getAttribute('title') || spanTitle.textContent;
    } else if (anchorTitle) {
      valueStr = anchorTitle.getAttribute('title') || anchorTitle.textContent;
    } else {
      valueStr = container.textContent;
    }

    return {
      container: container,
      icon: icon,
      value: valueStr ? valueStr.trim() : '',
      rawText: container.textContent.trim()
    };
  }

  function isElementVisible(el) {
    if (!el) return false;
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function readAll() {
    return {
      membership: read('membership'),
      address: read('address'),
      email: read('email'),
      phone: read('phone')
    };
  }

  global.AtrioRules = global.AtrioRules || {};
  global.AtrioRules.businessCard = {
    read,
    readAll
  };
})(window);
