/**
 * Atrio — Regra: Validação de endereço na modal de edição de perfil
 *
 * Campos ancorados por fragmento de ID (estável entre reservas e sessões,
 * confirmado pelo usuário). Labels vêm em PT/EN misturado no próprio Opera
 * Cloud (não é bug nosso) — por isso NUNCA ancoramos por texto de label aqui,
 * só pelo fragmento de id.
 *
 * Regras de caracteres (conforme especificação original do projeto):
 *   Logradouro (Endereço) -> proibido números ou caracteres especiais
 *   Número                -> permitido apenas dígitos
 *   Bairro                -> proibido números ou caracteres especiais
 *   Complemento           -> proibido números
 *   Cidade                -> proibido caracteres especiais (números não checados)
 *   CEP                   -> apenas dígitos
 *
 * O parser por vírgula do card-resumo (overview) NÃO é usado aqui — é frágil
 * e imutável (concatenação do próprio Opera). Esta modal já expõe os campos
 * individuais, que é a fonte confiável para validar.
 */
(function (global) {
  'use strict';

  // Fragmentos estáveis de cada campo dentro da modal de edição de endereço.
  const FIELD_FRAGMENTS = {
    logradouro:  'fe1:tit8:odec_it_it::content',
    numero:      'fe6:tit9:odec_it_it::content',
    bairro:      'fe4:tit2:odec_it_it::content',
    complemento: 'fe15:tit4:odec_it_it::content',
    cidade:      'fe16:tit5:odec_it_it::content',
    pais:        'fe17:tlov3:odec_lov_itLovetext::content',
    estado:      'fe18:tlov2:odec_lov_itLovetext::content',
    cep:         'fe40:tit6:odec_it_it::content',
  };

  // Regex de validação por campo. Letras acentuadas (áéíóúãõçâê etc.) são
  // aceitas em logradouro/bairro/cidade pois são endereços brasileiros reais.
  const NO_DIGITS_NO_SPECIAL = /^[A-Za-zÀ-ÿ\s.'-]*$/; // logradouro, bairro
  const ONLY_DIGITS = /^[0-9]*$/;                       // numero, cep
  const NO_DIGITS = /^[^0-9]*$/;                         // complemento
  const NO_SPECIAL_CHARS = /^[A-Za-zÀ-ÿ0-9\s.'-]*$/;     // cidade (permite números por segurança, só bloqueia símbolos)

  const FIELD_RULES = {
    logradouro:  { regex: NO_DIGITS_NO_SPECIAL, message: 'Logradouro não pode conter números ou caracteres especiais.' },
    numero:      { regex: ONLY_DIGITS,          message: 'Número deve conter apenas dígitos.' },
    bairro:      { regex: NO_DIGITS_NO_SPECIAL, message: 'Bairro não pode conter números ou caracteres especiais.' },
    complemento: { regex: NO_DIGITS,            message: 'Complemento não pode conter números.' },
    cidade:      { regex: NO_SPECIAL_CHARS,     message: 'Cidade não pode conter caracteres especiais.' },
    cep:         { regex: ONLY_DIGITS,          message: 'CEP deve conter apenas dígitos.' },
  };

  function findFieldElement(key, root) {
    const fragment = FIELD_FRAGMENTS[key];
    if (!fragment) return null;
    return (root || document).querySelector(`[id*="${fragment}"]`);
  }

  /**
   * Lê todos os campos de endereço presentes na modal atual.
   * @returns {Object<string, {element: Element, value: string}|null>}
   */
  function readAllFields(root) {
    const out = {};
    for (const key of Object.keys(FIELD_FRAGMENTS)) {
      const el = findFieldElement(key, root);
      out[key] = el ? { element: el, value: el.value ?? '' } : null;
    }
    return out;
  }

  /**
   * Valida um único campo. Retorna null se o campo não existe na tela
   * (ex: Postal Code Extension e Language não têm regra própria aqui).
   */
  function validateField(key, value) {
    const rule = FIELD_RULES[key];
    if (!rule) return null; // campo sem regra de caracteres definida
    const trimmed = (value || '').trim();
    if (trimmed === '') return { valid: true }; // obrigatoriedade é regra separada, não tratada aqui
    if (!rule.regex.test(trimmed)) {
      return { valid: false, message: rule.message };
    }
    return { valid: true };
  }

  function buildFieldMessage(text) {
    const msg = document.createElement('span');
    msg.className = 'atrio-inline-msg';
    msg.setAttribute('data-atrio-injected', 'address-message');
    msg.textContent = text;
    return msg;
  }

  function clearFieldMarkers(el) {
    el.classList.remove('atrio-field-error');
    const container = el.closest('span[id*="odec_flem"]') || el.parentElement;
    const oldMsg = container?.querySelector('[data-atrio-injected="address-message"]');
    if (oldMsg) oldMsg.remove();
    return container;
  }

  /**
   * Aplica a validação em todos os campos de endereço presentes na tela.
   * @returns {boolean} true se pelo menos um campo tem erro
   */
  function apply(root) {
    const fields = readAllFields(root);
    let hasError = false;

    for (const [key, field] of Object.entries(fields)) {
      if (!field) continue; // campo não está nesta tela (modal fechada ou parcial)

      const container = clearFieldMarkers(field.element);
      const result = validateField(key, field.value);

      if (result && !result.valid) {
        field.element.classList.add('atrio-field-error');
        if (container) container.appendChild(buildFieldMessage(result.message));
        hasError = true;
      }
    }

    return hasError;
  }

  global.AtrioRules = global.AtrioRules || {};
  global.AtrioRules.address = {
    FIELD_FRAGMENTS,
    findFieldElement,
    readAllFields,
    validateField,
    apply,
  };
})(window);
