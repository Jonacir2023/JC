# Diário de Obras — v19 (App) + v5 (Apps Script)

**Status:** Pronto para implantação  
**Data:** julho de 2026  
**Responsável:** Cesbe Engenharia

---

## Arquivos

- **`index.html`** — app completo (PWA, ~6.160 linhas). Pode ser aberto diretamente no celular via URL pública ou instalado como app (ícone tela de início).
- **`DiarioObrasv5.gs`** — Google Apps Script backend (~480 linhas). Gerencia integração com Sheets, fotos no Drive, backups.

---

## Como implantar

### 1. App (index.html)

**Opção A: GitHub Pages (recomendado)**

1. Vá ao repositório `diario-obras` no GitHub
2. Upload de `index.html` para `/` (raiz)
3. Commit + Push
4. Aguarde ~1 min
5. Abra no celular: https://jonacir2023.github.io/diario-obras/
6. Adicione à tela de início (iOS: Safari → Compartilhar → Adicionar à Tela de Início; Android: Chrome → Menu → Instalar app)

**Opção B: Servidor local (testes)**

Não teste via `file://` local — requisições POST para Apps Script serão bloqueadas. Precisa de servidor HTTP ou URL pública.

### 2. Apps Script (DiarioObrasv5.gs)

1. Abra a planilha "JC - Gestão de Obras" em Google Sheets
2. Menu: **Extensões** → **Apps Script**
3. Selecione todo conteúdo do editor e **exclua**
4. Cole o conteúdo de `DiarioObrasv5.gs`
5. Menu: **Salvar**
6. Menu: **Implantar** → **Gerenciar implantações** → (ícone lápis, se existir) → **Editar** → **Versão:** "Nova versão" → **Implantar**
   - Na primeira vez, Google pedirá autorização ao Drive — **aceite**
7. Copie a URL gerada (algo como `https://script.google.com/macros/s/AKfycbwa_...`)
8. **No app (index.html)**, procure por `APPS_SCRIPT_URL_DIARIO` e confirme que a URL está correta

---

## Configuração do app

No `index.html`, procure por:

```javascript
const APPS_SCRIPT_URL_DIARIO = 'https://script.google.com/macros/s/AKfycbwa_TMG_RFnsFPE1-Q-gmYN9nPAv6QLy4A5N5B_z8VNK31N7R_-J_rPJtkErhJMLfMzeA/exec';
```

Substitua pela URL real do seu Apps Script (gerada no passo acima).

---

## Regras operacionais críticas

- ⚠️ **Nunca testar integrações** (Sheets/fotos/backup) em arquivo local — `file://` bloqueia POST. Só funciona em URL pública.
- ⚠️ **Atualizar o app:** upload novo de `index.html` → Commit → aguardar ~1 min → fechar app no celular → reabrir pelo ícone.
- ⚠️ **Atualizar Apps Script:** nunca esqueça do último passo (**Implantar** na aba de gerenciamento). Salvar sozinho não publica.
- ⚠️ **Nunca** limpar dados do Safari como solução de cache — apaga todo o localStorage (cadastros + histórico). Se não atualizar: fechar e reabrir, aguardar propagação.
- ✅ **App vazio?** Botão "☁️ Restaurar da Nuvem" em Cadastro restaura do backup mais recente. Nunca redigite dados.

---

## Colunas da aba Diário (Sheets)

| Coluna | Nome | Descrição |
|--------|------|-----------|
| A | Data | YYYY-MM-DD |
| B | Dia da Semana | seg/ter/qua/... |
| C | Obra | nome da obra |
| D | Empresa | Cesbe ou subcontratada |
| E | Cidade | local |
| F | Local da Obra | descrição do local onde trabalhos foram executados |
| G | Descrição do Local | complemento |
| H | Tempo / Clima | Limpo/Nublado/Chuva + mm + operabilidade |
| I | Jornada | turno |
| J | DSS — Horário | horário da palestra |
| K | DSS — Ministrado Por | quem ministrou |
| L | DSS — Tema | tema da palestra |
| M | Atividades do Dia | quantidades e descrições |
| N | Efetivo Total | total |
| O | Efetivo por Função | mão de obra própria + terceirizada |
| P | Colaboradores Presentes | lista |
| Q | Equipamentos Utilizados | com horímetros |
| R | Veículos Leves | lista |
| S | Veículos/Equip. Parados | com justificativa |
| T | Eventos de Segurança | ocorrências |
| U | Eventos de Meio Ambiente | ocorrências |
| V | Observações do Dia | texto livre |
| W | Apontador | responsável |
| X | Fotos | links do Drive |
| Y | RDO Nº | numeração sequencial |

---

## Referência de código

- Cópias originais também estão em `vault/Recursos/Anexos/` do repositório JC (para consulta sem depender do `diario-obras` repo)

---

## Próximos passos

- [ ] Reconstrução histórica de RDOs (dezembro 2025)
- [ ] Multi-obra (cadastrar/alternar)
- [ ] Dashboard de indicadores
- [ ] Boletim de Medição
- [ ] Notificações (Telegram)
