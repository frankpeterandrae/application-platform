# Guided Chat – Architektur v0.2

Native TypeScript Web Component, keine UI-Framework-Abhängigkeit. **Kein echtes Backend-Streaming**: fest definierte Fragen werden visuell Zeichen für Zeichen eingeblendet; Screenreader erhalten den vollständigen Text in einer separaten Live-Region.

## Module und Testzuordnung

| Modul | Aufgabe | Vitest |
|---|---|---|
| `core/chat-engine.ts` | Quellen und Handlerregistrierung | `tests/core/chat-engine.test.ts` |
| `core/dialog-runner.ts` | Ablauf `question`, `text`, `result`, Plugins | `tests/core/dialog-runner.test.ts` |
| `core/message-store.ts` | Nachrichtenstatus und Events | `tests/core/message-store.test.ts` |
| `streaming/text-stream.ts` | Graphemweise Animation, Abbruch, Überspringen | `tests/streaming/text-stream.test.ts` |
| `accessibility/announcer.ts` | Volltextansagen | `tests/accessibility/announcer.test.ts` |
| `accessibility/focus-manager.ts` | Fokus und Rückgabe an Trigger | `tests/accessibility/focus-manager.test.ts` |
| `accessibility/motion-preferences.ts` | Reduced Motion | `tests/accessibility/motion-preferences.test.ts` |
| `components/chat-message.ts` | Sichtbare Nachricht | `tests/components/chat-message.test.ts` |
| `components/chat-actions.ts` | Auswahlmöglichkeiten | `tests/components/chat-actions.test.ts` |
| `components/guided-chat.ts` | DOM und öffentliche API | `tests/components/guided-chat.test.ts` |
| `content.ts` | HTML-Allowlist / Klartext | `tests/content.test.ts` |

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

## v0.7 – Assistant avatar

Set an optional image URL in HTML (relative to the application page or absolute HTTPS URL):

```html
<guided-login flow="demo" assistant-avatar="/assets/assistant.svg"></guided-login>
```

Or via TypeScript: `chat.assistantAvatar = '/assets/assistant.svg';`. Changes also update already-rendered assistant messages. The `chat-message` component independently accepts `avatar-url`. Image elements are decorative (`alt=""`); the assistant name uses the translation key `chat.assistant`. Invalid URL protocols and failed images are hidden. External URLs may still generate image requests; host images locally when privacy matters. The CSS custom property `--gc-avatar-size` controls the size.

## Nutzerantworten (v0.7.1)

Nutzerantworten verwenden ebenfalls `<chat-message>` mit `message-role="user"`, erscheinen rechtsbündig, tragen den übersetzten Namen `chat.user` (Deutsch: Sie) und erhalten keinen Avatar. Die konfigurierte Avatar-URL gilt ausschließlich für Assistentennachrichten.

### v0.7.2 – Chatbedienung

- Nutzerlabel **Sie** steht rechtsbündig oberhalb und außerhalb der Antwortblase.
- Antworten sind beim Hover hervorgehoben; die gewählte Antwort bleibt nach der Auswahl farbig markiert (`aria-pressed="true"`).
- Der sichtbare Button „Text vollständig anzeigen“ wurde entfernt. Interne Animationen können beim Ausblenden des Panels weiterhin abgeschlossen werden.
- Nach dem Einfügen von Nachrichten und Antwortoptionen erfolgt das Scrollen unmittelbar **und** nach dem nächsten Layout-Frame (auch ohne Textanimation). Ein `ResizeObserver` unterstützt Änderungen der Containergröße.
- Beim manuellen Scrollen nach oben erscheint mittig über dem unteren Rand des Verlaufs die Schaltfläche „Zum neuesten Beitrag springen“. Automatisches Folgen pausiert bis zum Zurückspringen oder manuellen Erreichen des Endes.
- Neuer i18n-Schlüssel: `chat.scrollDown`.
- Styling bleibt vollständig in den separaten CSS-Dateien.

**Teststatus:** TypeScript-Check und Build geprüft. Vitest benötigt lokal installierte Abhängigkeiten.

### v0.7.3: No visible chat footer

