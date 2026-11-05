# Flow-Registry und Übersetzungen (v0.5)

Die Dialogdefinition bleibt `getFlow(): Record<FlowId, DialogNode>`. Es ist **keine Migration der vorhandenen Dialogknoten nötig**. Die Registry verpackt `getFlow()` in `{ startNode, nodes }`. Die HTML-Seite wählt nur `<guided-login flow="demo"></guided-login>`.

Die Demo zeigt zwei dynamisch importierte Flows (`demo`, `short`). Für den echten DRV-Flow einen eigenen Registry-Eintrag ergänzen, der `getFlow()` aus dem bestehenden Modul importiert. **Die mitgelieferten Demoknoten sind Beispiele und kein vollständiger DRV-Flow.**

`i18n` orientiert sich an eurem bestehenden Service (`init`, `setLanguage`, `loadLanguage`, `getLanguage`, `t`). Die Demo lädt `drv/i18n/de.json`, anschließend `loadFlow`, und übergibt dem generischen Chat `chat.translator = key => i18n.t(key)`. Übersetzbare sichtbare UI-Strings stehen in `src/i18n/keys.ts`. Dialogtexte verwenden ebenfalls `i18n.t(...)`.

Eine existierende DRV-i18n-Implementierung sollte **nicht dupliziert** werden: in der echten Integration statt unserer Beispiel-Implementierung den vorhandenen `shared/translations`-Export importieren. Die Chat-Komponente selbst hängt nur von der Translator-Funktion ab.

`getFlow()` erzeugt hier bei jedem Aufruf neue übersetzte Daten; dies verhindert veraltete Texte bei Sprachwechsel. Falls ihr die bestehende Cache-Implementierung beibehaltet, braucht ihr eine Cache-Invalidierung und ein erneutes Laden des Flows nach `setLanguage(...)`. `chat.translator` bei Sprachwechsel erneut zu setzen aktualisiert die Oberfläche; für den vorhandenen Nachrichtenverlauf sollte zusätzlich ein eigenes Aktualisierungskonzept entschieden werden.

CSS bleibt als separate Dateien in `src/styles/` und wird durch den Build nach `dist/styles/` kopiert. Der Demo-Server muss das Repository-Root als Webroot ausliefern, damit `/demo/drv/i18n/de.json` unter dem entsprechenden Demo-Pfad erreichbar ist; beim Einsatz unter `/demo/` die relative URL ggf. an die reale App-Struktur anpassen.

## Version 0.6 – eigenständiger Flow-Start, animierte Aktionen und Panelhöhe

`src/demo/main.ts` entfällt. Das Einbinden des öffentlichen `dist/index.js` registriert
`<guided-login>`. Beim Verbinden initialisiert die Komponente Übersetzungen und lädt ihren
Flow anhand des HTML-Attributs. Änderungen des Attributs zur Laufzeit laden den Flow neu
und starten den Dialog neu:

```html
<aside id="assistant-side-panel" open>
  <guided-login flow="demo"></guided-login>
</aside>
<script type="module" src="../dist/index.js"></script>
```

In der DRV-Anwendung den vorhandenen i18n-Service einbinden, nicht die Demoimplementierung
verdoppeln. Optional vor dem Verbinden über `chat.initializeTranslations`, `chat.translator`
und `chat.flowLoader` die bestehenden Anwendungen-Schnittstellen injizieren.
Der Registry-Eintrag führt weiterhin unverändert `getFlow()` aus und ergänzt `startNode`.

Die Antwortoptionen werden **nacheinander** erstellt, deren Beschriftungen visuell
schrittweise eingeblendet und erst nach vollständiger Ausgabe aller Antwortoptionen aktiviert. Der Button
behält während der Animation einen konstanten zugänglichen Namen. Die konfigurierte
Geschwindigkeit und `prefers-reduced-motion` gelten auch für die Optionen. Der
„Überspringen“-Button beendet die gerade laufende Textanimation, nicht zwingend alle
weiteren Optionen.

Auto-Scroll folgt neuen Nachrichten und Antwortbuttons solange der Verlauf unten ist;
scrollt der Nutzer bewusst nach oben, wird das automatische Nachführen pausiert.
Beim nächsten Neustart wird es wieder aktiviert.

Die CSS-Datei `chat.css` setzt den Host und die Chat-Shell auf `block-size:100%` und
`min-block-size:0`. **Das umgebende Sidepanel benötigt eine definierte Höhe** und muss
seine Flex-/Grid-Kinder schrumpfen lassen können (`min-height:0`), damit nur `.log`
scrollt, nicht der gesamte Chat. Das Demo-Panel verwendet dafür eine feste Höhe.

TypeScript: `npm run check` und `npm run build`. Die angelegten Vitest-Tests für
Flow-Attribut und Antwort-Streaming konnten in dieser Umgebung noch nicht ausgeführt
werden (Testabhängigkeiten nicht installiert).
