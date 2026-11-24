# Dependency-Update-Plan für Nx 24

Stand: 01.11.2026. Dieser Plan enthält nur offene Aufgaben und zurückgestellte Updates. Versionsziele und Kompatibilitätsangaben der zurückgestellten Updates stammen aus der Analyse vom 31.10.2026 und sind vor Umsetzung erneut zu prüfen.

## Offene Aufgaben

| Aufgabe                            | Status / nächster Schritt                                                            |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| Stream Deck SDK 3                  | Technisch umgesetzt; echter Gerätetest ausstehend.                                   |
| NestJS 12.3.2 / Schematics 12.0.12 | Durch `@nx/nest@24.0.3` blockiert.                                                   |
| ESLint 10.14.0                     | Durch `eslint-plugin-import@2.32.0` blockiert.                                       |
| eslint-plugin-jsdoc 65.4.2         | Separates Major-Update unter ESLint 9 möglich; Konfiguration und neue Regeln prüfen. |
| Webpack Dev Server                 | Direkten Root-Eintrag auf Notwendigkeit prüfen; derzeit kein Bedarf für Version 6.   |

## Stream Deck SDK 3: echter Gerätetest ausstehend

SDK 3.0.4 und `@elgato/utils@0.6.2` sind integriert. Die automatisierten Build-, Lint-, Typ-, Unit-, Packaging- und simulierten Protokollprüfungen waren erfolgreich. Offen bleibt die physische Abnahme beider Plugins auf Stream Deck unter Windows/macOS:

- Settings speichern und Property Inspector öffnen.
- Yamaha-Empfänger wechseln; Capability-Abruf und Statusaktualisierung prüfen.
- Profil- und Multi-Action-Wechsel sowie Key-down/up prüfen.
- Yamaha-Wiederholungs-Timer und dessen Beendigung prüfen.

Automatisierte Protokollprüfungen ersetzen den Gerätetest nicht. Installation beziehungsweise Verknüpfung und gegebenenfalls Neustart mit dem Nutzer abstimmen. Erst nach dokumentiertem erfolgreichem Gerätetest ist dieser Schritt abgeschlossen.

Bisherige Nachweise liegen unter ignoriertem `tmp/dependency-p3/`, insbesondere `final-package.log`, `final-check-plugin.log`, `final-paint-startup.log` und `final-yamaha-settings.log`.

## NestJS 12: derzeit blockiert

Die sieben Pakete `@nestjs/common`, `core`, `platform-express`, `platform-ws`, `websockets`, `testing` und `schematics` sind gemeinsam zu betrachten. Framework/Adapter/Testing-Ziel ist 12.3.2, Schematics-Ziel 12.0.12. RxJS 7.8.2 und reflect-metadata 0.2.2 erfüllen die Framework-Peers. Schematics 12 verlangt TS `>=6.0.0`, Prettier `^3.0.0` und Node `^22.22.3 || ^24.15.0 || >=26.0.0`: vorhandene Versionen passen.

**Blocker:** `@nx/nest@24.0.3` deklariert für Core/Common `>=10.0.0 <12.0.0`. Auch der abgefragte `latest`-Tag zeigt derzeit 24.0.3 mit dieser Grenze. Deshalb nicht installieren und den Konflikt nicht unterdrücken. Freigabe erst, wenn ein kompatibles Nx-Release vorliegt. Alternativ wäre die Entfernung von `@nx/nest` nach Prüfung aller Generator-/Executor-Verwendungen ein eigener Architekturentscheid; das bloße Fehlen eines Nest-Executors im aktuellen Server genügt nicht als Auftrag zur Entfernung.

Tatsächlicher Schwerpunkt ist `stream-overlay-server` mit NestFactory, Express-HTTP-API, `WsAdapter`, Paint-/Stream-Gateways und Nest-Providern in `libs/stream-overlay/paint-data-access`. `z21-server` nutzt eine eigene HTTP-/WebSocket-Infrastruktur und ist keine zweite Nest-App.

Nach Auflösung des Blockers:

