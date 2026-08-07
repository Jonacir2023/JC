# Endpoint que falta no Apps Script: foto em base64

## Por que é necessário

As fotos aparecem na tela do relatório, mas saem em branco no PDF do botão
**Compartilhar**. O motivo é que esse PDF é montado pelo html2canvas, que precisa
ler os pixels da imagem — e o navegador só permite isso se o servidor da imagem
enviar o cabeçalho `Access-Control-Allow-Origin`.

O Google Drive **não envia esse cabeçalho** em nenhuma das URLs de miniatura
(`drive.google.com/thumbnail` nem `lh3.googleusercontent.com`). Ambas foram
tentadas e falharam.

O Apps Script resolve porque:
- ele lê o arquivo **direto no Drive**, sem passar por CORS;
- as respostas dele **já são aceitas** pelo app (é assim que o diário é salvo e
  a foto é enviada hoje).

## O que fazer

Abra o Apps Script do Diário de Obras e acrescente o bloco abaixo dentro da
função `doGet`, junto dos outros tratamentos de `path`. Depois **reimplante**
(Implantar → Gerenciar implantações → editar → Nova versão).

```javascript
// Devolve a foto do Drive em base64, para o app conseguir embuti-la no PDF.
// Chamada: ?path=foto&action=base64&fileId=XXXX
if (path === 'foto' && action === 'base64') {
  try {
    var arquivo = DriveApp.getFileById(e.parameter.fileId);
    var blob = arquivo.getBlob();

    // Reduz o custo de transporte: acima de ~4 MB o base64 fica grande demais
    // para o app montar o PDF com folga.
    var bytes = blob.getBytes();
    if (bytes.length > 4 * 1024 * 1024) {
      var menor = arquivo.getThumbnail();      // miniatura gerada pelo Drive
      if (menor) { blob = menor; bytes = blob.getBytes(); }
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        ok: true,
        mimeType: blob.getContentType(),
        dataUri: 'data:' + blob.getContentType() + ';base64,' + Utilities.base64Encode(bytes)
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## Como saber se funcionou

Cole no navegador, trocando `SEU_FILE_ID` pelo id de uma foto qualquer:

```
https://script.google.com/macros/s/AKfycbwa_TMG_RFnsFPE1-Q-gmYN9nPAv6QLy4A5N5B_z8VNK31N7R_-J_rPJtkErhJMLfMzeA/exec?path=foto&action=base64&fileId=SEU_FILE_ID
```

Resposta esperada: um JSON começando com `{"ok":true,"mimeType":"image/jpeg","dataUri":"data:image/jpeg;base64,/9j/4AA...`

Se vier `ok:false`, a mensagem de erro indica o problema (id inválido ou o script
sem permissão de leitura no Drive).

## Sem esse endpoint

O app tenta o Apps Script primeiro; não encontrando, cai nas URLs do Google como
hoje. As fotos continuam aparecendo na tela e no **Imprimir / Salvar PDF**, e o
app avisa quantas ficaram de fora do PDF do Compartilhar. Nada quebra.
