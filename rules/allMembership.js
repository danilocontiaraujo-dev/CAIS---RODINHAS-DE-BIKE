/**
 * Atrio — Regra: ALL Membership (Accor Live Limitless)
 */
(function (global) {
  'use strict';

  function apply(root) {
    // Agora o checklist cuida da renderização, só precisamos ler
    const allData = global.AtrioRules.businessCard?.read('membership');
    
    if (!allData || !allData.value || allData.value.trim() === '') {
      if (global.AtrioRules.checklist) {
        global.AtrioRules.checklist.setStatus('all-member', {
          status: 'warning',
          lines: ['SEM ALL', 'OFEREÇA O PROGRAMA']
        });
      }
    } else {

      
      const text = allData.value.toUpperCase();
      let title = "CLIENTE ALL";
      let msg = "AGRADEÇA A FIDELIDADE";
      
      if (text.includes('A2') || text.includes('SILVER')) {
        title = "ALL SILVER";
        msg = "WELCOME DRINK E LCO";
      } else if (text.includes('A3') || text.includes('GOLD')) {
        title = "ALL GOLD";
        msg = "WELCOME DRINK + EARLY CHECK-IN OU LCO";
      } else if (text.includes('A4') || text.includes('PLATINUM')) {
        title = "ALL PLATINUM";
        msg = "WELCOME DRINK + EARLY CHECK-IN E LCO";
      } else if (text.includes('A5') || text.includes('DIAMOND')) {
        title = "ALL DIAMOND";
        msg = "WELCOME DRINK + EARLY CHECK-IN E LCO";
      } else if (text.includes('A1') || text.includes('CLASSIC')) {
        title = "ALL CLASSIC";
      }

      if (global.AtrioRules.checklist) {
        global.AtrioRules.checklist.setStatus('all-member', {
          status: 'ok',
          lines: [title, msg]
        });
      }
    }
    
    return true;
  }

  global.AtrioRules = global.AtrioRules || {};
  global.AtrioRules.allMembership = {
    apply,
  };
})(window);