- Alle Framework-/Adapter-/Testing-Pakete synchron umstellen; keine Installation von Socket.IO, Microservices, GraphQL, NATS, Config oder Terminus erforderlich, da diese Integrationen hier nicht verwendet werden.
- Nest 12 ist ESM-only. Das Repository baut den Server mit Webpack und `NxAppWebpackPlugin`, Compiler `tsc`, Target `node`, und startet über `@nx/js:node`. Externals, resultierende CommonJS-/ESM-Grenzen und `require(esm)` beim echten Node-Start prüfen. Kein globales `type: module` setzen: Das würde unter anderem die bestehende CommonJS-Webpack-Konfiguration betreffen.
- Besonders den Shutdown prüfen: `DatabaseService.onApplicationShutdown()` schließt SQLite; `PaintSnapshotService.onApplicationShutdown()` exportiert noch einen schmutzigen Snapshot. Geänderte Lifecycle-Reihenfolge kann diesen Export hinter das Schließen der Datenbank verschieben. Die benötigte Reihenfolge explizit sicherstellen und durch einen integrierten Shutdown-Test nachweisen.
- REST-Paint-Endpunkte, Fehlerstatus, WebSocket-Handshake/-Nachrichten/-Disconnect sowie SIGTERM und Snapshot-Inhalt testen. Die bisherigen Unit-Tests alleine prüfen keinen vollständigen Serverlebenszyklus.

