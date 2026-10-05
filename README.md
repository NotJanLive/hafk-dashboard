# HAFK Dashboard

Web-Dashboard für den [HAFK Bot](https://github.com/NotJanLive/hafk-bot). Next.js 16 (App Router), TypeScript,
Tailwind CSS 4, Login über Discord.

## Architektur

- **Kein Datenbankzugriff.** Alle Daten kommen über die interne REST-API des Bots (`src/lib/bot-api`).
  Der Browser spricht nie direkt mit dem Bot, sondern nur der Next.js-Server.
- **Login** per Discord OAuth2 mit State und PKCE ([arctic](https://arcticjs.dev)). Scopes sind nur `identify` und `guilds`.
  Die Session liegt in einem verschlüsselten, httpOnly Cookie ([iron-session](https://github.com/vvo/iron-session)).
- **Autorisierung im Data Access Layer** (`src/lib/dal.ts`): Jede Seite und jede Server Action ruft `requireGuild()` auf.
  Der Bot prüft dabei live, ob der Nutzer den Server verwalten darf. `src/proxy.ts` leitet nur optimistisch zum Login um.

```
src
├── app/
│   ├── page.tsx                      Login
│   ├── api/auth/…                    Discord-OAuth (login, callback, logout)
│   └── servers/
│       ├── page.tsx                  Serverauswahl
│       └── [guildId]/                Übersicht, Einstellungen, Audit-Log
├── components/
│   ├── ui/                           Basiskomponenten (Button, Panel, Led, Picker, …)
│   ├── shell/                        Sidebar, Topbar, User-Menü
│   └── …
└── lib/
    ├── bot-api/                      Typisierter Client für die Bot-API
    ├── auth/                         Session und Discord-OAuth
    ├── discord/                      CDN-URLs, Rechte, Mentions
    ├── dal.ts                        Authentifizierung und Autorisierung
    └── env.ts                        Validierte Umgebungsvariablen
```

## Design

Leitidee ist ein „Control Room“: ruhige Graphit-Flächen, Mint als Akzent (dieselbe Farbe wie die Bot-Embeds)
und Status-LEDs als wiederkehrendes Element. Labels und IDs stehen in Mono-Schrift. Alle Farben sind Tokens
in `src/app/globals.css`. Hell- und Dunkelmodus folgen der Systemeinstellung.

## Lokal starten

1. Den Bot lokal starten (siehe Bot-README), sodass die API auf `http://127.0.0.1:8081` läuft.
2. `.env.example` nach `.env.local` kopieren und ausfüllen. `BOT_API_TOKEN` muss dem `API_TOKEN` des Bots entsprechen.
3. Im Discord Developer Portal unter OAuth2 → Redirects `http://localhost:3000/api/auth/callback/discord` eintragen.
4. Danach:
   ```bash
   npm install
   npm run dev
   ```

## Scripts

| Script | Zweck |
|---|---|
| `npm run dev` | Entwicklungsserver |
| `npm run build` | Produktions-Build (`output: standalone`) |
| `npm run check` | Lint, Typecheck und Tests (vor jedem PR) |
| `npm run format` | Prettier |

## Workflow

- `main` ist geschützt, Änderungen kommen nur per Pull Request.
- Branches heißen `feature/<name>` bzw. `fix/<name>`.
- Neue Bot-Endpunkte werden zuerst im Bot umgesetzt und danach in `src/lib/bot-api/types.ts` gespiegelt.
