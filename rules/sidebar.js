/**
 * Atrio — Checklist Manager
 *
 * Gerencia o checklist unificado de validação na tela de check-in.
 */
(function (global) {
  'use strict';

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Ordem fixa dos itens do checklist
  const CHECKLIST_ITEMS = [
    { id: 'all-member',     label: 'CLIENTE ALL' },
    { id: 'chk-address',    label: 'ENDEREÇO' },
    { id: 'chk-email',      label: 'EMAIL' },
    { id: 'chk-phone',      label: 'TELEFONE' },
    { id: 'rate-breakfast', label: 'CAFÉ DA MANHÃ' },
    { id: 'travel-agent',   label: 'TIPO DE PAGAMENTO' },
    { id: 'valores',        label: 'VALORES' },
  ];

  let currentStatus = {};
  let checklistContainer = null;

  function getChecklistContainer() {
    if (!checklistContainer) {
      checklistContainer = document.createElement('div');
      checklistContainer.className = 'atrio-left-sidebar';
      document.body.appendChild(checklistContainer);
    }
    return checklistContainer;
  }

  /**
   * Define o status de um item do checklist
   * @param {string} id - ID do item
   * @param {object} data - { status: 'ok'|'error'|'warning', lines: string[] }
   */
  function setStatus(id, data) {
    currentStatus[id] = data;
  }

  function getStatusIcon(status) {
    if (status === 'ok') return '<span class="atrio-status-icon atrio-status-ok">✓</span>';
    if (status === 'error') return '<span class="atrio-status-icon atrio-status-error">✗</span>';
    if (status === 'warning') return '<span class="atrio-status-icon atrio-status-warning">!</span>';
    return '<span class="atrio-status-icon atrio-status-none"></span>';
  }

  function render() {
    // Apenas renderiza se houver itens definidos
    if (Object.keys(currentStatus).length === 0) {
      if (checklistContainer) checklistContainer.innerHTML = '';
      return;
    }

    const sb = getChecklistContainer();
    
    // Calcula progresso
    const totalItems = CHECKLIST_ITEMS.length;
    let okItems = 0;
    
    let hasError = false;
    CHECKLIST_ITEMS.forEach(item => {
      const state = currentStatus[item.id];
      if (state && (state.status === 'ok' || state.status === 'warning')) okItems++;
      if (state && state.status === 'error') hasError = true;
    });

    const progressPercent = Math.round((okItems / totalItems) * 100);
    
    let progressColorClass = 'atrio-progress-red';
    if (progressPercent > 40 && progressPercent <= 70) progressColorClass = 'atrio-progress-orange';
    else if (progressPercent > 70 && progressPercent < 100) progressColorClass = 'atrio-progress-yellow';
    else if (progressPercent === 100) progressColorClass = 'atrio-progress-green';

    let glowClass = '';
    if (progressPercent === 100) {
      glowClass = 'atrio-checklist-glow';
    }

    let html = `
      <div class="atrio-checklist ${glowClass} ${hasError ? 'atrio-btn-error-border' : 'atrio-btn-success-border'}">
        <div class="atrio-checklist-header">
          <div class="atrio-checklist-title-row">
            <span>CHECKLIST DE CHECK-IN</span>
          </div>
          <div class="atrio-progress-bar-bg">
            <div class="atrio-progress-bar-fill ${progressColorClass}" style="width: ${progressPercent}%;"></div>
          </div>
        </div>
        <div class="atrio-checklist-body">
    `;

    CHECKLIST_ITEMS.forEach((item, index) => {
      const state = currentStatus[item.id];
      
      // Se a regra não setou estado, não exibe
      if (!state) return;

      const linesHtml = (state.lines || []).map(l => escapeHtml(l)).join(' - ');
      const isLast = index === CHECKLIST_ITEMS.length - 1;
      
      html += `
        <div class="atrio-checklist-item ${isLast ? 'atrio-checklist-item-last' : ''}">
          <div class="atrio-checklist-item-icon">
            ${getStatusIcon(state.status)}
          </div>
          <div class="atrio-checklist-item-content">
            <div class="atrio-checklist-item-label">${escapeHtml(item.label)}</div>
            <div class="atrio-checklist-item-details">${linesHtml}</div>
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;

    sb.innerHTML = html;
  }

  function clearAll() {
    currentStatus = {};
    if (checklistContainer) {
      checklistContainer.innerHTML = '';
    }
  }

  global.AtrioRules = global.AtrioRules || {};
  global.AtrioRules.checklist = {
    setStatus,
    render,
    clearAll
  };

  // --- Top Bar Logic (Mantida pois são os alertas na área principal da tela) ---
  const TOP_SORT_ORDER = {
    'all-member': 1,
    'chk-address': 2,
    'chk-email': 3,
    'chk-phone': 4
  };

  function getTopBarContainer() {
    let container = document.getElementById('atrio-top-bar-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'atrio-top-bar-container';
      container.className = 'atrio-top-bar';
      document.body.appendChild(container);
    }
    return container;
  }

  function setTopItem(id, colorClass, htmlContent) {
    const container = getTopBarContainer();
    let item = document.getElementById('atrio-top-' + id);
    if (!item) {
      item = document.createElement('div');
      item.id = 'atrio-top-' + id;
      item.className = 'atrio-top-bar-item';
      if (TOP_SORT_ORDER[id]) {
        item.style.order = TOP_SORT_ORDER[id];
      }
      container.appendChild(item);
    }
    
    item.className = `atrio-top-bar-item ${colorClass}`;
    item.innerHTML = htmlContent;
  }

  function removeTopItem(id) {
    const item = document.getElementById('atrio-top-' + id);
    if (item) {
      item.remove();
    }
  }

  function clearTopAll() {
    const container = document.getElementById('atrio-top-bar-container');
    if (container) {
      container.remove();
    }
  }

  global.AtrioRules.topbar = {
    setItem: setTopItem,
    removeItem: removeTopItem,
    clearAll: clearTopAll
  };

})(window);
