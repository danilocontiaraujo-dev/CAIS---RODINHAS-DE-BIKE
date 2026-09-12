# Atrio — Assistente Opera Cloud (Chrome Extension, Manifest V3)

Validação em tempo real e onboarding para o fluxo de check-in do Opera Cloud
(Ibis Jundiaí Shopping).

## Instalação (modo desenvolvedor)

1. Abra `chrome://extensions` no Chrome.
2. Ative **Modo desenvolvedor** (canto superior direito).
3. Clique em **Carregar sem compactação**.
4. Selecione a pasta `atrio-extension` (esta pasta, a que contém `manifest.json`).
5. Abra o Opera Cloud normalmente. A extensão roda automaticamente em
   `accorcu2.oraclehospitality.us-ashburn-1.ocs.oraclecloud.com`.

Não é necessário publicar na Chrome Web Store para uso interno — o modo
desenvolvedor é suficiente. Se quiser distribuir para outros terminais sem
carregar manualmente em cada um, é possível empacotar como `.crx` + política
de instalação forçada via GPO/Chrome Enterprise, mas isso é um passo
posterior, não necessário agora.

## Estrutura

```
atrio-extension/
├── manifest.json          # Manifest V3
├── content.js             # núcleo: roteador de tela + MutationObserver
├── styles.css             # badges, mensagens de erro, tooltips injetados
├── icons/                 # 16/32/48/128 px
└── rules/
    ├── rateBreakfast.js    # Rate Code (RB1-4/RA1-4) + alerta de flutuação tarifária
    ├── email.js            # validação de e-mail na modal de perfil
    └── address.js          # validação de 12 campos de endereço na modal de perfil
```

## Arquitetura (resumo)

- Opera Cloud é uma SPA em Oracle ADF/JET com **PPR** (Partial Page
  Rendering): a URL nunca muda; o servidor substitui fragmentos inteiros do
  DOM. Por isso não há roteamento por URL — a tela é identificada por
  **assinatura de conteúdo** (`detectScreen()` em `content.js`).
- Cada substituição de DOM destrói os badges injetados. O `MutationObserver`
  reage a cada mutação (debounce 150ms), limpa o que foi injetado antes e
  reaplica as regras da tela atual.
- O observer é **desconectado durante a própria injeção** (`observer.disconnect()`
  → injeta → `observer.observe()`) para evitar loop de mutação infinito.
- Seletores usam `[id*="fragmento_estável"]`, nunca o ID inteiro (que contém
  índices voláteis de região do ADF, ex.: `mainRegion:12`).

## Regras implementadas

| Regra | Tela | Arquivo |
|---|---|---|
| Rate Code → café da manhã (whitelist exata RB1-4/RA1-4) | Manage Reservation | `rules/rateBreakfast.js` |
| Alerta de flutuação tarifária (`img[title="Rate Changes"]`) | Manage Reservation | `rules/rateBreakfast.js` |
| E-mail obrigatório + formato válido | Modal de edição de perfil | `rules/email.js` |
| Endereço: 12 campos, regras de caracteres por campo | Modal de edição de perfil | `rules/address.js` |

## Pendências / próximos módulos

- Travel Agent → alerta de verificação VCC/Faturado
- Tooltip no hover do botão Check-in
- Total Cost of Stay na tela de pagamento (Room Selection/Verify Payment)
- Popups pós-Complete-Check-In (FRNH, key-making, Go to Billing) — apenas
  marcadores de progresso, sem leitura de dados (FRNH é `shadow-root closed`
  e está fora do escopo de validação por decisão de produto).

## Notas de manutenção

- Todos os campos da modal de endereço (`fe1`, `fe4`, `fe6`, `fe15`, `fe16`,
  `fe17`, `fe18`, `fe40`) são confirmados estáveis entre reservas e sessões.
- A grid de comunicação (e-mail/telefone) não tem índice de linha fixo — a
  linha do e-mail é localizada pelo campo `Type === "EMAILP"`, nunca por
  posição.
- Idioma da UI: sempre inglês (confirmado). Labels de campo na modal de
  endereço vêm em português mesmo assim (comportamento do próprio Opera
  Cloud, não um bug da extensão) — por isso a ancoragem é sempre por
  fragmento de `id`, nunca por texto de label nessa modal específica.
