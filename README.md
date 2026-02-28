# Spotify Controller (Electron)

Application desktop qui **contrôle Spotify via l'API officielle** (pas de scraping d'Opera GX).

## Fonctions

- piste précédente
- pause / lecture
- piste suivante
- affichage du morceau en cours
- style visuel pixel-retro détaillé (interface contrôleur sans fond orange)

## Pré-requis

- Node.js 18+
- Compte Spotify Premium (nécessaire pour certaines commandes de playback)
- Une application créée sur <https://developer.spotify.com/dashboard>

## Configuration

1. Crée une app Spotify et récupère le `Client ID`.
2. Configure un Redirect URI, par exemple :
   - `http://127.0.0.1:8888/callback`
3. Lance l'application avec les variables d'environnement :

```bash
SPOTIFY_CLIENT_ID="ton_client_id" SPOTIFY_REDIRECT_URI="http://127.0.0.1:8888/callback" npm start
```

## Utilisation

1. Clique sur **Connexion Spotify**.
2. Le navigateur s'ouvre sur Spotify.
3. Après autorisation, copie la valeur `code` dans l'URL de redirection.
4. Colle-la dans le champ **Code de retour OAuth** puis clique **Valider le code**.
5. Utilise les boutons de contrôle.

## Build .exe

```bash
npm run dist
```

Le binaire Windows sera généré dans `dist/`.
