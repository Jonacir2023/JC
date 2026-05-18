# find-skills

Descobre e instala skills do ecossistema Claude Code automaticamente.

## Quando usar

Invoque `/find-skills` quando:
- Precisar de uma capacidade especializada que não está disponível localmente
- Quiser explorar o que o ecossistema oferece para uma determinada tarefa
- O agente detectar que uma skill relevante pode existir mas não está instalada

## O que faz

1. **Detecta a necessidade** — analisa o contexto da tarefa atual
2. **Busca no ecossistema** — consulta repositórios conhecidos (Vercel, Anthropic, Remotion e outros)
3. **Apresenta opções** — lista as skills disponíveis com descrição e fonte
4. **Instala o que for relevante** — adiciona a skill localmente sem interromper o fluxo

## Uso

```
/find-skills [consulta opcional]
```

**Exemplos:**
- `/find-skills` — detecta automaticamente o que pode ser útil no contexto atual
- `/find-skills deploy vercel` — busca skills relacionadas a deploy na Vercel
- `/find-skills animação video` — busca skills de geração de vídeo/animação
- `/find-skills testes` — busca skills de automação de testes

## Fontes do ecossistema

| Organização | Foco |
|---|---|
| `vercel-labs` | Deploy, frontend, Next.js |
| `anthropics` | IA, Claude, prompting |
| `remotion` | Vídeo programático |
| `modelcontextprotocol` | Servidores MCP |

## Comportamento esperado do agente

Quando uma tarefa requer capacidade especializada não disponível, o agente deve:

1. Mencionar que a skill `find-skills` pode resolver
2. Executar `/find-skills <contexto>` automaticamente se o usuário concordar
3. Apresentar um menu de opções curto (máximo 5 itens)
4. Instalar apenas o que for confirmado pelo usuário
