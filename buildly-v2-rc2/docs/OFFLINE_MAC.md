# BUILDLy Premium V2.1 RC2 — Standalone Offline no Mac

## Finalidade

Esta edição existe para abrir o BUILDLy localmente no Mac sem depender da prévia do ChatGPT nem do domínio temporário `web-sandbox.oaiusercontent.com`.

Arquivo principal:

```text
BUILDLy_Premium_V2_STANDALONE_OFFLINE.html
```

Launcher opcional:

```text
ABRIR_BUILDLY_OFFLINE.command
```

## Garantias desta edição

O standalone offline:

- não registra Service Worker;
- não referencia `sw.js`;
- não usa `fetch`;
- não usa `XMLHttpRequest`;
- não abre `WebSocket` ou `EventSource`;
- não possui `<script src=...>` externo;
- não possui `<link href=...>` externo;
- não contém URLs `http://` ou `https://`;
- usa Content-Security-Policy com `connect-src 'none'` e `worker-src 'none'`;
- mantém os dados DEMO somente no armazenamento local do navegador.

## Como abrir

1. Extraia a pasta do BUILDLy no Mac.
2. Dê duplo clique em `ABRIR_BUILDLY_OFFLINE.command`.
3. Se o macOS bloquear o primeiro uso do `.command`, clique com o botão direito, escolha **Abrir** e confirme.

Também é possível abrir diretamente o HTML com Safari, Chrome ou Edge.

## Importante

A edição offline é para demonstração e inspeção local. Ela não substitui o aplicativo hospedado nem a futura integração com Supabase. O `index.html` continua podendo usar `sw.js` quando servido por HTTP local/hosting para testar PWA; apenas o standalone offline é deliberadamente sem worker e sem rede.
