#!/usr/bin/env node
/**
 * Varre o projeto JC e os vaults do Obsidian no iCloud,
 * e regera .claude/commands/arquivos.md com todos os caminhos.
 *
 * Roda automaticamente toda sexta 18:00 BRT via GitHub Actions.
 * Para rodar manualmente na sua máquina: node scripts/update-arquivos.js
 */

import { readdirSync, statSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir, platform } from "os";

// ─── Raiz do projeto ──────────────────────────────────────────────────────────

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

// ─── Localizar vaults do Obsidian no iCloud (Mac) ────────────────────────────

const ICLOUD_OBSIDIAN = join(
  homedir(),
  "Library/Mobile Documents/iCloud~md~obsidian/Documents"
);

const IGNORE_NAMES = new Set([
  ".git", "node_modules", ".DS_Store", ".trash", ".obsidian",
]);

const IGNORE_EXT = new Set([".js.map"]);

function shouldIgnore(name) {
  return IGNORE_NAMES.has(name) || (name.startsWith(".") && name !== ".claude");
}

// ─── Varredura de diretório ───────────────────────────────────────────────────

function scanDir(dir, depth = 0, maxDepth = 5) {
  const entries = [];
  if (depth > maxDepth) return entries;

  let items;
  try { items = readdirSync(dir).sort(); }
  catch { return entries; }

  for (const name of items) {
    if (shouldIgnore(name)) continue;

    const absPath = join(dir, name);
    let stat;
    try { stat = statSync(absPath); } catch { continue; }

    const isDir = stat.isDirectory();
    entries.push({ name, absPath, isDir, depth });

    if (isDir) {
      entries.push(...scanDir(absPath, depth + 1, maxDepth));
    }
  }
  return entries;
}

// ─── Renderizar seção de vault ────────────────────────────────────────────────

function renderVault(label, vaultPath) {
  if (!existsSync(vaultPath)) {
    return `### ${label}\n\n> Vault não encontrado em \`${vaultPath}\`\n`;
  }

  const entries = scanDir(vaultPath, 0, 4);

  const rows = [
    `| Pasta / Arquivo | Caminho completo |`,
    `|---|---|`,
    `| 📂 **${label}** (raiz) | \`${vaultPath}\` |`,
  ];

  for (const e of entries) {
    const indent = "  ".repeat(e.depth);
    const icon = e.isDir ? "📁" : "📄";
    rows.push(`| ${indent}${icon} \`${e.name}${e.isDir ? "/" : ""}\` | \`${e.absPath}\` |`);
  }

  return `### ${label}\n\n${rows.join("\n")}\n`;
}

// ─── Detectar vaults automaticamente ─────────────────────────────────────────

function detectVaults() {
  const vaults = [];

  if (platform() === "darwin" && existsSync(ICLOUD_OBSIDIAN)) {
    let items;
    try { items = readdirSync(ICLOUD_OBSIDIAN).sort(); } catch { items = []; }

    for (const name of items) {
      const absPath = join(ICLOUD_OBSIDIAN, name);
      try {
        if (statSync(absPath).isDirectory()) {
          vaults.push({ name, path: absPath });
        }
      } catch { /* skip */ }
    }
  }

  // Fallback: nomes convencionais caso não detecte automaticamente
  if (vaults.length === 0) {
    vaults.push(
      { name: "Profissional", path: join(ICLOUD_OBSIDIAN, "Profissional") },
      { name: "Pessoal",      path: join(ICLOUD_OBSIDIAN, "Pessoal") }
    );
  }

  return vaults;
}

// ─── Projeto JC (repo) ────────────────────────────────────────────────────────

const PROJECT_DESCRIPTIONS = {
  ".gitignore":         "Arquivos ignorados pelo git",
  "README.md":          "Documentação do plugin",
  "manifest.json":      "Metadados do plugin (Obsidian)",
  "main.ts":            "Código-fonte principal (TypeScript)",
  "main.js":            "Build compilado — gerado por `npm run build`",
  "styles.css":         "Estilos do painel e modal",
  "package.json":       "Dependências e scripts npm",
  "package-lock.json":  "Lock de versões",
  "tsconfig.json":      "Configuração do TypeScript",
  "esbuild.config.mjs": "Configuração do bundler",
  "arquivos.md":        "Esta skill — mapa de arquivos",
  "update-arquivos.js": "Script que regera esta skill",
};

function renderProject() {
  const entries = scanDir(ROOT, 0, 3);
  const rows = [
    "| Arquivo / Pasta | Caminho | Descrição |",
    "|---|---|---|",
    `| 📂 **Raiz do projeto** | \`${ROOT}\` | — |`,
  ];

  for (const e of entries) {
    const indent = "  ".repeat(e.depth);
    const icon = e.isDir ? "📁" : "📄";
    const desc = PROJECT_DESCRIPTIONS[e.name] ?? "";
    rows.push(`| ${indent}${icon} \`${e.name}${e.isDir ? "/" : ""}\` | \`${e.absPath}\` | ${desc} |`);
  }

  return rows.join("\n");
}

// ─── Gerar arquivo final ──────────────────────────────────────────────────────

const now  = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
const vaults = detectVaults();
const vaultSections = vaults
  .map(v => renderVault(v.name, v.path))
  .join("\n---\n\n");

const icloudBase = platform() === "darwin"
  ? `\`${ICLOUD_OBSIDIAN}\``
  : "_iCloud não disponível neste ambiente_";

const content = `# Mapa de arquivos — JC Claude AI

> Atualizado automaticamente toda sexta às 18:00 (BRT).
> Última atualização: **${now}**

---

## Vaults do Obsidian (iCloud)

Base iCloud: ${icloudBase}

${vaultSections}

---

## Instalar plugin no vault

Copie estes 3 arquivos para o vault desejado:

\`\`\`
${ROOT}/manifest.json
${ROOT}/main.js
${ROOT}/styles.css
\`\`\`

Destino:
\`\`\`
<caminho-do-vault>/.obsidian/plugins/jc-claude-ai/
\`\`\`

---

## Projeto JC (repositório)

${renderProject()}

---

## Comandos rápidos

\`\`\`bash
# Build de produção
cd ${ROOT} && npm run build

# Build watch (desenvolvimento)
cd ${ROOT} && npm run dev

# Atualizar esta skill manualmente
cd ${ROOT} && node scripts/update-arquivos.js

# Status git
git -C ${ROOT} status
\`\`\`

---

## Skills disponíveis

| Comando | Descrição |
|---|---|
| \`/arquivos\` | Este mapa de arquivos e caminhos |

---

*Gerado por \`scripts/update-arquivos.js\` · GitHub Actions toda sexta 18:00 BRT*
`;

const out = join(ROOT, ".claude/commands/arquivos.md");
writeFileSync(out, content, "utf8");
console.log(`✓ Skill atualizada: ${out}`);
console.log(`✓ Vaults encontrados: ${vaults.map(v => v.name).join(", ")}`);
console.log(`✓ Data/hora: ${now}`);
