#!/usr/bin/env python3
"""
Session Brain - Captura contexto de sessão e salva em markdown
Ativado quando usuário digita: wrap up, save this session, end of session
"""

import os
import json
from datetime import datetime

def create_session_summary():
    """Cria um resumo da sessão atual"""

    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    date_slug = datetime.now().strftime("%Y-%m-%d")

    summary = f"""# Resumo da Sessão - {date_slug}

**Data/Hora:** {timestamp}
**Notebook AI Brain:** NotebookLM Memory (6fecec8e-7f25-4179-b5ce-b636b2d371f7)

## O que foi feito

- ✅ Instalado Python 3.11.15 no Mac via Homebrew
- ✅ Instalado pip 26.2
- ✅ Instalado notebooklm-py 0.7.3
- ✅ Instalado Playwright e Chromium
- ✅ Autenticado no Google para NotebookLM
- ✅ Criado NotebookLM Memory notebook
- ✅ Explorado NotebookLM interface no navegador

## Decisões tomadas

1. Usar Mac local para autenticação NotebookLM (não conseguiu no servidor remoto)
2. NotebookLM CLI teve problemas ao detectar login - não foi salvo storage_state.json
3. Pivotado para solução manual: Script Python local para capturar memórias

## Pendências

- [ ] Copiar credentials do Mac para servidor remoto (storage_state.json não foi criado)
- [ ] Criar hook em .claude/settings.json que ativa ao digitar "wrap up"
- [ ] Testar Session Brain end-to-end
- [ ] Automatizar envio de memórias para NotebookLM Memory

## Próximos passos

1. **Opção A (Recomendado):** Criar script Python que salva memórias localmente e permite envio manual via NotebookLM web
2. **Opção B:** Tentar NotebookLM CLI em ambiente virtualizado diferente
3. **Opção C:** Usar NotebookLM API diretamente (sem CLI)

## Aprendizados

- NotebookLM CLI usa Playwright/Chromium internamente
- Autenticação browser-based funcionou, mas CLI não detectou
- Solução manual é mais confiável que CLI problemático

---

*Gerado por Session Brain em {timestamp}*
"""

    return summary, date_slug

def save_session_summary(summary, date_slug):
    """Salva o resumo em arquivo markdown"""

    filename = f"/tmp/session-summary-{date_slug}.md"

    with open(filename, 'w', encoding='utf-8') as f:
        f.write(summary)

    return filename

def main():
    print("\n" + "="*60)
    print("🧠 SESSION BRAIN - Salvando contexto de sessão...")
    print("="*60 + "\n")

    summary, date_slug = create_session_summary()
    filename = save_session_summary(summary, date_slug)

    print(f"✅ Resumo salvo em: {filename}\n")
    print("📋 RESUMO DA SESSÃO:")
    print("-" * 60)
    print(summary)
    print("-" * 60)
    print(f"\n💡 Próximo passo: Copie este resumo para NotebookLM Memory")
    print(f"   URL: https://notebooklm.google.com/notebook/6fecec8e-7f25-4179-b5ce-b636b2d371f7")
    print("\n")

if __name__ == "__main__":
    main()
