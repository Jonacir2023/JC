# 📊 Infográfico Interativo: 48 Prompts Claude para Produtividade

Uma ferramenta visual e didática que consolida **48 prompts prontos para usar** organizados em **11 categorias estratégicas**.

---

## 🎯 O Que É Este Projeto?

Um **infográfico HTML interativo** que reúne prompts para:
- 📱 **Marketing** - Campanhas, leads, estratégias
- ✍️ **Conteúdo** - Posts, reels, estratégias de 90 dias  
- 👥 **Audiência** - Personas, posicionamento, frustações
- 🎨 **Branding** - Identidade, bios, slogans
- 💰 **Monetização** - Fluxos de renda, produtos, serviços
- 🛒 **Produtos Digitais** - Ideias, cursos, preços
- ⚡ **Produtividade** - Fluxos, planejamento, batching
- 👔 **Clientes** - Atração, outreach, conversão
- 📈 **Crescimento** - Estratégias, oportunidades, experimentos
- 🎣 **Ganchos de Conteúdo** - Curiosidade, pausas de rolagem
- 💎 **Produtos Digitais (Estratégia)** - Planejamento de produtos

---

## 🚀 Como Começar

### Opção 1: Visualizar Online (Recomendado)

```bash
# Entre no diretório do projeto
cd /home/user/JC

# Execute o servidor local
bash run_infographic.sh

# Abra no navegador
# http://localhost:8000/infographic-claude-prompts.html
```

### Opção 2: Abrir Arquivo Direto

1. Abra `infographic-claude-prompts.html` em qualquer navegador
2. Aproveite o design responsivo em desktop e mobile

### Opção 3: Visualizar no Preview

- Leia `INFOGRAPHIC_PREVIEW.md` para uma versão em Markdown
- Copie os prompts diretamente desse arquivo

---

## 📋 Arquivos do Projeto

| Arquivo | Descrição |
|---------|-----------|
| **infographic-claude-prompts.html** | 🎨 Infográfico interativo principal (abra no navegador) |
| **INFOGRAPHIC_PREVIEW.md** | 📖 Versão Markdown de todos os prompts |
| **INFOGRAPHIC_IMAGE_GUIDE.md** | 🖼️ Guia completo para adicionar imagens |
| **run_infographic.sh** | 🚀 Script para executar servidor local |
| **README_INFOGRAPHIC.md** | 📚 Este arquivo |

---

## 💻 Uso Básico

### Passo 1: Escolha uma Categoria
Abra o infográfico e selecione a categoria que deseja usar:
- Marketing, Conteúdo, Audiência, Branding, etc.

### Passo 2: Copie o Prompt
Cada categoria tem 3 prompts prontos. Copie exatamente como está.

### Passo 3: Preencha os Placeholders
Substitua os valores entre colchetes:
- `[NICHO]` → Seu nicho específico
- `[AUDIÊNCIA]` → Seu público-alvo
- `[PRODUTO]` → Seu produto/serviço
- `[TÓPICO]` → Seu assunto

### Passo 4: Cole em Claude
Cole o prompt completo no chat do Claude (qualquer versão).

### Passo 5: Customize
Refine os resultados conforme necessário.

---

## 🎨 Personalizando o Infográfico

### Adicionar Imagens

Veja `INFOGRAPHIC_IMAGE_GUIDE.md` para:
- Como organizar pastas de imagens
- 3 métodos para inserir fotos
- Especificações técnicas (600x400px recomendado)
- Exemplo completo de código

Estrutura básica:
```
/images/
├── marketing/
├── conteudo/
├── ganchos/
├── monetizacao/
├── crescimento/
└── marca/
```

### Editar Cores
Abra `infographic-claude-prompts.html` e busque por:
- `#FF8C42` → Laranja principal
- `#FFB8A3` → Laranja claro
- `#D97D5C` → Terra

Substitua pelos códigos de cor desejados.

### Modificar Estrutura
O HTML está bem documentado com comentários:
- `<!-- Header Section -->` → Topo
- `<!-- Categories -->` → Cards de prompts
- `<!-- Gallery Section -->` → Galeria de imagens
- `<!-- Usage Guide -->` → Instruções

---

## 📱 Características

✅ **Design Responsivo**
- Funciona perfeitamente em desktop, tablet e mobile
- Grid automático que se adapta

✅ **Visual Atraente**
- Paleta de cores consistente (laranja, terra, branco)
- Cards interativos com hover effects
- Tipografia clara e legível

✅ **Fácil de Usar**
- Prompts já formatados
- Placeholders claramente identificados
- Instruções passo-a-passo

✅ **Extensível**
- Suporte ilimitado para imagens
- Fácil de adicionar novas categorias
- Customizável com CSS

