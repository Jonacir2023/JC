#!/usr/bin/env node
/**
 * find-skills — descoberta e instalação de skills do ecossistema Claude Code
 *
 * Fontes suportadas: GitHub (vercel-labs, anthropics, remotion, modelcontextprotocol)
 * Saída: lista de skills disponíveis com metadados e instrução de instalação
 */

const ECOSYSTEM_SOURCES = [
  { org: "vercel-labs", topic: "claude-skill", label: "Vercel Labs" },
  { org: "anthropics", topic: "claude-skill", label: "Anthropic" },
  { org: "remotion-dev", topic: "claude-skill", label: "Remotion" },
  { org: "modelcontextprotocol", topic: "claude-skill", label: "MCP" },
];

const GITHUB_API = "https://api.github.com";

async function searchSkills(query = "") {
  const results = [];

  for (const source of ECOSYSTEM_SOURCES) {
    const q = [
      `org:${source.org}`,
      `topic:claude-skill`,
      query ? query : "",
    ]
      .filter(Boolean)
      .join("+");

    const url = `${GITHUB_API}/search/repositories?q=${q}&per_page=10`;

    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "find-skills-claude-code",
        },
      });

      if (!res.ok) continue;

      const data = await res.json();

      for (const repo of data.items ?? []) {
        results.push({
          name: repo.name,
          org: source.label,
          description: repo.description ?? "(sem descrição)",
          url: repo.html_url,
          stars: repo.stargazers_count,
          installCmd: `curl -fsSL ${repo.html_url}/raw/main/install.sh | sh`,
        });
      }
    } catch {
      // fonte indisponível — ignora e continua
    }
  }

  return results;
}

function renderResults(skills, query) {
  if (skills.length === 0) {
    console.log(
      query
        ? `Nenhuma skill encontrada para "${query}" no ecossistema.`
        : "Nenhuma skill disponível no momento. Tente novamente mais tarde."
    );
    return;
  }

  console.log(
    `\nSkills encontradas${query ? ` para "${query}"` : ""}:\n`
  );

  const top = skills.slice(0, 5);
  top.forEach((s, i) => {
    console.log(`${i + 1}. ${s.name} [${s.org}] ★${s.stars}`);
    console.log(`   ${s.description}`);
    console.log(`   ${s.url}`);
    console.log(`   Instalar: ${s.installCmd}\n`);
  });

  if (skills.length > 5) {
    console.log(`... e mais ${skills.length - 5} resultado(s) disponíveis.`);
  }
}

async function main() {
  const query = process.argv.slice(2).join(" ").trim();

  console.log(
    query
      ? `Buscando skills para "${query}"...`
      : "Buscando skills disponíveis no ecossistema..."
  );

  const skills = await searchSkills(query);
  renderResults(skills, query);
}

main().catch((err) => {
  console.error("Erro ao buscar skills:", err.message);
  process.exit(1);
});
