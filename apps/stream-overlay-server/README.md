# Stream Overlay Server

## Twitch einrichten

Registriere eine vertrauliche Twitch-App in der [Twitch Developer Console](https://dev.twitch.tv/console/apps).
Starte dann den Overlay-Server und öffne **Dashboard → Konfiguration** (`/dashboard/config`).

1. Öffne auf dem Windows-Host das mit `npm exec -- nx serve stream-overlay-ui` gestartete Dashboard über `http://localhost:4220/dashboard/config`. Der lokale Dashboard-Proxy verwendet den Konfigurationsschlüssel aus der Serverdatei automatisch.
2. Trage unter **Twitch-App** die **Client-ID** und das **Client Secret** aus der Twitch Console ein und speichere. Die Zugangsdaten landen in `%LOCALAPPDATA%\StreamOverlay\twitch-config.json` im Benutzerprofil des Kontos, das den Server startet. Sie können dort auch direkt als `clientId` und `clientSecret` bearbeitet werden.
3. Starte den Overlay-Server neu. Bei jedem Start lädt er die gespeicherten Zugangsdaten automatisch. Benutzer- und Kanalabfragen verwenden damit ein App-Token aus dem Client-Credentials-Flow.

Die Konfigurationsdatei und die separate Datei `twitch-tokens.json` liegen im Benutzerprofil, außerhalb des Git-Checkouts und der Datenbank-Snapshots. Verwende HTTPS, wenn du das Dashboard über das Netzwerk aufrufst.

Bei einem separat gehosteten Dashboard wird die Schlüsseleingabe nach einer nicht autorisierten Anfrage angezeigt. Verwende dort den Wert `configKey` aus der Datei auf dem Server. Der mit Nx gestartete lokale Dashboard-Proxy ist für den Zugriff direkt auf dem Windows-Host vorgesehen.

### Twitch-Konto verbinden

1. Registriere in der Twitch Console die vollständige OAuth Redirect URL `http://localhost:3000/api/twitch/config/callback`. Läuft der Overlay-Server lokal auf einem anderen Port, verwende diesen Port. Öffne das lokale Dashboard ebenfalls über `http://localhost`; es darf auf einem anderen Port laufen.
2. Wähle im Dashboard unter **Twitch-Konto** die benötigten Berechtigungen für lesenden Chat, das Senden von Chat-Nachrichten oder Alerts für Follows, Abos und Bits.
3. Klicke **Mit Twitch verbinden**, melde dich mit dem gewünschten Twitch-Konto an und bestätige die Berechtigungen. Für Alerts verwende das Konto des Kanals. Twitch schickt den Browser zurück. Der Server speichert die Tokens in der Token-Datei.

Für einen HTTPS-Zugriff über das Netzwerk setze in `twitch-config.json` den Wert `redirectUri` auf die registrierte öffentliche HTTPS-Adresse mit dem Pfad `/api/twitch/config/callback` und starte den Server neu. Dashboard und Callback müssen denselben Hostnamen und dasselbe Protokoll verwenden. Leite den Callback-Pfad an den Overlay-Server weiter.

Eine erneute Verbindung ersetzt den gespeicherten Grant. Wähle dabei alle weiterhin benötigten Berechtigungen. Ein vorhandener Refresh-Token lässt sich weiterhin manuell eintragen. Betreibe pro Benutzer-Grant eine Serverinstanz mit Schreibzugriff auf die Token-Datei.

Bestehende Deployments können weiterhin `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `TWITCH_CONFIG_KEY`, `TWITCH_TOKEN_FILE` und `TWITCH_REFRESH_TOKEN` verwenden. Gespeicherte App-Zugangsdaten und der gespeicherte Konfigurationsschlüssel haben Vorrang. Ein per `TWITCH_TOKEN_FILE` konfigurierter Pfad muss außerhalb des Git-Checkouts in einem geschützten, persistenten Verzeichnis liegen.

## Verwendung im Backend

Importiere `TwitchModule` in das jeweilige Feature-Modul und injiziere `TwitchHelixClient`. `getUserByLogin`, `getUserById` und `getChannel` liefern den ersten Treffer oder `undefined` bei leerer Trefferliste. Die Kanalabfrage erwartet die Twitch-Broadcaster-ID.

Für weitere Helix-Endpunkte wählt das Feature bei `request` den erforderlichen Token-Typ (`app` oder `user`). Für Transporte mit eigenem Verbindungsaufbau liefert `TwitchTokenService.getAccessToken` das Token. Bei einer Ablehnung kann der Aufrufer das betroffene Token zur einmaligen Erneuerung übergeben.

Der Helix-Client erneuert nach HTTP 401 das Token und wiederholt den Aufruf einmal. `TwitchError` enthält Operation, Fehlergrund und, sofern vorhanden, den HTTP-Status. HTTP 429 liefert zusätzlich `rateLimit` mit den von Twitch gesendeten Werten. `resetAt` ist ein Unix-Zeitstempel in Sekunden. Der Aufrufer entscheidet, ob und wann er eine Anfrage nach einem Rate Limit erneut versucht.
