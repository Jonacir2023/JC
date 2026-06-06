# 🎯 Como Abrir Este Vault no Obsidian

## Pré-requisitos

- [ ] Obsidian instalado ([obsidian.md](https://obsidian.md))
- [ ] Este repositório clonado localmente

## Passos para Setup

### 1️⃣ Instale Obsidian
Baixe em: https://obsidian.md

### 2️⃣ Abra Este Repositório como Vault

1. Abra Obsidian
2. Clique em **"Open folder as vault"**
3. Navegue para `/path/to/JC` (sua cópia local deste repo)
4. Selecione a pasta `JC` e clique em "Open"

### 3️⃣ Configure as Recomendações de Plugin

**Plugins recomendados** (Community Plugins):
- **Backlinks** (built-in) — já vem ativado
- **Outgoing Links** (built-in) — mostra links para outras notas
- **Graph View** (built-in) — visualiza relacionamentos

Para ativar plugins:
1. Settings → Community Plugins
2. Desative "Safe mode" se necessário
3. Browse → procure por `Backlinks`
4. Instale o desejado e ative

### 4️⃣ Configure Tema (Opcional)

**Recomendação**: Usar tema escuro para melhor leitura
1. Settings → Appearance
2. Theme → Obsidian (dark) ou seu preferido

### 5️⃣ Abra o Home

Quando abrir o vault pela primeira vez:
- Clique em `00-Home/README.md`
- Use o **Graph View** (Ctrl+G) para explorar conexões

## 🎨 Layout Recomendado

```
┌─────────────────────────────────────┐
│   File Explorer    │  Editor        │
│   (Left Sidebar)   │ 00-Home/README │
├─────────────────────┤                │
│ 📁 00-Home          │                │
│ 📁 01-Project...    │                │
│ 📁 02-Arch...       │                │
│ 📁 03-Comp...       │                │
│ 📁 04-Dec...        │  Backlinks ▼   │
│                     │                │
└─────────────────────────────────────┘
```

## ⚡ Atalhos Úteis

| Atalho | Função |
|--------|--------|
| `Ctrl+K` | Criar novo link |
| `Ctrl+O` | Quick open (busca rápida) |
| `Ctrl+G` | Graph view |
| `Ctrl+,` | Settings |
| `Ctrl+P` | Command palette |

## 📝 Fluxo Recomendado

1. **Comece em** `[[00-Home/README|Home]]` — veja visão geral
2. **Explore** com Graph View para entender relacionamentos
3. **Leia** `[[04-Decisions/README|Decisions]]` para contexto arquitetural
4. **Consulte** `[[07-Tasks/README|Tasks]]` para saber o que fazer
5. **Documente** suas descobertas em `[[08-Notes/README|Notes]]`

## 🔄 Sincronização com Git

O vault está versionado em Git:

```bash
# Depois de fazer mudanças locais no vault
cd /path/to/JC
git add .
git commit -m "docs: update vault with new insights"
git push origin claude/vibrant-ptolemy-F3b5L
```

## ✅ Checklist de Primeiro Acesso

- [ ] Obsidian instalado
- [ ] Vault aberto
- [ ] Leu 00-Home/README
- [ ] Explorou graph view
- [ ] Consultou 04-Decisions
- [ ] Viu 07-Tasks

---

**Dúvidas?** Leia o CLAUDE.md para mais contexto sobre a estrutura.

**Pronto para começar?** Clique em `[[00-Home/README|JC Home]]` 🚀
