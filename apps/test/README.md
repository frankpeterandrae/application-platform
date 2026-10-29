# Guided Chat – Architektur v0.2

Native TypeScript Web Component, keine UI-Framework-Abhängigkeit. **Kein echtes Backend-Streaming**: fest definierte Fragen werden visuell Zeichen für Zeichen eingeblendet; Screenreader erhalten den vollständigen Text in einer separaten Live-Region.

## Module und Testzuordnung

| Modul                                 | Aufgabe                                       | Vitest                                           |
|---------------------------------------|-----------------------------------------------|--------------------------------------------------|
| `core/chat-engine.ts`                 | Quellen und Handlerregistrierung              | `tests/core/chat-engine.test.ts`                 |
| `core/dialog-runner.ts`               | Ablauf `question`, `text`, `result`, Plugins  | `tests/core/dialog-runner.test.ts`               |
| `core/message-store.ts`               | Nachrichtenstatus und Events                  | `tests/core/message-store.test.ts`               |
| `streaming/text-stream.ts`            | Graphemweise Animation, Abbruch, Überspringen | `tests/streaming/text-stream.test.ts`            |
| `accessibility/announcer.ts`          | Volltextansagen                               | `tests/accessibility/announcer.test.ts`          |
| `accessibility/focus-manager.ts`      | Fokus und Rückgabe an Trigger                 | `tests/accessibility/focus-manager.test.ts`      |
| `accessibility/motion-preferences.ts` | Reduced Motion                                | `tests/accessibility/motion-preferences.test.ts` |
| `components/chat-message.ts`          | Sichtbare Nachricht                           | `tests/components/chat-message.test.ts`          |
| `components/chat-actions.ts`          | Auswahlmöglichkeiten                          | `tests/components/chat-actions.test.ts`          |
| `components/guided-chat.ts`           | DOM und öffentliche API                       | `tests/components/guided-chat.test.ts`           |
| `content.ts`                          | HTML-Allowlist / Klartext                     | `tests/content.test.ts`                          |

## Installation / Prüfungen

```bash
npm install
npm run check
npm run build
npm test
npm run test:coverage
```

Zum Import `dist/index.js` als ES-Modul laden, das Element lautet `<guided-login></guided-login>`.

```ts
const chat = document.querySelector('guided-login') as import('./src/components/guided-chat.js').GuidedChat;
chat.configure({ charactersPerSecond: 42, respectReducedMotion: true });
chat.nodes = myNodes; // Record<string, DialogNode> oder asynchrone Lookup-Funktion
chat.registerHandler('my-type', async (node, ctx) => { await ctx.appendAssistant(node.text ?? ''); });
```

## Qualitätskriterien (noch zu validieren)

- UI-Module verwenden Shadow DOM und ausschließlich Browser-APIs.
- Rendering ist nicht mit der Dialogentscheidung gekoppelt; weitere Render-Strategien bleiben möglich.
- Textanimation wird durch `prefers-reduced-motion` deaktiviert.
- Die visuelle Animation ist für Screenreader verborgen; der vollständige Text wird einmalig angekündigt.
- Antwortbuttons sind echte HTML-Buttons und über Tastatur erreichbar.
- HTML-Dialogtexte werden auf eine restriktive Teilmenge reduziert, nicht direkt per `innerHTML` eingefügt.
- Abbruch oder Neustart unterbricht asynchrone Abläufe mit `AbortController`.

**Teststand:** `tsc -p tsconfig.json` wurde erfolgreich ausgeführt. Vitest konnte in der Ausführungsumgebung mangels Zugang zum npm-Registry nicht installiert und daher nicht ausgeführt werden. Die Tests sind ein Prüfgerüst, noch kein Nachweis erfolgreicher Barrierefreiheit. NVDA/Firefox, JAWS/Chrome, 400%-Zoom, Tastatur-/Fokusnavigation und axe-core müssen auf dem Zielsystem geprüft werden.

**Offene Designpunkte:** Exakte Übernahme eurer Dialogdatei, Fokuspolitik nach Auswahl, Dialog-Fortsetzung nach Schließen, vollständige Lokalisierung sowie Integration externer Login-Buttons. Der Code ist ein Architekturprototyp, kein produktionsfreigegebenes Paket.

## TypeScript-Sichtbarkeit und Sonar S9382 (v0.2.1)

Klassenmitglieder besitzen explizite TypeScript-Zugriffsmodifizierer (`public`, `private` als Parameter-Property; private `#`-Felder und -Methoden bleiben echte ECMAScript-Privatmitglieder). `typescript:S9382` steht für `await` in Schleifen, nicht für Accessibility-Modifier. Die sequentiellen Zustandsabläufe von `DialogRunner` und `TextStream` wurden in rekursive asynchrone Schritte überführt. Fachliche Reihenfolge und Abbruchprüfung bleiben bestehen.

Prüfstand: `npm run check` und `npm run build` erfolgreich; Vitest noch nicht ausgeführt (`vitest` lokal nicht installiert). Ein SonarQube-Lauf wurde nicht durchgeführt.
