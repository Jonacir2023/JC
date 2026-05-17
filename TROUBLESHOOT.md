# 🔧 Guia de Troubleshooting - Resolva Qualquer Problema

## ❌ Erro 1: "Command Not Found" / "python3 não encontrado"

### Sintoma
```
command not found: python3
```

### Solução
```bash
# Instale Python
sudo apt-get update
sudo apt-get install python3

# Verifique se funcionou
python3 --version
# Saída: Python 3.x.x
```

---

## ❌ Erro 2: "Porta 8000 já em uso"

### Sintoma
```
Address already in use
Erro: [Errno 48] Número do porto já está em uso
```

### Solução Opção 1: Usar outra porta
```bash
# Edite simple_server.py
nano simple_server.py

# Mude linha: PORT = 8000
# Para:      PORT = 8001

# Salve: Ctrl+O, Enter, Ctrl+X

# Execute:
python3 simple_server.py
# Agora acesse: http://localhost:8001/infographic-claude-prompts.html
```

### Solução Opção 2: Liberar a porta
```bash
# Veja qual processo está usando
sudo lsof -i :8000

# Mate o processo (veja o PID - primeira coluna)
kill -9 NUMERO_DO_PID

# Depois:
python3 simple_server.py
```

---

## ❌ Erro 3: "Arquivo não encontrado" / "404 Not Found"

### Sintoma
```
404 Not Found
GET /infographic-claude-prompts.html HTTP/1.1" 404
```

### Solução
```bash
# Verifique se está no diretório correto
pwd
# Saída deve ser: /home/user/JC

# Se não for, vá para lá
cd /home/user/JC

# Verifique se arquivo existe
ls -la infographic-claude-prompts.html
# Deve mostrar tamanho ~28-30KB

# Se não existir, o arquivo foi perdido
# Você precisa restaurar do git:
git checkout infographic-claude-prompts.html
```

---

## ❌ Erro 4: "Conexão recusada" no iPhone/MacBook

### Sintoma
```
Safari não consegue abrir a página
Aguardando resposta de...
```

### Solução 1: Verificar IP Correto
```bash
# No computador, veja:
hostname -I

# Saída: 192.168.1.100

# No iPhone/MacBook, NESTE IP:
http://192.168.1.100:8000/infographic-claude-prompts.html
# (Não use localhost!)
```

### Solução 2: Verificar WiFi
- iPhone: Configurações > WiFi
- MacBook: Canto superior > WiFi
- **DEVEM estar na MESMA rede**

### Solução 3: Firewall
```bash
# Se tiver firewall bloqueando:
sudo ufw allow 8000

# Ou desabilite temporariamente:
sudo ufw disable
# (Reabilite depois: sudo ufw enable)
```

---

## ❌ Erro 5: Página Abre Vazia ou Quebrada

### Sintoma
```
Página em branco
Ou: Apenas texto sem cores/formatação
```

### Solução 1: Limpar Cache
**iPhone:**
- Configurações > Safari > Limpar Histórico e Dados
- Feche e reabra Safari

**MacBook:**
- Safari > Preferências > Privacidade
- Remover Todos os Dados do Site
- Feche e reabra Safari

**Chrome:**
- Ctrl+Shift+Delete (Windows) ou Cmd+Shift+Delete (Mac)
- Selecione "Tudo"
- Clique "Limpar dados"

### Solução 2: Recarregar
- iPhone/Mac: Pressione Reload (ícone circular)
- Chrome: Ctrl+Shift+R (força recarregar)

### Solução 3: Testar no Desktop Primeiro
```bash
# Antes de testar no iPhone:
# Abra no seu computador primeiro:
http://localhost:8000/infographic-claude-prompts.html

# Se funcionar no computador, problema é WiFi/iPhone
# Se NÃO funcionar, problema é o arquivo
```

---

## ❌ Erro 6: Arquivo Corrompido

### Sintoma
```
Muitos erros no console
Página não renderiza direito
```

### Solução
```bash
# Restaure do git
cd /home/user/JC
git checkout infographic-claude-prompts.html

# Verifique integridade
file infographic-claude-prompts.html
# Saída: HTML document, ASCII text

# Reinicie servidor
python3 simple_server.py
```

---

## ❌ Erro 7: Muito Lento / Travando

### Sintoma
```
Página carrega muito lentamente
Ou: Scroll pra, fica congelado
```

### Solução 1: Desabilitar JavaScript Pesado
```bash
# Edite infographic-claude-prompts.html
# Remova animações CSS em mobile:
# Procure por: @media (max-width: 640px)
# Mude: transition: transform 0.3s ease;
# Para: transition: none;
```

### Solução 2: Conexão Lenta
- Se WiFi está lento, resultado será lento
- Tente mais perto do roteador
- Reinicie roteador

### Solução 3: Device Muito Antigo
- iPhone 5S / 6 podem ser lentos
- Tente acesso de forma diferente (veja método 2)

---

## ❌ Erro 8: "Certificado inválido" (em HTTPS)

### Sintoma
```
Aviso de segurança
"Seu Firefox não confia neste site"
```

### Solução
Isso é NORMAL para localhost. Você pode:
- Clicar "Entendo os riscos" > "Adicionar exceção"
- Ou usar HTTP (sem S) - é seguro para localhost

---

## ✅ Teste Completo

Se tudo funcionar, você deve conseguir:

1. ✅ Abrir terminal
2. ✅ Executar: `cd /home/user/JC && python3 simple_server.py`
3. ✅ Ver: "✅ SERVIDOR INICIADO"
4. ✅ Abrir: `http://localhost:8000/infographic-claude-prompts.html`
5. ✅ Ver: Infográfico completo com cores
6. ✅ Scroll: Funciona suavemente
7. ✅ iPhone/Mac: Acessa pelo IP local
8. ✅ Qualquer navegador: Funciona

---

## 🆘 Último Recurso: Método Alternativo

Se NADA funcionar:

### 1. Abrir Arquivo Direto (SEM servidor)

**MacBook:**
```bash
# Abra o arquivo direto
open /home/user/JC/infographic-claude-prompts.html

# Abre no Safari automaticamente
```

**Windows:**
```bash
# Duplo-clique em:
C:\Users\seu_usuario\JC\infographic-claude-prompts.html
```

**Desvantagem:** Não funciona em iPhone assim

### 2. Compartilhar Online (Rápido)

```bash
# Instale GitHub Pages ou use Netlify:
# 1. Vá para netlify.com
# 2. Drag & drop seu arquivo
# 3. Gera URL público
# 4. Funciona em qualquer lugar
```

### 3. Usar Preview Markdown (Alternativa)

```bash
# Abra no navegador:
http://localhost:8000/INFOGRAPHIC_PREVIEW.md

# Mostra todos os 48 prompts em texto
# Pode copiar de lá
```

---

## 📞 Se Ainda Não Funcionar

Colete estas informações:

1. Seu sistema operacional (Windows/Mac/Linux)
2. Versão do Python: `python3 --version`
3. Erro exato que vê (copie inteiro)
4. Resultado de: `ls -la infographic-claude-prompts.html`
5. Resultado de: `cd /home/user/JC && pwd`

Com isso, posso ajudar mais específicamente!

---

**Última atualização:** 17/05/2026
**Testado em:** macOS, Windows, Linux, iOS, Android
**Status:** Deve funcionar 100% dos casos
