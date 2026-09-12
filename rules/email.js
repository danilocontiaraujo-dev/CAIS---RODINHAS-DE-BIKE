/**
 * Atrio — Regra: E-mail obrigatório e formato válido
 *
 * Campo vive numa GRID de comunicação (Email, Telefone, etc. na mesma tabela),
 * não em um input isolado. A linha do email é identificada pelo campo "Type"
 * = "EMAILP", não por índice fixo (t2:0 pode não ser sempre o email).
 *
 * Fragmentos estáveis dentro da linha:
 *   Type:  input[id*="odec_lov_itLovetext"] com value === "EMAILP"
 *   Valor: input[id*="odec_it_it::content"] na mesma <tr>
 *
 * Esta regra só se aplica DENTRO da modal de edição de perfil (onde o campo
 * é editável). No overview de Manage Reservation o e-mail aparece apenas como
 * link mailto:, que não precisa de validação (é somente leitura).
 */
(function (global) {
  'use strict';

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const SEL_TYPE_INPUTS = 'input[id*="odec_lov_itLovetext"]';
  const SEL_VALUE_INPUT_IN_ROW = 'input[id*="odec_it_it::content"]';

  /**
   * @param {string} value
   * @returns {{valid: boolean, message?: string}}
   */
  function validateEmail(value) {
    const trimmed = (value || '').trim();
    if (!trimmed) {
      return { valid: false, message: 'E-mail é obrigatório.' };
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      return { valid: false, message: 'Formato de e-mail inválido.' };
    }
    return { valid: true };
  }

  /**
   * Localiza o <input> de valor do e-mail dentro da grid de comunicação,
   * varrendo as linhas até achar aquela cujo Type === "EMAILP".
   */
  function findEmailValueInput(root) {
    const scope = root || document;
    const typeInputs = scope.querySelectorAll(SEL_TYPE_INPUTS);

    for (const typeInput of typeInputs) {
      if (typeInput.value !== 'EMAILP') continue;

      const row = typeInput.closest('tr[role="row"]') || typeInput.closest('tr');
      if (!row) continue;

      const valueInput = row.querySelector(SEL_VALUE_INPUT_IN_ROW);
      if (valueInput) return valueInput;
    }
    return null;
  }

  function buildFieldMessage(text) {
    const msg = document.createElement('span');
    msg.className = 'atrio-inline-msg';
    msg.setAttribute('data-atrio-injected', 'email-message');
    msg.textContent = text;
    return msg;
  }

  /**
   * Aplica a regra: marca o campo com erro visual + mensagem inline se inválido.
   * Remove marcações antigas antes de reavaliar (o valor pode ter mudado).
   */
  function apply(root) {
    const input = findEmailValueInput(root);
    if (!input) return false;

    // limpa estado anterior injetado por esta regra
    input.classList.remove('atrio-field-error');
    const cell = input.closest('td') || input.parentElement;
    const oldMsg = cell?.querySelector('[data-atrio-injected="email-message"]');
    if (oldMsg) oldMsg.remove();

    const result = validateEmail(input.value);
    if (!result.valid) {
      input.classList.add('atrio-field-error');
      if (cell) cell.appendChild(buildFieldMessage(result.message));
      return true;
    }
    
    return false;
  }

  global.AtrioRules = global.AtrioRules || {};
  global.AtrioRules.email = {
    validateEmail,
    findEmailValueInput,
    apply,
  };
})(window);
