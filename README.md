# Spotify Mini Player (Hybrid Desktop)

Mini lecteur Spotify desktop basé sur une architecture **3 couches**:

- **Frontend Electron** (`frontend/`) : interface moderne, always-on-top, draggable.
- **Backend Node/Express** (`backend/`) : OAuth Spotify, API locale, logs, gestion de token.
- **Communication locale HTTP** (`127.0.0.1:8787`) entre UI et backend.

## Fonctionnalités

- Lecture / Pause
- Piste suivante / précédente
- Infos live (titre, artiste, pochette, état)
- Gestion des erreurs si Spotify est fermé ou si l'utilisateur n'est pas authentifié
- Backend redémarrable indépendamment
- UI redémarrable indépendamment

## Installation

```bash
npm install
cp .env.example .env
```

Configurez vos credentials Spotify dans `.env`.

## Lancer

```bash
npm start
```

- Backend: `node backend/server.js`
- Frontend: `electron .`

## OAuth

1. Cliquer sur **Connexion Spotify**.
2. Le navigateur s'ouvre sur Spotify.
3. Après validation, Spotify redirige vers `http://127.0.0.1:8787/auth/callback`.
4. Le token est stocké dans `backend/token.json` puis rafraîchi automatiquement.

## Logs

- Fichier logs backend: `backend/logs/backend.log`

## Build Windows (.exe portable)

```bash
npm run package
```

Le build est généré dans `build/` via `electron-builder`.
