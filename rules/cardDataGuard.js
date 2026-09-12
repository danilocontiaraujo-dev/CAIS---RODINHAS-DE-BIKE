/**
 * Atrio — Regra: Card Data Guard
 *
 * Verifica o business card para detectar e-mails de OTA.
 * Deve rodar após as verificações iniciais.
 */
(function (global) {
  'use strict';

  const OTA_DOMAINS = [
    '@guest.booking.com',
    '@guest.expedia.com',
    '@m.traveloka.com',
    '@hotel.collect',
    '@cvccorp.com.br',
  ];

  function apply(root) {
    const emailData = global.AtrioRules.businessCard?.read('email');
    if (!emailData || !emailData.value) return false;
    
    const email = emailData.value.toLowerCase();
    const isOta = OTA_DOMAINS.some(d => email.includes(d));
    
    if (isOta) {
      if (global.AtrioRules.checklist) {
        global.AtrioRules.checklist.setStatus('chk-email', {
          status: 'warning',
          lines: ['EMAIL DE OTA', 'SOLICITAR EMAIL REAL']
        });
      }
      return true;
    }
    return false;
  }

  global.AtrioRules = global.AtrioRules || {};
  global.AtrioRules.cardDataGuard = {
    apply,
  };
})(window);
