# JC Mobile

App React Native do JC, usando Expo (SDK 57).

Expo **é** React Native — não são duas instalações. O Expo é o toolchain que
empacota o React Native com build, dev server e o app de teste no celular.

## Versões

| Pacote       | Versão   |
|--------------|----------|
| expo         | ~57.0.13 |
| react-native | 0.86.2   |
| react        | 19.2.3   |

Requer Node 20 ou superior.

## Rodar no seu iPhone

O dev server (Metro) precisa rodar **na sua máquina**, na mesma rede Wi-Fi do
celular. Não funciona a partir de um container remoto.

1. Instale o **Expo Go** na App Store.
2. Na sua máquina:

```bash
cd mobile
npm install
npx expo start
```

3. Leia o QR code que aparece no terminal com a câmera do iPhone.

O app abre no Expo Go e recarrega sozinho a cada alteração salva.

## Gerar o app de verdade (.ipa / .apk)

Build na nuvem da Expo, sem precisar de Mac:

```bash
npm install -g eas-cli
eas login
eas build --platform ios
```

Para publicar na App Store é necessária uma conta Apple Developer (paga).
Para Android, troque para `--platform android`.

## Estrutura

```
mobile/
├── App.js        # componente raiz — comece por aqui
├── index.js      # entrypoint registrado no Expo
├── app.json      # nome, ícone, splash, bundle identifier
└── assets/       # ícones e splash screen
```

## Integração com o n8n

O webhook de tarefas do JC está documentado no `CLAUDE.md` da raiz do
repositório. Para consumir a partir do app:

```js
await fetch('<n8n-base-url>/webhook/gestao-tarefas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
```

Nunca coloque o PAT do GitHub no código do app — o bundle é distribuído junto
com o aplicativo e qualquer chave dentro dele é legível. A autenticação
com o GitHub fica no n8n, no servidor.
