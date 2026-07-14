# Changelog — v19 → v20

## 🔧 Correção Crítica: Isolamento de Dados por Obra

### Problema
Quando você abria o app após uma atualização, dados antigos (obra Rio Tanque, 27 efetivo, etc) voltavam em vez de carregar dados novos da obra Suzano (6 efetivo). Isso acontecia porque:

1. **Chave de armazenamento global** — todas as obras usavam `diario_obras_v3_state` no localStorage
2. **Sem validação de obra** — ao carregar, o app não verificava se os dados eram da obra atual
3. **Sem cache-buster** — versão v3 do storage continuava sendo lida mesmo após update

### Solução (v20)

✅ **Chaves isoladas por obra**
```javascript
diario_obras_v4_state_suzano     // agora Suzano tem chave própria
diario_obras_v4_state_rio_tanque // Rio Tanque tem chave própria
diario_obras_v4_history_suzano
diario_obras_v4_history_rio_tanque
```

✅ **Migração automática** — primeira vez que abre v20, dados antigos são lidos de v3 uma única vez e migrados para chave da obra atual

✅ **Registro da obra atual** — localStorage `obra_atual` rastreia qual obra está sendo usada

### Como usar

1. **Atualize o app:** suba este `index.html` v20 para o repo `diario-obras` → push → espere ~1 min
2. **Celular:** feche a app completamente
3. **Reabra:** agora os dados estarão corretos e isolados por obra

### Se o problema persistir

1. No celular, abra o app e vá a **Cadastro → Backup em Arquivo** → **Exportar**
2. Verifique qual arquivo `.json` foi salvo — o nome deve indicar "Suzano"
3. Se os dados dentro tiverem obra "Rio Tanque", é porque o backup está antigo

**Solução manual:**
- Abra o arquivo .json baixado
- Procure por `"nome": "Rio Tanque"` e mude para `"nome": "Suzano"`
- Salve o arquivo
- No app, **Cadastro → Restaurar do Arquivo** → selecione o arquivo corrigido
- Salve o Diário do dia

### Detalhes técnicos

- `STORAGE_KEY_BASE = 'diario_obras_v4_state'` (v3 → v4 força rebuild)
- `getStorageKey()` e `getHistoryKey()` agora são funções dinâmicas
- `loadState()` e `loadHistory()` fazem migração automática na primeira execução
- `saveState()` e `saveHistory()` salvam com chave isolada + registro em `obra_atual`

### Próximas versões

Futura: multi-obra com interface de seleção (app v21)
