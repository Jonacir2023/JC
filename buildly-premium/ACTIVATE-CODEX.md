# 🤖 Como Ativar o Codex no Buildly

**Guia para confirmar que Codex está efetivamente ativo e pronto para colaborar**

---

## ⚠️ GitHub Conectado ≠ Codex Ativo

| Status | O Que Significa | O Que Faz |
|--------|-----------------|-----------|
| ✅ GitHub Conectado | Repositório é acessível | Você consegue ler código |
| ❌ Codex Ativo | Codex está engajado no projeto | Codex lê, analisa, propõe, cria PRs |

**Conclusão:** GitHub conectado é pré-requisito, mas não é confirmação de que Codex está ativo.

---

## 🧪 Como Confirmar Que Codex Está Ativo

### Teste Prático

1. **Acesse o Codex** (seu ambiente ou conta)
2. **Conecte ao mesmo repositório:** Jonacir2023/JC
3. **Paste este prompt:**

```markdown
Leia a branch claude/serene-einstein-em23qs. 

Revise estes arquivos:
- CODEX-PARTNERSHIP-BRIEF.md
- README.md
- modules/brain/docs/INTEGRATION-GUIDE.md

Não altere código. Apresente um plano de PRs pequenos 
para o piloto de alerta antecipado de atraso, com:
- Objetivo de cada PR
- Critérios de aceite
- Testes esperados
- Possíveis riscos técnicos
```

### Sinais de Que Codex Está Ativo

✅ **Respostas esperadas:**
- Comenta no repositório (issue ou discussion)
- Cria uma pull request com plano de trabalho
- Propõe estrutura de PRs pequenas
- Identifica gaps na documentação
- Sugere ajustes na arquitetura

❌ **Sinais de que algo está errado:**
- Resposta genérica (sem ler o código)
- Pede para você descrever o projeto (deveria ler sozinho)
- Não menciona branch específica ou arquivos
- Oferece solução antes de análise

---

## 📋 Prompt Pronto Para Chamar Codex

**Use EXATAMENTE isto quando quiser engajar Codex:**

---

### **VERSÃO 1: Análise & Plano (Recomendado)**

```markdown
Você é o Codex, colaborador técnico do projeto Buildly.

Contexto: 
Buildly é um sistema operacional para infraestrutura pesada. 
O Core orquestra; o Brain recomenda inteligência via APIs.
Phases 1-3.8 estão completas. Vamos começar o piloto 
de alerta antecipado de atraso.

Tarefa:
1. Leia a branch claude/serene-einstein-em23qs
2. Revise: CODEX-PARTNERSHIP-BRIEF.md, README.md, 
   modules/brain/docs/INTEGRATION-GUIDE.md
3. Não altere código ainda
4. Responda:

   a) Quais são as 3 maiores lacunas técnicas para 
      implementar o piloto?
   
   b) Qual é o plano de PRs pequenas? (mínimo 5, máximo 8)
      Cada PR deve ter: título, objetivo, 1-2 funções, testes.
   
   c) Quais são os riscos técnicos e como mitigá-los?
   
   d) Qual é a sequência recomendada (dependências)?

Não execute nada. Só analise e proponha.
```

---

### **VERSÃO 2: Leitura Rápida (Se Pressa)**

```markdown
Leia a branch claude/serene-einstein-em23qs em ~15 minutos.

Foco:
- Arquitetura: Core vs Brain?
- APIs: O que Brain expõe ao Core?
- Integração: Como conectam?

Diga:
- O que você entendeu em 3 frases
- O que não ficou claro
- Próximo passo recomendado

Sem análise profunda, só leitura rápida.
```

---

### **VERSÃO 3: Pronto Para Codar (Depois da Aprovação)**

```markdown
Você está aprovado. Comece o piloto de alerta de atraso.

Plano aprovado:
[colar o plano de PRs daqui]

Tarefa AGORA:
1. Abra PR #1: [objetivo PR #1]
2. Código: máximo 300 LOC
3. Testes: 100% dos casos críticos
4. Descrição: link para spec

Referendar a issue #[número] e documentação de integração.

Quando terminar, avise. Claude revisa.
```

---

## 🔄 Sequência de Ativação Recomendada

### Fase 1: Você (HOJE)

```
☐ GitHub conectado
☐ LOC validados
☐ PILOT-DELAY-ALERT-SPEC.md criado
☐ CODEX-PARTNERSHIP-BRIEF.md atualizado
☐ 3 issues abertos no GitHub
```

