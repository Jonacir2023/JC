# JC Claude AI — Plugin para Obsidian

Plugin que integra o **Claude AI** da Anthropic ao Obsidian, permitindo gerar, resumir, melhorar e analisar suas notas diretamente no editor.

## Funcionalidades

- **Painel lateral de chat** — Converse com o Claude diretamente no Obsidian
- **Injetar nota atual** — Envie o conteúdo da nota ativa para o Claude com um clique
- **Inserir na nota** — Insira as respostas do Claude direto no editor
- **Menu de contexto** — Clique com botão direito em qualquer seleção para:
  - Resumir
  - Melhorar escrita
  - Explicar
  - Gerar ideias
- **Comandos de teclado** — Acesse todas as funções via paleta de comandos (`Ctrl+P`)
- **Configurações** — Escolha o modelo, temperatura e prompt do sistema

## Instalação Manual

1. Faça o download ou clone este repositório
2. Copie os arquivos `main.js`, `manifest.json` e `styles.css` para:
   ```
   <seu-vault>/.obsidian/plugins/jc-claude-ai/
   ```
3. No Obsidian: **Configurações → Plugins da comunidade → Ativar plugins não seguros**
4. Ative o plugin **JC Claude AI**
5. Vá em **Configurações → JC Claude AI** e insira sua chave de API da Anthropic

## Configuração

| Campo | Descrição |
|-------|-----------|
| Chave de API | Sua chave `sk-ant-...` da [Anthropic Console](https://console.anthropic.com) |
| Modelo | Haiku (rápido), Sonnet (recomendado), Opus (mais capaz) |
| Máximo de tokens | Limite de tamanho da resposta |
| Temperatura | 0 = preciso, 1 = criativo |
| Prompt do sistema | Instrução base enviada ao Claude |

## Build (para desenvolvimento)

```bash
npm install
npm run build   # produção
npm run dev     # modo watch
```

## Licença

MIT
