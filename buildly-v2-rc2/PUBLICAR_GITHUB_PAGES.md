# Publicar V2 Premium em GitHub Pages

## URL pública resultante

```
https://jonacir2023.github.io/JC/
```

## Configuração (1 vez)

1. Ir para: https://github.com/Jonacir2023/JC/settings/pages
2. **Source**: Branch → `claude/wonderful-brown-1g6oil`
3. **Folder**: `/` (raiz)
4. Clique **Save**
5. Aguardar ~2 min (GitHub processa)

A URL fica pronta em: https://jonacir2023.github.io/JC/

## Fluxo depois

1. Claude faz mudança em `app.js` (ou qualquer arquivo)
2. Claude faz commit + push
3. Você espera ~1 min
4. Acessa https://jonacir2023.github.io/JC/ (refresh página)
5. Testa a nova versão
6. Aprova / pede correção

## Verificação

Após configurar Pages:

```bash
curl -I https://jonacir2023.github.io/JC/
```

Se retornar `200 OK`, está online.

## Rollback

Se quiser voltar ao sistema anterior (V1 em main):

Ir a settings/pages → mudar branch para `main`

---

**Nota:** O V1 continua em https://jonacir2023.github.io/buildly/ (branch main)  
**V2 Premium fica em:** https://jonacir2023.github.io/JC/

Ambas ao mesmo tempo, zero conflito.
