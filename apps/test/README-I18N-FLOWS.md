# Flow-Registry und Übersetzungen (v0.5)

Die Dialogdefinition bleibt `getFlow(): Record<FlowId, DialogNode>`. Es ist **keine Migration der vorhandenen Dialogknoten nötig**. Die Registry verpackt `getFlow()` in `{ startNode, nodes }`. Die HTML-Seite wählt nur `<guided-login flow="demo"></guided-login>`.

Die Demo zeigt zwei dynamisch importierte Flows (`demo`, `short`). Für den echten DRV-Flow einen eigenen Registry-Eintrag ergänzen, der `getFlow()` aus dem bestehenden Modul importiert. **Die mitgelieferten Demoknoten sind Beispiele und kein vollständiger DRV-Flow.**

`i18n` orientiert sich an eurem bestehenden Service (`init`, `setLanguage`, `loadLanguage`, `getLanguage`, `t`). Die Demo lädt `drv/i18n/de.json`, anschließend `loadFlow`, und übergibt dem generischen Chat `chat.translator = key => i18n.t(key)`. Übersetzbare sichtbare UI-Strings stehen in `src/i18n/keys.ts`. Dialogtexte verwenden ebenfalls `i18n.t(...)`.

Eine existierende DRV-i18n-Implementierung sollte **nicht dupliziert** werden: in der echten Integration statt unserer Beispiel-Implementierung den vorhandenen `shared/translations`-Export importieren. Die Chat-Komponente selbst hängt nur von der Translator-Funktion ab.

`getFlow()` erzeugt hier bei jedem Aufruf neue übersetzte Daten; dies verhindert veraltete Texte bei Sprachwechsel. Falls ihr die bestehende Cache-Implementierung beibehaltet, braucht ihr eine Cache-Invalidierung und ein erneutes Laden des Flows nach `setLanguage(...)`. `chat.translator` bei Sprachwechsel erneut zu setzen aktualisiert die Oberfläche; für den vorhandenen Nachrichtenverlauf sollte zusätzlich ein eigenes Aktualisierungskonzept entschieden werden.

CSS bleibt als separate Dateien in `src/styles/` und wird durch den Build nach `dist/styles/` kopiert. Der Demo-Server muss das Repository-Root als Webroot ausliefern, damit `/demo/drv/i18n/de.json` unter dem entsprechenden Demo-Pfad erreichbar ist; beim Einsatz unter `/demo/` die relative URL ggf. an die reale App-Struktur anpassen.
