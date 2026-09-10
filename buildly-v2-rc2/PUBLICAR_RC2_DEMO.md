# Publicar RC2 DEMO Release — 1 Comando

**Objetivo:** Criar GitHub Release v2.2.0-rc2-demo com arquivo standalone e release notes

**Pré-requisito:** GitHub Personal Access Token (PAT)

---

## 🔑 Etapa 1: Obter GitHub Token

1. Ir para https://github.com/settings/tokens/new
2. Nome: `RC2 Release Publisher`
3. Permissões: ✅ `public_repo` (apenas para repos públicos)
4. Gerar token
5. Copiar token (aparece 1 vez)

---

## 🚀 Etapa 2: Publicar Release

### Opção A — Mac/Linux (recomendado)

```bash
export GITHUB_TOKEN=ghp_seu_token_aqui
./scripts/publicar_rc2_release.sh
```

### Opção B — Windows PowerShell

```powershell
$env:GITHUB_TOKEN = "ghp_seu_token_aqui"
& ".\scripts\publicar_rc2_release.sh"
```

### Resultado esperado

```
🚀 Publicando RC2 DEMO Release...
   Repo: Jonacir2023/JC
   Tag: v2.2.0-rc2-demo

✓ Criando tag local: v2.2.0-rc2-demo
✓ Publicando release no GitHub...
✓ Release criada (ID: 123456789)
✓ Fazendo upload de BUILDLy_Premium_V2_STANDALONE.html...
✓ Upload concluído

✅ RC2 DEMO Release publicada com sucesso!
   URL: https://github.com/Jonacir2023/JC/releases/tag/v2.2.0-rc2-demo
```

---

## 📋 O Que Será Publicado

**Release:** v2.2.0-rc2-demo  
**Title:** BUILDLy Premium V2.2.0 RC2 DEMO  
**Branch:** claude/wonderful-brown-1g6oil  
**Pre-release:** Sim (marcado como "Demonstração")

**Conteúdo:**
- Release notes: `ENTREGA_BUILDLY_PREMIUM_V2_2_RC2.md` (completo)
- Arquivo: `BUILDLy_Premium_V2_STANDALONE.html` (177 KB, offline)

---

## 🎬 Após Publicação

1. ✅ Release aparece em https://github.com/Jonacir2023/JC/releases
2. ✅ Tag é criada e visível
3. ✅ Arquivo HTML pode ser baixado
4. ✅ Release notes exibidas

### Compartilhar Link

```
https://github.com/Jonacir2023/JC/releases/tag/v2.2.0-rc2-demo
```

Enviar para stakeholders com aviso:

> **RC2 DEMO** — Demonstração funcional, não homologada em banco real.
> Abra `BUILDLy_Premium_V2_STANDALONE.html` no navegador.
> Zero dependências de servidor.

---

## 🛠️ Troubleshooting

**"GITHUB_TOKEN não configurado"**
```bash
export GITHUB_TOKEN=ghp_seu_token_aqui
```

**"Token inválido" (401)**
- Verificar token em https://github.com/settings/tokens
- Regenerar se necessário

**"Permission denied" (403)**
- Token precisa de escopo `public_repo`
- Verificar https://github.com/settings/tokens

**"Arquivo não encontrado"**
- Executar script da raiz do repositório
- Verificar: `ls -la BUILDLy_Premium_V2_STANDALONE.html`

---

## 🔒 Segurança do Token

⚠️ **Importante:**
- Token aparece em command history
- Usar apenas em máquina pessoal/confiável
- Deletar token após publicar se quiser
- Nunca commitar token em código

Se acidentalmente exposto:
1. Ir para https://github.com/settings/tokens
2. Delete the token immediately
3. GitHub invalida automaticamente

---

## ✅ Checklist Pré-Publicação

- [ ] GitHub token obtido e testado
- [ ] Você está no diretório raiz do repo
- [ ] Arquivo `BUILDLy_Premium_V2_STANDALONE.html` existe
- [ ] Arquivo `ENTREGA_BUILDLY_PREMIUM_V2_2_RC2.md` existe
- [ ] Branch local é `claude/wonderful-brown-1g6oil`

---

## 📞 Depois da Publicação

1. **Divulgação:** Compartilhar link com stakeholders
2. **Feedback:** Coletar comentários estruturados
3. **Próxima fase:** Coordenar homologação local quando Docker/Supabase CLI disponível

---

**Script executável:** `scripts/publicar_rc2_release.sh`  
**Versão:** 1.0  
**Data:** 10/09/2026
