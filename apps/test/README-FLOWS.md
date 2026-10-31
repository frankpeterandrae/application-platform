# Styling und Flows

Styles stehen unter `src/styles/`. Beim Build werden sie nach `dist/styles/` kopiert. Jede Web Component lädt das eigene Stylesheet im Shadow DOM. CSS Custom Properties wie `--gc-accent` können vom Host angepasst werden. Der Server muss die CSS-Dateien zusammen mit den JS-Dateien ausliefern.

Flows liegen als TypeScript-Module unter `src/flows/`. Die Definition enthält `startNode` und `nodes`. Neue Flows werden in `src/flows/index.ts` registriert. Die HTML-Seite wählt nur den Namen: `<guided-login flow="demo"></guided-login>` oder `flow="short"`. Das Modul `src/demo/main.ts` lädt den gewählten Flow asynchron.

Build: `npm run build`; Tests: `npm test`. Die Demo muss über HTTP ausgeliefert werden, nicht als `file://`.
