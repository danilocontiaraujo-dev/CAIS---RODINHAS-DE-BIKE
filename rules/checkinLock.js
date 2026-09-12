/**
 * Atrio — Regra: Trava do Check-in Animada e Validação de Tela
 *
 * Trava o botão de Check-in validando os dados da tela principal.
 */
(function (global) {
  'use strict';

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  let checkinUnlockedManually = false;
  const listenerMap = new WeakMap();

  function findCheckInButton(root) {
    const labels = (root || document).querySelectorAll('span.xri');
    for (const l of labels) {
      if (l.textContent.trim() === 'Check In') {
        return l.closest('div[role="presentation"]') || l.closest('a') || l.parentElement;
      }
    }
    return null;
  }

  function findFieldByLabel(root, labelText) {
    const labels = (root || document).querySelectorAll('label, span.xri');
    for (const l of labels) {
      if (l.textContent.trim().toLowerCase().includes(labelText.toLowerCase())) {
        const container = l.closest('.x43t, .x43p, .x43r, td, table') || l.parentElement;
        if (container) return container;
      }
    }
    return null;
  }

  function validateAddress(addressStr) {
    if (!addressStr || addressStr.trim() === "") return { status: 'error', msg: "CAMPO VAZIO" };
    
    const tokens = addressStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
    if (tokens.length < 6) return { status: 'error', msg: "ENDEREÇO INCOMPLETO" };

    const cep = tokens[tokens.length - 1];
    const country = tokens[tokens.length - 2];
    const state = tokens[tokens.length - 3];
    const city = tokens[tokens.length - 4];

    if (country.toUpperCase() !== 'BR') {
      return { status: 'warning', msg: "ENDEREÇO ESTRANGEIRO - VERIFICAR MANUALMENTE" };
    }

    if (!/^[0-9]{5,}$/.test(cep)) return { status: 'error', msg: "CEP INVÁLIDO" };
    if (!/^[A-Za-z]{2}$/.test(country)) return { status: 'error', msg: "PAÍS INVÁLIDO" };
    if (!/^[A-Za-z]{2}$/.test(state)) return { status: 'error', msg: "ESTADO INVÁLIDO" };
    if (!/^[A-Za-zÀ-ÿ\s.'-]+$/.test(city)) return { status: 'error', msg: "CIDADE INVÁLIDA" };

    const rua = tokens[0];
    const numero = tokens[1];
    const bairro = tokens[2];

    if (!/^[A-Za-zÀ-ÿ\s.'-]+$/.test(rua)) return { status: 'error', msg: "RUA INVÁLIDA" };
    if (!/^[0-9]+$/.test(numero)) return { status: 'error', msg: "NÚMERO INVÁLIDO" };
    if (!/^[A-Za-zÀ-ÿ\s.'-]+$/.test(bairro)) return { status: 'error', msg: "BAIRRO INVÁLIDO" };

    if (tokens.length > 6) {
      for (let i = 3; i < tokens.length - 4; i++) {
        if (!/^[A-Za-zÀ-ÿ\s.'-]+$/.test(tokens[i])) {
          return { status: 'error', msg: "COMPLEMENTO INVÁLIDO" };
        }
      }
    }

    return { status: 'ok' };
  }

  function validateEmail(emailStr) {
    if (!emailStr || emailStr.trim() === "") return "CAMPO VAZIO";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailStr)) {
      return "FORMATO DE E-MAIL INVÁLIDO.";
    }
    return null;
  }

  function validatePhone(phoneStr) {
    if (!phoneStr || phoneStr.trim() === "") return "CAMPO VAZIO";
    const trimmed = phoneStr.trim();
    if (/^[0-9]+$/.test(trimmed)) {
      if (trimmed.length < 10 || trimmed.length > 20) return "CARACTERES INVÁLIDOS";
      return null;
    }
    return "CARACTERES INVÁLIDOS";
  }

  function isRateFluctuating() {
    return !!document.querySelector('img[id*="feRateAmnt:ss17:odec_img"][title="Rate Changes"]');
  }

  function isElementVisible(el) {
    if (!el) return false;
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }


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

  function checkProfileErrors() {
    let hasErrors = false;

    const badges = [];
    const chk = global.AtrioRules.checklist;

    function addBadge(id, title, subtitle, colorClass) {
      badges.push({ id, title, subtitle, colorClass });
    }

    // 1. Endereço (Laranja -> Checklist)
    const addrData = global.AtrioRules.businessCard?.read('address');
    const addressStr = addrData ? addrData.value : '';
    const addrResult = validateAddress(addressStr);
    
    if (addrResult.status === 'error') {
      addBadge('chk-address', 'ENDEREÇO ❌', addrResult.msg, 'atrio-bg-orange');
      if (chk) chk.setStatus('chk-address', { status: 'error', lines: [addrResult.msg] });
      hasErrors = true;
    } else if (addrResult.status === 'warning') {
      addBadge('chk-address', 'ENDEREÇO ⚠', addrResult.msg, 'atrio-bg-yellow');
      if (chk) chk.setStatus('chk-address', { status: 'warning', lines: [addrResult.msg] });
    } else {
      if (chk) chk.setStatus('chk-address', { status: 'ok', lines: ['VÁLIDO'] });
    }

    // 2. Email (Cinza -> Checklist)
    const emailData = global.AtrioRules.businessCard?.read('email');
    const emailStr = emailData ? emailData.value : '';
    const emailError = validateEmail(emailStr);
    
    if (emailError) {
      addBadge('chk-email', 'EMAIL ❌', emailError, 'atrio-bg-yellow');
      if (chk) chk.setStatus('chk-email', { status: 'error', lines: [emailError] });
      hasErrors = true;
    } else {
      if (chk) chk.setStatus('chk-email', { status: 'ok', lines: [emailStr] });
    }

    // 3. Telefone (Lima -> Checklist)
    const phoneData = global.AtrioRules.businessCard?.read('phone');
    const phoneStr = phoneData ? phoneData.value : '';
    const phoneError = validatePhone(phoneStr);
    
    if (phoneError) {
      addBadge('chk-phone', 'TELEFONE ❌', phoneError, 'atrio-bg-lime');
      if (chk) chk.setStatus('chk-phone', { status: 'error', lines: [phoneError] });
      hasErrors = true;
    } else {
      if (chk) chk.setStatus('chk-phone', { status: 'ok', lines: ['VÁLIDO'] });
    }

    return { hasErrors, badges };
  }

  function apply(root) {
    const checkInBtn = findCheckInButton(root);

    document.querySelectorAll('.atrio-bg-orange, .atrio-bg-purple, .atrio-bg-gray, .atrio-bg-blue, .atrio-bg-teal, .atrio-bg-yellow, .atrio-bg-lime, .atrio-border-dashed-red').forEach(el => {
      el.classList.remove('atrio-bg-orange', 'atrio-bg-purple', 'atrio-bg-gray', 'atrio-bg-blue', 'atrio-bg-teal', 'atrio-bg-yellow', 'atrio-bg-lime', 'atrio-field-error', 'atrio-border-dashed-red');
    });

    // Remover containers antigos
    const oldContainer = document.querySelector('.atrio-top-area-container');
    if (oldContainer) oldContainer.remove();
    const oldBanner = document.querySelector('.atrio-top-banner');
    if (oldBanner) oldBanner.remove();
    const oldTooltip = document.querySelector('.atrio-checkin-tooltip');
    if (oldTooltip) oldTooltip.remove();

    // Regra In House: Se não há botão de Check In, não fazemos validações na tela
    if (!checkInBtn) {
      return false;
    }

    const { hasErrors } = checkProfileErrors();

    // Limpar listener antigo para não acumular em re-renders do ADF
    const oldListeners = listenerMap.get(checkInBtn);
    if (oldListeners) {
      checkInBtn.removeEventListener('click', oldListeners.click);
      checkInBtn.removeEventListener('mouseenter', oldListeners.mouseEnter);
      checkInBtn.removeEventListener('mouseleave', oldListeners.mouseLeave);
    }
    const currentListeners = {};
    listenerMap.set(checkInBtn, currentListeners);

    // Estilo do botão: borda vermelha se erros, verde se ok
    checkInBtn.classList.remove('atrio-btn-locked', 'atrio-btn-error-border', 'atrio-btn-success-border');

    if (hasErrors) {
      checkInBtn.classList.add('atrio-btn-error-border');
      
      // Cria o tooltip apenas uma vez e deixa oculto
      let tooltip = document.querySelector('.atrio-checkin-tooltip');
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'atrio-checkin-tooltip';
        tooltip.setAttribute('data-atrio-injected', 'checkin-tooltip');
        tooltip.innerHTML = '<strong>ERROS NO CADASTRO</strong><br>VERIFICAR ANTES DO CHECK-IN';
        document.body.appendChild(tooltip);
      }
      
      // Tooltip no hover do botão Check In
      currentListeners.mouseEnter = function() {
        const tooltipEl = document.querySelector('.atrio-checkin-tooltip');
        if (tooltipEl) {
          const rect = checkInBtn.getBoundingClientRect();
          // Posicionar à esquerda do botão
          tooltipEl.style.top = rect.top + 'px';
          // Para colocar à esquerda, pegamos o left do botão, menos a largura aproximada do tooltip (ou deixamos right = janela - left do botão + margem)
          tooltipEl.style.right = (window.innerWidth - rect.left + 10) + 'px';
          tooltipEl.style.display = 'block';
        }
      };
      
      currentListeners.mouseLeave = function() {
        const tooltipEl = document.querySelector('.atrio-checkin-tooltip');
        if (tooltipEl) tooltipEl.style.display = 'none';
      };
      
      checkInBtn.addEventListener('mouseenter', currentListeners.mouseEnter);
      checkInBtn.addEventListener('mouseleave', currentListeners.mouseLeave);
    } else {
      checkInBtn.classList.add('atrio-btn-success-border');
    }
    
    // Early Check-in no clique
    currentListeners.click = function(e) {
      if (hasErrors) return;
      
      const currentHour = new Date().getHours();
      if (currentHour < 11) {
        let isExempt = false;
        
        // Procurar o nível ALL via businessCard
        const allData = global.AtrioRules.businessCard?.read('membership');
        if (allData && allData.value) {
          const text = allData.value.toUpperCase();
          if (text.includes('A3') || text.includes('GOLD') || text.includes('A4') || text.includes('PLATINUM') || text.includes('A5') || text.includes('DIAMOND')) {
            isExempt = true;
          }
        }
        
        if (!isExempt) {
          const popup = document.createElement('div');
          popup.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.6); z-index: 999999; display: flex; align-items: center; justify-content: center; pointer-events: none;">
              <div style="background: #d32f2f; color: white; padding: 40px; border-radius: 8px; font-size: 26px; font-weight: bold; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5); max-width: 80%; text-transform: uppercase;">
                HORÁRIO DE EARLY CHECK-IN!<br><br>OFERECER E COBRAR MEIA DIÁRIA.
              </div>
            </div>
          `;
          document.body.appendChild(popup);
          setTimeout(() => { popup.remove(); }, 5000);
        }
      }
    };
    checkInBtn.addEventListener('click', currentListeners.click);
    
    return true;
  }

  global.AtrioRules = global.AtrioRules || {};
  global.AtrioRules.checkinLock = {
    apply,
  };
})(window);
