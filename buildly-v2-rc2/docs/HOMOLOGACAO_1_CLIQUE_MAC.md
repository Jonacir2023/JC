# Homologação do BUILDLy em 1 clique no Mac

## Arquivo principal

```text
HOMOLOGAR_BUILDLY.command
```

No Finder:

1. abra a pasta `buildly-premium-v2`;
2. dê duplo clique em `HOMOLOGAR_BUILDLY.command`;
3. o Terminal abrirá e verificará o ambiente;
4. se os pré-requisitos estiverem presentes, a homologação seguirá automaticamente;
5. ao final, consulte `relatorios-homologacao/`.

## O que ele executa

- valida macOS, Python, curl, Supabase CLI e runtime Docker API;
- roda os testes estáticos da RC2;
- prepara as 16 migrations no Supabase local;
- executa `supabase start`;
- reconstrói o banco local com `supabase db reset`;
- cria somente usuários artificiais `@teste.local`;
- executa pgTAP com `supabase test db`;
- executa lint do banco;
- tenta executar a validação pós-homologação via `psql` quando disponível;
- gera log e relatório Markdown PASS/FAIL.

## Segurança

O launcher não contém `supabase link`, `db push` ou o project ref do P3.
Ele não deve acessar a produção.

O script também não instala Docker/Supabase CLI automaticamente. Se algum pré-requisito faltar, ele para e informa o bloqueio.

## Gatekeeper do macOS

Se o macOS bloquear um arquivo `.command` baixado da internet, abra **Ajustes do Sistema > Privacidade e Segurança** e autorize apenas se você reconhece este pacote. Também é possível abrir o Terminal na pasta e executar:

```bash
./HOMOLOGAR_BUILDLY.command
```

## Resultado esperado

Somente considerar a RC2 homologada quando o relatório final indicar:

```text
Resultado: PASS
Produção acessada: NÃO
```