### Fase 2: Claude

```
☐ Você chama Claude: "Revise a spec do piloto"
☐ Claude lê PILOT-DELAY-ALERT-SPEC.md
☐ Claude comenta em Issue #1 com análise
☐ Claude aprova ou pede ajustes
```

### Fase 3: Codex

```
☐ Você chama Codex com Versão 1 (Análise & Plano)
☐ Codex lê repositório
☐ Codex propõe plano de PRs (comentário em Issue #1)
☐ Você revisa plano
```

### Fase 4: Execução

```
☐ Você aprova plano
☐ Você chama Codex com Versão 3 (Pronto Para Codar)
☐ Codex abre PR #1
☐ Claude revisa PR #1
☐ Ciclo se repete para PR #2, #3, ...
```

---

## 📝 Sinais de Que Codex Entendeu o Projeto

**Frases que indicam leitura real:**

✅ "Vi a separação Core/Brain em INTEGRATION-GUIDE.md"
✅ "As 6 materialized views em analytics reduzem latência para <500ms"
✅ "O piloto precisa de dados de histórico de 12 meses mínimo"
✅ "Propus 5 PRs em ordem de dependência: query → lógica → testes → integração → doc"
✅ "O risco é false positives com histórico pequeno; mitigo com threshold"

❌ **Frases que indicam leitura superficial:**

❌ "Baseado no que você descreveu..."
❌ "Parece um projeto de IA interessante"
❌ "Vou consultar documentação genérica sobre..."
❌ "Preciso que você desenhe a arquitetura para mim"
❌ "Quantas pessoas estão na equipe?" (não diz respeito à análise)

---

## 🚨 Se Codex Não Responder Bem

### Problema 1: "Não consegui ler o repositório"

**Solução:**
```
Conectar Codex ao repositório Jonacir2023/JC
Verificar permissões
Tentar novamente
```

### Problema 2: "Resposta genérica, não específica"

**Solução:**
```
Fornecer mais contexto no prompt
Linkar arquivos específicos
Exemplo: "Veja lines 45-60 de modules/brain/apps/ml-engine/src/ml.service.ts"
```

### Problema 3: "Propôs 15 PRs enormes"

**Solução:**
```
Reforçar: "5-8 PRs pequenas, máximo 300 LOC cada"
Exemplar: "PR #1 deve ter APENAS endpoint esqueleto + teste stub"
```

---

## ✅ Quando Codex Está Efetivamente Ativo

**Você saberá com 100% de certeza quando:**

1. ✅ Codex lê arquivo específico e cita linha/função
2. ✅ Codex propõe PRs com dependências corretas
3. ✅ Codex cria issue ou comentário no GitHub (seu repositório)
4. ✅ Codex abre PR com código + testes (seu repositório)
5. ✅ Claude e Codex trocam comentários na mesma issue/PR

**Nenhum desses itens = Codex ainda não está ativo**

---

## 📞 Exemplo Prático de Ativação

### Você chama Codex:
```
"Leia a branch claude/serene-einstein-em23qs. 
Revise CODEX-PARTNERSHIP-BRIEF.md e INTEGRATION-GUIDE.md.
Que riscos você vê para o piloto de alerta de atraso?"
```

### Resposta fraca (Codex NÃO está ativo):
```
"Basicamente, você precisa de dados bons, testes sólidos, 
e um plano de deploy. Esses são riscos comuns em ML."
```

### Resposta forte (Codex ESTÁ ativo):
```
"Revisei INTEGRATION-GUIDE.md e vi que Brain tem latência < 800ms.
O risco principal é false positives se histórico < 5 eventos 
(linha 234 de ml.service.ts só usa EMA, sem validação).

Propus mitigar com threshold adaptativo:
- Se histórico < 10: não alerta
- Se histórico 10-30: confidence threshold = 0.8
- Se histórico > 30: confidence threshold = 0.75

Preciso de confirmar: dados estão em qual tabela?"
```

---

## 🎯 Próximas Ações (Quando Codex Está Ativo)

1. Codex lê repositório: ✅
2. Codex propõe plano: ✅
3. Você aprova plano: ✅
4. **→ Codex abre PR #1**
5. **→ Claude revisa PR #1**
6. **→ Você aprova ou pede ajustes**
7. **→ Ciclo se repete**

---

**Quando GitHub está conectado E você recebe resposta técnica do Codex = Live! 🚀**
