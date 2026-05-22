# Mapa de arquivos do projeto JC Claude AI

Exibe os caminhos de todos os arquivos e pastas do projeto para referência rápida.

---

## Raiz do projeto

| Arquivo / Pasta | Caminho completo | Descrição |
|---|---|---|
| Raiz | `/home/user/JC` | Diretório raiz do projeto |
| `.gitignore` | `/home/user/JC/.gitignore` | Arquivos ignorados pelo git |
| `README.md` | `/home/user/JC/README.md` | Documentação do plugin |
| `manifest.json` | `/home/user/JC/manifest.json` | Metadados do plugin (Obsidian) |
| `main.ts` | `/home/user/JC/main.ts` | **Código-fonte principal** do plugin (TypeScript) |
| `main.js` | `/home/user/JC/main.js` | Build compilado (gerado por `npm run build`) |
| `styles.css` | `/home/user/JC/styles.css` | Estilos do painel e modal do plugin |
| `package.json` | `/home/user/JC/package.json` | Dependências e scripts npm |
| `package-lock.json` | `/home/user/JC/package-lock.json` | Lock de versões das dependências |
| `tsconfig.json` | `/home/user/JC/tsconfig.json` | Configuração do compilador TypeScript |
| `esbuild.config.mjs` | `/home/user/JC/esbuild.config.mjs` | Configuração do bundler esbuild |
| `node_modules/` | `/home/user/JC/node_modules/` | Dependências instaladas (não versionado) |

## Pasta .claude (skills / comandos)

| Arquivo | Caminho completo | Descrição |
|---|---|---|
| Comandos | `/home/user/JC/.claude/commands/` | Pasta com todas as skills do projeto |
| Esta skill | `/home/user/JC/.claude/commands/arquivos.md` | Mapa de arquivos (este arquivo) |

## Instalação no Obsidian

Os 3 arquivos necessários para instalar o plugin:

```
manifest.json  →  /home/user/JC/manifest.json
main.js        →  /home/user/JC/main.js
styles.css     →  /home/user/JC/styles.css
```

Destino no vault:
```
<seu-vault>/.obsidian/plugins/jc-claude-ai/
```

## Comandos úteis

```bash
# Build de produção
cd /home/user/JC && npm run build

# Build em modo watch (desenvolvimento)
cd /home/user/JC && npm run dev

# Ver status do git
git -C /home/user/JC status

# Ver log de commits
git -C /home/user/JC log --oneline
```

---

Use `$ARGUMENTS` para filtrar: `/arquivos main` mostra só linhas com "main".
