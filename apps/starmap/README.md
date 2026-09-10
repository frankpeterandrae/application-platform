# Starmap

Die Starmap-Anwendung dient zum Erstellen, Bearbeiten und Visualisieren von Sternkarten.

Die Anwendung basiert auf Angular und ist Teil des Nx-Monorepos `application-platform`.

## Entwicklung

Entwicklungsserver starten:

```bash
nx serve starmap
```

Tests ausführen:

```bash
nx test starmap
```

Build erstellen:

```bash
nx build starmap
```

## Persistenz

### Datenformat

Sternkarten werden als versionierte JSON-Dateien gespeichert.

Das Dateiformat ist vom eigentlichen Domainmodell getrennt und enthält eine Versionsnummer:

```json
{
	"version": 1,
	"map": {
		"id": "example-map",
		"name": "Example Map",
		"systems": [],
		"jumpLinks": [],
		"nebulae": []
	}
}
```

Die Versionsnummer gehört zum Persistenzformat und nicht zum `StarMap`-Domainmodell.

Dadurch können zukünftige Änderungen am Dateiformat über Migrationen unterstützt werden, ohne das Domainmodell mit Persistenzinformationen zu vermischen.

Die aktuelle Version des Formats ist:

```text
version: 1
```

### Serialisierung

Die Konvertierung zwischen `StarMap` und JSON übernimmt der:

```text
StarMapFileService
```

Er ist Teil von:

```text
libs/starmap/data-access
```

Der Service stellt die fachliche Serialisierung und Deserialisierung bereit und enthält keine browser- oder desktop-spezifische Dateisystemlogik.

Der grundlegende Datenfluss lautet:

```text
StarMap
   ↓
StarMapFileService.serialize()
   ↓
StarMapFile v1
   ↓
JSON
```

Beim Laden erfolgt der umgekehrte Weg:

```text
JSON
   ↓
StarMapFileService.deserialize()
   ↓
StarMap
   ↓
StarMapStore
```

### Initiale Karte

Beim Start der Webanwendung wird eine JSON-Datei aus den Assets geladen.

Die Datei wird als Text geladen und anschließend über den `StarMapFileService` deserialisiert.

Damit verwendet auch die initiale Karte dasselbe Datenformat wie manuell gespeicherte und geladene Karten.

Die frühere fest im TypeScript-Code definierte `demoMap` wird nicht mehr als reguläre Datenquelle verwendet.

### Karte laden

Über die Funktion **Karte laden** kann eine JSON-Datei ausgewählt werden.

Nach dem Einlesen wird die Datei über den `StarMapFileService` deserialisiert und als aktuelle Karte in den `StarMapStore` übernommen.

### Karte speichern

Über die Funktion **Karte speichern** wird der aktuelle Zustand der Karte serialisiert und als JSON-Datei heruntergeladen.

Der Browser kann die ursprüngliche Asset-Datei nicht direkt überschreiben. Soll die mitgelieferte Startkarte aktualisiert werden, muss die exportierte JSON-Datei während der Entwicklung manuell in die Assets übernommen werden.

Diese Einschränkung betrifft nur die aktuelle Browser-Anwendung.

## Browser-Dateien

Das Erzeugen von Downloads ist von der Starmap-Persistenz getrennt.

Die allgemeine Browser-Dateilogik befindet sich im:

```text
BrowserFileService
```

unter:

```text
libs/shared/shared-ui
```

Dieser Service wird unter anderem für folgende Dateitypen verwendet:

- JSON-Karten
- SVG-Export
- zukünftig PNG-Export

Dadurch enthalten die Starmap-Services keine duplizierte Browser-Downloadlogik.

## Legacy-Migration

Die vorherige Python-Anwendung verwendete eine `.dat`-Datei als Persistenzformat.

Dieses Format wird von der Angular-Anwendung nicht mehr unterstützt und ist kein reguläres Laufzeitformat.

Da nur eine bestehende `.dat`-Datei migriert werden musste, wurde bewusst kein dauerhafter Legacy-Import-Service in die Anwendung eingebaut.

Die Migration erfolgt einmalig über:

```text
tools/starmap/migrate-dat.ts
```

Das Script konvertiert:

```text
Legacy .dat
    ↓
Parser
    ↓
StarMap
    ↓
StarMapFile v1
    ↓
JSON
```

Beim Import werden fehlende IDs deterministisch erzeugt.

Beispiele:

```text
S001, S002, ...   Sternsysteme
P001, P002, ...   Planeten
J001, J002, ...   Sprungverbindungen
N001, N002, ...   Nebel
```

Referenzen des alten Formats, die Sternsysteme über ihren Namen identifizieren, werden während der Migration auf die neuen System-IDs umgesetzt.

Die alten Nebelpunkte besitzen nur X- und Y-Koordinaten. Beim Import wird deshalb:

```text
z = 0
```

gesetzt.

Die alten Werte `Map Minimum` und `Map Maximum` werden nicht übernommen, da die aktuelle Anwendung ihre benötigten Kartengrenzen aus den Kartendaten bestimmt.

Nach erfolgreicher Migration besteht im regulären Betrieb keine Abhängigkeit mehr zum `.dat`-Format oder zur Python-Anwendung.

## Autosave

Die Webanwendung verwendet derzeit bewusst kein Autosave.

Eine Browser-Zwischenlösung über `localStorage`, IndexedDB oder SQLite/WASM wird nicht eingeführt.

Die dauerhafte automatische Persistenz soll im Rahmen der geplanten Desktop-Version umgesetzt werden. Dort kann auf ein echtes Dateisystem beziehungsweise eine geeignete lokale Persistenz wie SQLite zurückgegriffen werden.

Siehe dazu:

- application-platform-tasks #26 – Desktop-Verteilung

## Persistenzstrategie

Die aktuelle Strategie lautet damit:

```text
                JSON
                 │
       ┌─────────┴─────────┐
       │                   │
Initiales Asset      Import / Export
       │                   │
       └─────────┬─────────┘
                 ↓
             StarMap
                 ↓
           StarMapStore
```

JSON ist das versionierte Austauschformat der Starmap.

Die konkrete Speicherung ist davon getrennt. Dadurch kann die gleiche fachliche Struktur später sowohl in der Webanwendung als auch in einer Desktop-Anwendung verwendet werden, ohne das Datenformat erneut ändern zu müssen.
