/**
 * Atrio — content.js (núcleo)
 *
 * Arquitetura resumida (ver histórico de decisões no README):
 *   - Opera Cloud é SPA baseada em Oracle ADF/JET com PPR (Partial Page
 *     Rendering): a URL nunca muda, o servidor manda fragmentos que
 *     substituem nós inteiros do DOM via replaceChild.
 *   - Por isso NÃO existe roteamento por URL. A tela é identificada por
 *     assinatura de conteúdo (âncoras de texto/id estáveis).
 *   - Cada substituição de DOM destrói os badges/marcações injetados
 *     anteriormente -> é obrigatório reinjetar a cada mutação relevante.
 *   - O MutationObserver é desconectado durante a própria injeção para
 *     evitar loop de mutação (nosso próprio insertAdjacentElement dispara
 *     o observer de novo).
 */
(function () {
  'use strict';

  console.log('==========================================');
  console.log('ATRIO EXTENSION LOADED - VERSÃO ATUALIZADA');
  console.log('==========================================');

  const DEBOUNCE_MS = 150;
  const BADGE_CLASS = 'atrio-badge';
  const INJECTED_ATTR = 'data-atrio-injected';

  const SCREEN = {
    UNKNOWN: 'unknown',
    MANAGE_RESERVATION: 'manage_reservation',
    PROFILE_EDIT_MODAL: 'profile_edit_modal',
    CHECKIN_ROOM: 'checkin_room',
    CHECKIN_PAYMENT: 'checkin_payment',
  };

  // ---- detecção de tela por assinatura de conteúdo -------------------------


  function isElementVisible(el) {
    if (!el) return false;
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }

  function findTrainStopByText(text) {
    const spans = document.querySelectorAll('span.x2d7');
    for (const s of spans) {
      if (s.textContent.trim() === text && isElementVisible(s)) return s;
    }
    return null;
  }

  function findButtonByLabel(text) {
    const labels = document.querySelectorAll('span.xri');
    for (const l of labels) {
      if (l.textContent.trim() === text && isElementVisible(l)) {
        return l.closest('div[role="presentation"], a') || l.parentElement;
      }
    }
    return null;
  }

  function isProfileEditModalOpen() {
    const el = document.querySelector('[id*="fe1:tit8:odec_it_it::content"]');
    return el && isElementVisible(el);
  }

  function getBreadcrumbs() {
    return Array.from(document.querySelectorAll('a.xst, a.xst.p_AFDisabled'))
      .map(a => a.textContent.trim().toLowerCase());
  }

  function detectScreen() {
    const visibleHeaders = Array.from(document.querySelectorAll('h1.x1x3')).filter(h => isElementVisible(h));
    const activeTitle = visibleHeaders.length > 0 ? visibleHeaders[0].textContent.trim() : '';
    
    if (activeTitle !== 'Manage Reservation' && activeTitle !== 'Manage Profile') {
      return SCREEN.UNKNOWN;
    }

    if (isProfileEditModalOpen() || activeTitle === 'Manage Profile') {
      return SCREEN.PROFILE_EDIT_MODAL;
    }

    const hasTrain = findTrainStopByText('Room Selection') && findTrainStopByText('Verify Payment');
    if (hasTrain) {
      if (findButtonByLabel('Complete Check In')) return SCREEN.CHECKIN_PAYMENT;
      return SCREEN.CHECKIN_ROOM;
    }

    if (activeTitle === 'Manage Reservation') {
      const bc = getBreadcrumbs();
      
      // Inteligência de tela com base nos breadcrumbs
      const manageCount = bc.filter(b => b === 'manage reservation').length;
      const hasArrivals = bc.includes('arrivals');
      const hasBookings = bc.includes('bookings');
      
      // O usuário relatou que em Bookings a tela certa tem DOIS 'Manage Reservation' no caminho.
      // Em Arrivals tem apenas UM.
      
      if (hasArrivals && manageCount >= 1) {
        return SCREEN.MANAGE_RESERVATION;
      }
      
      if (hasBookings && manageCount >= 2) {
        return SCREEN.MANAGE_RESERVATION;
      }
      
      // Fallback
      return SCREEN.UNKNOWN;
    }

    return SCREEN.UNKNOWN;
  }

  // ---- limpeza -------------------------------------------------------------

  function clearInjected() {
    document.querySelectorAll('.' + BADGE_CLASS + ', .atrio-top-banner').forEach((n) => n.remove());
    document.querySelectorAll('[' + INJECTED_ATTR + ']').forEach((n) => n.remove());
    document.querySelectorAll('.atrio-field-error, .atrio-bg-orange, .atrio-bg-purple, .atrio-bg-green, .atrio-bg-blue, .atrio-bg-darkblue, .atrio-bg-pink, .atrio-bg-teal, .atrio-bg-yellow, .atrio-bg-lime, .atrio-bg-gray, .atrio-bg-gold, .atrio-border-dashed-red, .atrio-underline-gold, .atrio-underline-teal, .atrio-underline-orange')
      .forEach((n) => n.classList.remove(
        'atrio-field-error', 'atrio-bg-orange', 'atrio-bg-purple', 'atrio-bg-green', 'atrio-bg-blue', 'atrio-bg-darkblue', 'atrio-bg-pink', 'atrio-bg-teal', 'atrio-bg-yellow', 'atrio-bg-lime', 'atrio-bg-gray', 'atrio-bg-gold', 'atrio-border-dashed-red', 'atrio-underline-gold', 'atrio-underline-teal', 'atrio-underline-orange'
      ));
    
    if (window.AtrioRules && window.AtrioRules.checklist) {
      window.AtrioRules.checklist.clearAll();
    }
    if (window.AtrioRules && window.AtrioRules.topbar) {
      window.AtrioRules.topbar.clearAll();
    }
  }

  // ---- aplicação de regras por tela -----------------------------------------

  function applyRulesForScreen(screen) {
    const rules = window.AtrioRules || {};

    switch (screen) {
      case SCREEN.MANAGE_RESERVATION:
        // Verifica se é Arrival (tem botão de Check In)
        const checkInBtn = document.querySelector('a[title="Check In"], a[title="Complete Check In"]') || findButtonByLabel('Check In');
        
        if (checkInBtn) {
          rules.rateBreakfast?.apply(document);
          rules.travelAgent?.apply(document);
          rules.totalCost?.apply(document);
          rules.checkinLock?.apply(document);
          rules.balanceCheck?.apply(document);
          rules.cardDataGuard?.apply(document);
          rules.allMembership?.apply(document);
          
          // Renderiza o checklist por último
          rules.checklist?.render();
        }
        break;

      case SCREEN.PROFILE_EDIT_MODAL:
        rules.email?.apply(document);
        rules.address?.apply(document);
        break;

      case SCREEN.CHECKIN_ROOM:
      case SCREEN.CHECKIN_PAYMENT:
        // Regras de progresso pós-Room-Selection entram aqui quando mapeadas
        // (TCOS, lembrete de VCC/Faturado, etc.)
        break;

      default:
        break;
    }
  }

  // ---- loop de observação com disconnect/reconnect --------------------------

  let observer = null;
  let debounceId = null;

  function runCycle() {
    // Desconecta antes de injetar para não reagir às próprias mutações.
    observer?.disconnect();

    try {
      clearInjected();
      const screen = detectScreen();
      if (screen !== SCREEN.UNKNOWN) {
        applyRulesForScreen(screen);
      }
    } finally {
      observer?.observe(document.body, { childList: true, subtree: true });
    }
  }

  function onDomChanged() {
    clearTimeout(debounceId);
    debounceId = setTimeout(runCycle, DEBOUNCE_MS);
  }

  function start() {
    observer = new MutationObserver(onDomChanged);
    observer.observe(document.body, { childList: true, subtree: true });
    runCycle(); // primeira passada
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
