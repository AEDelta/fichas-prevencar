<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1jO-lC0hdNVm9T9BeFEVIxwyemYDPyh9N

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Firebase & Vercel (quick setup)


You can import the initialized Firebase helpers from `firebase.ts`:

```ts
import { auth, db } from './firebase';
```

## Limpar Firestore e semear admin

Se você precisa apagar os dados existentes no Firestore e deixar somente um usuário admin, criei um script Node: `scripts/clear_and_seed_firestore.js`.

Passos:

1. Instale `firebase-admin`:

```bash
npm install firebase-admin --save-dev
```

2. Gere uma chave de conta de serviço no Console Firebase (Service Account JSON) e baixe o arquivo.

3. Execute o script fornecendo o caminho para o JSON. Você pode opcionalmente passar email, nome e senha do admin:

```bash
node scripts/clear_and_seed_firestore.js /caminho/serviceAccountKey.json admin@prevencar.com.br "Admin Principal" "<ADMIN_PASSWORD>"
```

Isso apagará as coleções: `inspections`, `users`, `indications`, `services`, `monthlyClosures`, `logs` e criará um documento `users/admin` com o e-mail especificado. Se você passar uma senha, também será criado um usuário no Firebase Auth.

Use com cuidado — essa operação é destrutiva.