The footer and the visual streaming/loading status have been removed. The live
region remains inside the chat for accessible announcements. Flow failures,
dialog errors and unavailable login actions are displayed inline in the message
log (`.chat-error`) and announced via the existing announcer. The message log
continues to occupy the remaining side-panel height.


## Einheitliche Light-/Dark-Assets (v0.7.5)

Avatar und Scroll-Icon verwenden dieselbe `ThemeImage`-Logik mit externen Bilddateien.

```html
<guided-login
  flow="demo"
  assistant-avatar="/assets/assistant-light.svg"
  assistant-avatar-dark="/assets/assistant-dark.svg"
  scroll-icon="/assets/arrow-down-light.svg"
  scroll-icon-dark="/assets/arrow-down-dark.svg">
</guided-login>
```

- Das native `<picture>`-Element verwendet automatisch `prefers-color-scheme: dark` für die Dark-Variante. Eine explizite Theme-Einstellung ist nicht erforderlich.
- Fehlt die Dark-URL, wird die Light-URL verwendet. Fehlt die Light-URL, wird die Dark-URL verwendet.
- Beide SVGs des Scroll-Buttons liegen standardmäßig unter `src/assets/icons/` und werden beim Build nach `dist/assets/icons/` kopiert; die HTML-Attribute sind dafür optional.
- Relative URLs sind relativ zur HTML-Seite. Es werden nur HTTP(S)-URLs akzeptiert; externe Ressourcen sollten aus Datenschutzgründen vermieden werden.
- Nutzerantworten erhalten weiterhin **keinen Avatar**; die SVGs der Icons sind rein dekorativ und besitzen `alt=""`.

Die Farben des Chats werden über CSS-Custom-Properties und `@media (prefers-color-scheme: dark)` gesteuert; die Avatar- und Scroll-Icons reagieren unabhängig davon automatisch auf das Browser-Theme.

### Scroll-to-bottom-Button (v0.7.7)

Die Standarddateien `src/assets/icons/arrow-down-light.svg` und
`arrow-down-dark.svg` enthalten **den vollständigen runden Button**
(Hintergrund, Rand und Pfeil) in einer 44×44-Zeichenfläche.
Das HTML-`button` bleibt als interaktives, über i18n beschriftetes Element
bestehen, zeichnet selbst aber weder Rand noch Hintergrund. Bei Bedarf können
über `scroll-icon` und `scroll-icon-dark` eigene vollständige Button-SVGs
mitgeliefert werden. Der Hover-Zustand erfolgt über einen CSS-Filter,
Tastaturfokus wird weiterhin sichtbar mit einem CSS-Outline dargestellt.

## Keycloak/FTL Ergebnisaktionen (`resultButtonId`)

Ein vorhandener `result`-Knoten bleibt unverändert:

```ts
{ id: 'eid_result', type: 'result', text: 'Weiter zur Anmeldung', resultButtonId: 'eid' }
```

`resultButtonId` darf entweder `eid` **oder** `assistant-button-eid` enthalten. Die Komponente sucht das **Originalelement** (`#assistant-button-eid`), verschiebt es als Light-DOM-Kind von `<guided-login>` und projiziert es mit einem nativen `<slot>` in den Chatverlauf. Die FTL-generierten Login-URLs, Attribute und Click-Handler werden weder kopiert noch neu aufgebaut. Das ursprüngliche Element darf in einem zuvor ausgeblendeten FTL-Elterncontainer liegen; dieser bleibt unverändert.

Bei Neustart, Flow-Wechsel oder Entfernen des Chats wird das Element an seine ursprüngliche Position zurückgesetzt und sein vorheriger `hidden`-, `display`- und `slot`-Zustand wiederhergestellt. Ein fehlendes Element erzeugt eine Chat-Fehlermeldung und ein `chat-error`-Event. Die Aktion benötigt **keinen** zusätzlichen `action`-Eintrag in den Flow-Daten.

Die FTL muss die Elemente im selben `document` bereitstellen, bevor der jeweilige Result-Knoten erreicht wird. Die tatsächlich enthaltenen `<drv-ui-button>`-Elemente bleiben im Light DOM und sollten im echten Keycloak-Login auf Tastatur, Fokus und Theme getestet werden.
