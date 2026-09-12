/**
 * Atrio — Regra: Rate Code / Café da manhã
 *
 * A regra aceita que o código (ex: RB1) esteja em qualquer parte da string (ex: FLMRB1).
 *   RB1, RB2, RB3, RB4 -> café incluso
 *   RA1, RA2, RA3, RA4 -> café NÃO incluso
 *   qualquer outro valor -> popup neutro pedindo verificação manual
 *
 * Adicionado: Checagem do campo "TARS Tariff Name" para detectar "BED AND BREAKFAST".
 */
(function (global) {
  'use strict';

  const BREAKFAST_INCLUDED = ['rb1', 'rb2', 'rb3', 'rb4'];
  const BREAKFAST_EXCLUDED = ['ra1', 'ra2', 'ra3', 'ra4'];

  const SEL_RATE_CODE_VALUE = '[id*="feRateCode:otRateCode:odec_it_it::content"]';
  const SEL_RATE_AMOUNT_BLOCK = '[id*="feRateAmnt:odec_flem"]';
  const SEL_RATE_CHANGES_ICON = 'img[title="Rate Changes"]';

  /**
   * @param {string} rawCode - valor bruto do campo (ex: "RB1", "FLMRB1")
   * @param {string} tarsName - descrição do TARS Tariff Name
   * @returns {{status: 'included'|'excluded'|'unknown', message: string}}
   */
  function classifyRateCode(rawCode, tarsName) {
    const code = (rawCode || '').trim().toLowerCase();
    const tars = (tarsName || '').trim().toLowerCase();

    // Se bater código RB ou se na descrição TARS tiver "bed and breakfast"
    if (BREAKFAST_INCLUDED.some(r => code.includes(r)) || tars.includes('bed and breakfast') || tars.includes('cafe da manha') || tars.includes('café da manhã')) {
      return { status: 'included', message: 'CAFÉ DA MANHÃ INCLUSO.' };
    }
    if (BREAKFAST_EXCLUDED.some(r => code.includes(r))) {
      return { status: 'excluded', message: 'CAFÉ DA MANHÃ NÃO INCLUSO.' };
    }
    return {
      status: 'unknown',
      message: 'VERIFICAR NO PACKAGE SE O CAFÉ DA MANHÃ ESTÁ INCLUSO E INFORME AO PAX.',
    };
  }

  function findRateCodeElement(root) {
    return (root || document).querySelector(SEL_RATE_CODE_VALUE);
  }

  function findTarsName(root) {
    const labels = (root || document).querySelectorAll('label');
    for (const l of labels) {
      if (l.textContent.trim().includes('TARS Tariff Name')) {
        const container = l.closest('.x43t, .x43p, .x43r') || l.parentElement;
        if (container && container.parentElement) {
          const valueSpan = container.parentElement.querySelector('.x43s');
          if (valueSpan) return valueSpan.textContent;
        }
      }
    }
    return '';
  }

  function findRateChangesIcon(root) {
    const block = (root || document).querySelector(SEL_RATE_AMOUNT_BLOCK);
    if (!block) return null;
    return block.querySelector(SEL_RATE_CHANGES_ICON);
  }

  /**
   * Aplica a regra na tela atual. Retorna true se algo foi injetado.
   */
  function apply(root) {
    let injected = false;

    const rateCodeEl = findRateCodeElement(root);
    if (rateCodeEl) {
      let targetEl = rateCodeEl.closest('.x43r')?.querySelector('.x43s') || rateCodeEl;
      const tarsName = findTarsName(root);
      const classification = classifyRateCode(rateCodeEl.textContent, tarsName);
      


      if (global.AtrioRules.checklist) {
        global.AtrioRules.checklist.setStatus('rate-breakfast', {
          status: classification.status === 'included' ? 'ok' : 'warning',
          lines: classification.status === 'included' ? ['INCLUSO (RB1)'] 
               : classification.status === 'excluded' ? ['NÃO INCLUSO']
               : ['VERIFICAR NO PACKAGE']
        });
      }
      
      injected = true;
    } else {
      if (global.AtrioRules.checklist) {
        global.AtrioRules.checklist.setStatus('rate-breakfast', {
          status: 'warning',
          lines: ['NÃO ENCONTRADO']
        });
      }
    }

    return injected;
  }

  global.AtrioRules = global.AtrioRules || {};
  global.AtrioRules.rateBreakfast = {
    classifyRateCode,
    findRateCodeElement,
    findRateChangesIcon,
    apply,
  };
})(window);
