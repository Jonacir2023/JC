# AI Brain Notebook Reference

**Notebook ID:** 6fecec8e-7f25-4179-b5ce-b636b2d371f7  
**Nome:** NotebookLM Memory  
**Data de Criação:** 2026-07-29  
**Descrição:** Memória semântica de longo prazo de todas as sessões

Este ID é usado pela skill Session Brain para adicionar resumos de sessão automaticamente.

**URL:** https://notebooklm.google.com/notebook/6fecec8e-7f25-4179-b5ce-b636b2d371f7

---

## Como Usar

Quando Session Brain executa, ela:
1. Cria um sumário da sessão em `/tmp/session-summary-YYYY-MM-DD.md`
2. Adiciona esse sumário como **fonte** ao notebook usando:
```bash
notebooklm source add /tmp/session-summary-YYYY-MM-DD.md \
  --notebook 4c3ad04c-c7dd-4d37-94e7-b4ae19ec8111
```

## Ativar Session Brain

Digitue ao final da sessão:
```
/navaigate-session-brain
```

Ou use as palavras-chave:
- `wrap up`
- `save this session`
- `end of session`

---

**Status:** ✅ Notebook criado e configurado  
**Próximo passo:** Session Brain enviará sumários para este notebook automaticamente
