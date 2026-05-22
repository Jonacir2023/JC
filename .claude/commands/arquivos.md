# Mapa de arquivos — JC Claude AI

> Atualizado automaticamente toda sexta às 18:00 (BRT).
> Última atualização: **21/05/2026, 23:34:49**

---

## Vaults do Obsidian (iCloud)

Base iCloud: _iCloud não disponível neste ambiente_

### Profissional

> Vault não encontrado em `/root/Library/Mobile Documents/iCloud~md~obsidian/Documents/Profissional`

---

### Pessoal

> Vault não encontrado em `/root/Library/Mobile Documents/iCloud~md~obsidian/Documents/Pessoal`


---

## Instalar plugin no vault

Copie estes 3 arquivos para o vault desejado:

```
/home/user/JC/manifest.json
/home/user/JC/main.js
/home/user/JC/styles.css
```

Destino:
```
<caminho-do-vault>/.obsidian/plugins/jc-claude-ai/
```

---

## Projeto JC (repositório)

| Arquivo / Pasta | Caminho | Descrição |
|---|---|---|
| 📂 **Raiz do projeto** | `/home/user/JC` | — |
| 📁 `.claude/` | `/home/user/JC/.claude` |  |
|   📁 `commands/` | `/home/user/JC/.claude/commands` |  |
|     📄 `arquivos.md` | `/home/user/JC/.claude/commands/arquivos.md` | Esta skill — mapa de arquivos |
| 📄 `README.md` | `/home/user/JC/README.md` | Documentação do plugin |
| 📄 `esbuild.config.mjs` | `/home/user/JC/esbuild.config.mjs` | Configuração do bundler |
| 📄 `main.js` | `/home/user/JC/main.js` | Build compilado — gerado por `npm run build` |
| 📄 `main.ts` | `/home/user/JC/main.ts` | Código-fonte principal (TypeScript) |
| 📄 `manifest.json` | `/home/user/JC/manifest.json` | Metadados do plugin (Obsidian) |
| 📄 `package-lock.json` | `/home/user/JC/package-lock.json` | Lock de versões |
| 📄 `package.json` | `/home/user/JC/package.json` | Dependências e scripts npm |
| 📁 `scripts/` | `/home/user/JC/scripts` |  |
|   📄 `update-arquivos.js` | `/home/user/JC/scripts/update-arquivos.js` | Script que regera esta skill |
| 📄 `styles.css` | `/home/user/JC/styles.css` | Estilos do painel e modal |
| 📄 `tsconfig.json` | `/home/user/JC/tsconfig.json` | Configuração do TypeScript |

---

## Comandos rápidos

```bash
# Build de produção
cd /home/user/JC && npm run build

# Build watch (desenvolvimento)
cd /home/user/JC && npm run dev

# Atualizar esta skill manualmente
cd /home/user/JC && node scripts/update-arquivos.js

# Status git
git -C /home/user/JC status
```

---

## Skills disponíveis

| Comando | Descrição |
|---|---|
| `/arquivos` | Este mapa de arquivos e caminhos |

---

*Gerado por `scripts/update-arquivos.js` · GitHub Actions toda sexta 18:00 BRT*
