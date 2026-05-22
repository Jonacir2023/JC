# Mapa de arquivos — JC Claude AI

> Atualizado automaticamente toda sexta às 18:00 (BRT).
> Última atualização: **21/05/2026, 23:23:45**

---

## Estrutura do projeto

| Arquivo / Pasta | Caminho completo | Tipo | Descrição |
|---|---|---|---|
| 📄 `README.md` | `/home/user/JC/README.md` | Arquivo | Documentação do plugin |
| 📄 `esbuild.config.mjs` | `/home/user/JC/esbuild.config.mjs` | Arquivo | Configuração do bundler esbuild |
| 📄 `main.js` | `/home/user/JC/main.js` | Arquivo | Build compilado — gerado por `npm run build` |
| 📄 `main.ts` | `/home/user/JC/main.ts` | Arquivo | **Código-fonte principal** do plugin (TypeScript) |
| 📄 `manifest.json` | `/home/user/JC/manifest.json` | Arquivo | Metadados do plugin (Obsidian) |
| 📄 `package-lock.json` | `/home/user/JC/package-lock.json` | Arquivo | Lock de versões das dependências |
| 📄 `package.json` | `/home/user/JC/package.json` | Arquivo | Dependências e scripts npm |
| 📁 `scripts/` | `/home/user/JC/scripts/` | Pasta | Pasta |
|   📄 `update-arquivos.js` | `/home/user/JC/scripts/update-arquivos.js` | Arquivo | Script que regera esta skill automaticamente |
| 📄 `styles.css` | `/home/user/JC/styles.css` | Arquivo | Estilos do painel lateral e modal |
| 📄 `tsconfig.json` | `/home/user/JC/tsconfig.json` | Arquivo | Configuração do compilador TypeScript |

---

## Arquivos essenciais do plugin Obsidian

Copie estes 3 arquivos para instalar o plugin:

```
manifest.json  →  /home/user/JC/manifest.json
main.js        →  /home/user/JC/main.js
styles.css     →  /home/user/JC/styles.css
```

Destino no vault:
```
<seu-vault>/.obsidian/plugins/jc-claude-ai/
```

---

## Comandos rápidos

```bash
# Build de produção
cd /home/user/JC && npm run build

# Build em modo watch (desenvolvimento)
cd /home/user/JC && npm run dev

# Ver status git
git -C /home/user/JC status

# Ver histórico de commits
git -C /home/user/JC log --oneline -10
```

---

## Skills disponíveis

| Comando | Arquivo | Descrição |
|---|---|---|
| `/arquivos` | `.claude/commands/arquivos.md` | Mapa de arquivos do projeto (esta skill) |

---

*Gerado por `scripts/update-arquivos.js` · GitHub Actions toda sexta 18:00 BRT*
