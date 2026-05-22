#!/usr/bin/env node
/**
 * Varre o projeto e regera .claude/commands/arquivos.md com a estrutura atual.
 * Executado automaticamente pelo GitHub Actions toda sexta às 18:00 (BRT).
 */

import { readdirSync, statSync, writeFileSync } from "fs";
import { join, relative } from "path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

const IGNORE = new Set([
  ".git",
  "node_modules",
  ".DS_Store",
  "*.js.map",
]);

const FILE_DESCRIPTIONS = {
  ".gitignore":          "Arquivos ignorados pelo git",
  "README.md":           "Documentação do plugin",
  "manifest.json":       "Metadados do plugin (Obsidian)",
  "main.ts":             "**Código-fonte principal** do plugin (TypeScript)",
  "main.js":             "Build compilado — gerado por `npm run build`",
  "styles.css":          "Estilos do painel lateral e modal",
  "package.json":        "Dependências e scripts npm",
  "package-lock.json":   "Lock de versões das dependências",
  "tsconfig.json":       "Configuração do compilador TypeScript",
  "esbuild.config.mjs":  "Configuração do bundler esbuild",
  "arquivos.md":         "Esta skill — mapa de arquivos do projeto",
  "update-arquivos.js":  "Script que regera esta skill automaticamente",
};

function shouldIgnore(name) {
  return IGNORE.has(name) || name.startsWith(".");
}

function scanDir(dir, depth = 0) {
  const entries = [];
  let items;
  try {
    items = readdirSync(dir).sort();
  } catch {
    return entries;
  }

  for (const name of items) {
    if (shouldIgnore(name)) continue;

    const absPath = join(dir, name);
    const relPath = relative(ROOT, absPath);
    let stat;
    try { stat = statSync(absPath); } catch { continue; }

    const isDir = stat.isDirectory();
    const desc = FILE_DESCRIPTIONS[name] ?? (isDir ? "Pasta" : "Arquivo");
    entries.push({ name, absPath, relPath, isDir, depth, desc });

    if (isDir && depth < 4) {
      entries.push(...scanDir(absPath, depth + 1));
    }
  }
  return entries;
}

function buildTable(entries) {
  const rows = [
    "| Arquivo / Pasta | Caminho completo | Tipo | Descrição |",
    "|---|---|---|---|",
  ];

  for (const e of entries) {
    const indent = "  ".repeat(e.depth);
    const icon = e.isDir ? "📁" : "📄";
    const display = `${indent}${icon} \`${e.name}${e.isDir ? "/" : ""}\``;
    const path = `\`${e.absPath}${e.isDir ? "/\`" : "\`"}`;
    const type = e.isDir ? "Pasta" : "Arquivo";
    rows.push(`| ${display} | ${path} | ${type} | ${e.desc} |`);
  }

  return rows.join("\n");
}

// ─── Gera o conteúdo ──────────────────────────────────────────────────────────

const entries = scanDir(ROOT);
const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

const content = `# Mapa de arquivos — JC Claude AI

> Atualizado automaticamente toda sexta às 18:00 (BRT).
> Última atualização: **${now}**

---

## Estrutura do projeto

${buildTable(entries)}

---

## Arquivos essenciais do plugin Obsidian

Copie estes 3 arquivos para instalar o plugin:

\`\`\`
manifest.json  →  ${ROOT}/manifest.json
main.js        →  ${ROOT}/main.js
styles.css     →  ${ROOT}/styles.css
\`\`\`

Destino no vault:
\`\`\`
<seu-vault>/.obsidian/plugins/jc-claude-ai/
\`\`\`

---

## Comandos rápidos

\`\`\`bash
# Build de produção
cd ${ROOT} && npm run build

# Build em modo watch (desenvolvimento)
cd ${ROOT} && npm run dev

# Ver status git
git -C ${ROOT} status

# Ver histórico de commits
git -C ${ROOT} log --oneline -10
\`\`\`

---

## Skills disponíveis

| Comando | Arquivo | Descrição |
|---|---|---|
| \`/arquivos\` | \`.claude/commands/arquivos.md\` | Mapa de arquivos do projeto (esta skill) |

---

*Gerado por \`scripts/update-arquivos.js\` · GitHub Actions toda sexta 18:00 BRT*
`;

const out = join(ROOT, ".claude/commands/arquivos.md");
writeFileSync(out, content, "utf8");
console.log(`✓ ${out} atualizado em ${now}`);