✅ **Offline**
- Funciona sem internet
- Arquivo HTML puro
- Nenhuma dependência externa

---

## 🔍 Visualização Rápida

### Estrutura do Infográfico

```
┌─────────────────────────────────────┐
│  Header: Claude Prompts             │
├─────────────────────────────────────┤
│  Quick Stats: 48 Prompts | 11 Cats  │
├─────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌─────────┤
│ │ Marketing│ │ Content  │ │Audience │
│ │ 3 prompts│ │ 3 prompts│ │ 3 prompt│
│ └──────────┘ └──────────┘ └─────────┤
│ ... (11 categorias total)            │
├─────────────────────────────────────┤
│  Estratégia Integrada                │
├─────────────────────────────────────┤
│  Galeria de Exemplos Visuais         │
│  (6 slots para imagens)              │
├─────────────────────────────────────┤
│  Como Usar Este Guia                 │
│  Como Adicionar Fotos                │
└─────────────────────────────────────┘
```

---

## 💡 Dicas Pro

### Combinações Poderosas
- **Crescimento + Conteúdo**: Use Growth Prompts + Content Hooks
- **Monetização + Produtos**: Combine Monetisation + Digital Products
- **Branding + Audiência**: Use Audience Personas + Branding Prompts

### Para Criadores
1. Use Content Prompts para planejamento mensal
2. Use Content Hooks para gerar ideias virais
3. Use Audience Prompts para entender seu público

### Para Agências
1. Use Marketing Prompts para campanhas
2. Use Clients Prompts para prospecção
3. Use Growth Prompts para estratégia

### Para Produtores de Produtos
1. Use Digital Products Prompts para ideação
2. Use Monetisation Prompts para modelos de negócio
3. Use Growth Prompts para lançamento

---

## 🔧 Requisitos Técnicos

- **Browser**: Qualquer navegador moderno (Chrome, Firefox, Safari, Edge)
- **Sistema**: Windows, macOS, Linux
- **Internet**: Não obrigatório (funciona offline)
- **Espaço**: ~50KB do arquivo HTML

---

## 📈 Estatísticas

| Métrica | Valor |
|---------|-------|
| Total de Prompts | **48** |
| Categorias | **11** |
| Prompts por Categoria | **3** |
| Linhas de HTML | **600+** |
| Linhas de CSS | **300+** |
| Responsividade | **100%** |

---

## 🤝 Suporte e Contribuições

### Como Adicionar Novos Prompts
1. Edite `infographic-claude-prompts.html`
2. Localize a categoria desejada
3. Copie a estrutura de um card existente
4. Adicione seu novo prompt
5. Salve e visualize

### Como Reportar Issues
1. Verifique se o HTML abre corretamente
2. Teste em diferentes navegadores
3. Documente o problema com prints

---

## 📚 Documentação Relacionada

- 📖 **INFOGRAPHIC_PREVIEW.md** - Versão Markdown de todos os prompts
- 🖼️ **INFOGRAPHIC_IMAGE_GUIDE.md** - Guia completo de imagens
- 🚀 **run_infographic.sh** - Script de execução

---

## ✨ Exemplos de Uso

### Exemplo 1: Criar Campanha de Marketing
```
1. Abra a categoria "Marketing"
2. Copie "Prompt 1: Gere 10 ideias de ímã de leads"
3. Substitua [NICHO] por "fitness"
4. Cole em Claude e espere os resultados
5. Refine e implemente as 10 melhores ideias
```

### Exemplo 2: Planejar Conteúdo
```
1. Use "Content Prompts" → Prompt 1 para estratégia de 90 dias
2. Use "Content Hooks" → Prompt 1 para gerar 20 ganchos
3. Use "Productive Prompts" → Prompt 3 para batching
4. Combine os resultados em um plano executável
```

### Exemplo 3: Monetizar Sua Expertise
```
1. Use "Monetisation Prompts" para ideias gerais
2. Use "Digital Products" para estrutura específica
3. Use "Growth Prompts" para lançamento
4. Adicione imagens de exemplos na galeria
```

---

## 🎯 Próximas Ações

1. ✅ Abra `infographic-claude-prompts.html` em seu navegador
2. ✅ Explore as 11 categorias
3. ✅ Copie um prompt e teste com Claude
4. ✅ Customize com suas imagens
5. ✅ Compartilhe com seu time
6. ✅ Crie um sistema para organizar resultados

---

## 📞 Informações

- **Versão**: 1.0
- **Status**: Completo e pronto para usar
- **Última atualização**: 2026-05-17
- **Compatibilidade**: Todos os navegadores modernos

---

**Maximize sua produtividade com Claude!** 🚀  
**48 Prompts • 11 Categorias • ∞ Possibilidades**

Abra o arquivo HTML e comece agora!