Der [Nest-12-Migrationsleitfaden](https://docs.nestjs.com/migration-guide) beschreibt ESM und Lifecycle-Änderungen; eine Umstellung des eigenen Codes auf ESM oder des Nx-Builds auf Rspack ist nicht automatisch erforderlich. Nicht den Nest-CLI-Upgrade-Befehl blind auf dieses Nx-Workspace anwenden.

Peer-Quellen: [Nx Nest](https://registry.npmjs.org/@nx/nest/24.0.3), [Nest Core](https://registry.npmjs.org/@nestjs/core/12.3.2), [Schematics](https://registry.npmjs.org/@nestjs/schematics/12.0.12), [Express](https://registry.npmjs.org/@nestjs/platform-express/12.3.2), [WS](https://registry.npmjs.org/@nestjs/platform-ws/12.3.2).

## ESLint 10: Import-Plugin ist der Blocker

ESLint 10.14.0 unterstützt Node `^20.19.0 || ^22.13.0 || >=24`. Nx ESLint 24.0.3, angular-eslint 22.6.0 und typescript-eslint 8.72.1 erlauben ESLint 10; letzteres akzeptiert TS `>=4.8.4 <6.1.0`. Auch unused-imports 4.4.1 und Playwright 2.12.1 lassen ESLint 10 zu.

`eslint-plugin-import@2.32.0` erlaubt hingegen nur ESLint bis 9; der abgefragte `latest`-Tag liefert dieselbe Version. Es wird real in `eslint.config.mjs` für `import/no-duplicates` verwendet. Erst eine unterstützte Version abwarten oder bewusst auf ein kompatibles alternatives Plugin umstellen und diese Regel samt Inline-Type-Import-Verhalten nachweisen. Keine Peer-Ausnahme als dauerhafte Lösung.

`eslint-plugin-jsdoc` 64.5.4 → 65.4.2 ist ein separates ausstehendes Major-Update. Version 65 unterstützt ESLint 7–10, TS als Peer und verlangt Node `^22.22.2 || >=24.15.0`. Es kann grundsätzlich noch unter ESLint 9 migriert werden; neue empfohlene Regeln und die aktuelle JSDoc-Konfiguration separat linten.

Das Repository nutzt bereits Flat Config mit lokalen `eslint.config.mjs`-Dateien. Nach [ESLint-10-Migrationsleitfaden](https://eslint.org/docs/latest/use/migrate-to-10.0.0) insbesondere die nun dateibasierte Config-Suche und geänderte empfohlene Regeln prüfen. Deshalb Root-Lint und projektweise Nx-Lintläufe vergleichen, einschließlich Angular-Templates und Playwright-Dateien. Kein Bedarf für Jiti aufgrund der vorhandenen MJS-Konfigurationen. `tools/eslint-rules` wird in Nx-Inputs erwähnt, existiert aktuell aber nicht; es wurden keine dort zu migrierenden eigenen Regeln gefunden.

Quellen: [ESLint](https://registry.npmjs.org/eslint/10.14.0), [Nx ESLint](https://registry.npmjs.org/@nx/eslint/24.0.3), [typescript-eslint](https://registry.npmjs.org/typescript-eslint/8.72.1), [angular-eslint](https://registry.npmjs.org/angular-eslint/22.6.0), [Import-Plugin](https://registry.npmjs.org/eslint-plugin-import/2.32.0), [JSDoc 65](https://registry.npmjs.org/eslint-plugin-jsdoc/65.4.2).

## Webpack Dev Server 6: aktuell kein benötigtes Update

Version 6.1.0 benötigt Node `>=22.15.0` und Webpack `^5.101.0`; Node 24.19, Webpack 5.112.2 und Webpack CLI 7.3.1 sind dafür grundsätzlich geeignet. **Nx Webpack 24.0.3 erlaubt jedoch ausschließlich `webpack-dev-server ^5.0.0`.**

Die aufgelösten Targets zeigen keinen `@nx/webpack:dev-server` und keinen `webpack serve`-Aufruf. `stream-overlay-server:build` führt `webpack-cli build` aus; `serve` verwendet `@nx/js:node`. Die Angular-UIs verwenden `@angular/build:dev-server`. Damit ist ein Dev-Server-6-Update funktional nicht erforderlich. Webpack selbst und `@nx/webpack` bleiben dagegen für den Backend-Build erforderlich.

Als separate Bereinigung prüfen, ob der direkte Root-Eintrag von `webpack-dev-server` entfallen kann. Sein Peer ist bei Nx Webpack optional; andere Consumer und die spätere npm-Auflösung nochmals prüfen. Eine Entfernung aus dem Root-Manifest garantiert nicht die vollständige Entfernung aus dem transitiven Baum.

Falls künftig ein echter Consumer entsteht: Erst Nx-Peer-Unterstützung, dann [Version-6-Migration](https://github.com/webpack/webpack-dev-server/releases/tag/v6.0.0) für Express 5, entfernte CLI-/Proxy-Optionen und Middleware-API prüfen. Aktuell keine entsprechenden eigenen `devServer`-Anpassungen notwendig.

Quellen: [Dev Server 6.1.0](https://registry.npmjs.org/webpack-dev-server/6.1.0), [Nx Webpack](https://registry.npmjs.org/@nx/webpack/24.0.3).

## Validierung für die offenen technischen Änderungen

Alle folgenden Befehle sind Abnahmekriterien, keine neu ausgeführten Prüfungen. Mit der festgelegten npm-Version arbeiten; unter PowerShell gegebenenfalls `npm.cmd` verwenden.

Vor Änderungen in einer frischen Arbeitskopie installieren und den vollständigen Baum prüfen. Nach Manifest- oder Lockfile-Änderungen beide Installationsmodi abnehmen: reguläres `npm ci` und den CI-Ablauf `npm ci --ignore-scripts`, jeweils gefolgt von `npm ls --all`. Unter CI/Linux erneut prüfen; native SQLite-/esbuild-Komponenten auch ohne Lifecycle-Scripts testen. Kein `--force`, kein `--legacy-peer-deps` und keine abgeschwächten Tests oder Coverage-Schwellen.

Gemeinsame technische Abnahme über Nx:

```powershell
npm exec -- nx run-many -t build lint typecheck --parallel=3 --skipNxCache
npm exec -- nx run-many -t test --exclude=homepage,demo,starmap,stream-overlay-ui,z21-ui --run --parallel=3 --skipNxCache
npm exec -- nx run-many -t test -p homepage,demo,starmap,stream-overlay-ui,z21-ui --watch=false --parallel=3 --skipNxCache
npm exec -- nx run z21-server-e2e:e2e:ci --skipNxCache
```

Die Target-Liste vor Ausführung mit dem aktuellen Projektbestand abgleichen. Testanzahlen, HTML-/LCOV-Berichte und tatsächliche Coverage-Dateimenge mit dem Ausgangsstand vergleichen; Audit-Diff getrennt bewerten.

Bei NestJS zusätzlich Produktionsbundle unter Node 24 starten, REST/WS und SIGTERM mit temporärer Datenbank prüfen; Snapshot muss vor dem Schließen der Datenbank geschrieben werden. Bei ESLint/JSDoc alle Projekte einschließlich Angular-Templates, Playwright und Inline-Type-Imports prüfen. Eine Webpack-Dev-Server-Entfernung erfordert eine saubere Installation sowie Backend-Build und Config-Laden ohne den direkten Root-Eintrag.
