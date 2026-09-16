# CC_Annotation → userData: Prüfergebnis

**Kurzfassung: Nein, nicht problemlos.** Geprüft wurden die C++-Implementierung, die Filer
(Save/Undo), der Structure-Broadcast und die API-Oberfläche.

## Was die Prüfung ergab

### 1. `SetUserData` kann einen existierenden Key nicht überschreiben — echter Bug

`CCObject.cpp` (CCDbObject::SetUserData):

```cpp
userData->insert(std::make_pair(key, value));
```

`unordered_map::insert` ist ein **No-Op, wenn der Key existiert**. Der erste
`setUserData({ key: "annotations", ... })` funktioniert, jedes Update danach wird
stillschweigend verschluckt. Annotationen sind genau das: häufige Updates desselben Keys.
Workaround wäre remove+set, der richtige Fix `insert_or_assign`.

### 2. userData wird heute weder gespeichert noch von Undo erfasst

Alle Filer (Out **und** In, inklusive Rollback/Undo) sind mit
`fileVersion >= userDataVersion` (= 12) gegated (`FilerVisitor.cpp`). `curVersionId` ist
aber nur in `_UNICODE`-Builds 15 — in den Linux/WASM-Builds (kein `_UNICODE` im CMake) ist
es `tessellationParamsVersion = 11`. Konkret:

- **OFB-Save schreibt userData nicht.**
- **Der Rollback-Filer erfasst userData nicht** — `setUserData` ist zwar als
  `undoable: true` markiert, das Undo ist auf Produktions-Builds aber faktisch leer.

Das ist Romans CAD-4429-Vorbehalt — und er gilt für Save **und** Undo.

### 3. userData überlebt kein Objekt-Kopieren

Steht explizit in der API-Doku von `setUserData`: *"If the given object will be copied
later, the user data is not copied as well."*

### 4. Kein Entry-API, dafür ein Lost-Update-Problem in geteilten Sessions

Die 5 Service-Funktionen sind reines key/value (set/get/keys/remove/clear) — kein
`appendEntry`. Die Kommentarliste würde ein JSON-Blob in einem String: jedes Anhängen =
read-modify-write des ganzen Blobs. **Zwei Clients kommentieren gleichzeitig → letzter
gewinnt, der andere Kommentar ist weg.** Heute serialisiert der `AddEntry`-Code-Member die
Appends engine-seitig — Konflikte gibt es gar nicht erst. Ausgerechnet im
Multi-Client-Szenario wäre das der Rückschritt.

### 5. Was funktionieren würde

- **Sync**: ja — der Tree-Writer (`RapidJsonTreeWriter.cpp`) schreibt userData ungegated,
  die Patches sind ein `json::diff` über den ganzen Baum. userData-Änderungen kämen bei
  allen Clients an.
- **Transformation**: der Vorteil bliebe erhalten, wenn owner-lokale Koordinaten ins Blob
  geschrieben werden — den Parent-Walk macht der Client sowieso.

## Typsicherheit: der Kern des Problems

CC_Annotation ist eine Klasse mit typisierten Members, engine-seitiger API (`AddEntry` mit
Parametern, Index-Löschen, Selbstlöschung bei leerem Entry-Array) und Undo. userData ist
`string → string`. Der Wechsel verschiebt die gesamte Struktur in einen **unversionierten
JSON-String, den jeder Client identisch parsen und schreiben muss** — Schema-Drift
zwischen Apps inklusive.

Rainers Einwand *"Apps nehmen typisierte Children an"* würde ersetzt durch *"Apps müssen
sich auf ein untypisiertes String-Schema einigen"*. Das ist dasselbe Problem, eine Ebene
tiefer — und ohne Engine-Unterstützung.

## Zu Rainers Einwand selbst

Berechtigt im Prinzip, aber schwächer als er klingt: die Children eines CC_Part sind
**schon heute heterogen** — CC_WorkPlane, CC_WorkAxis, CC_Sketch, CC_Solid, ExpressionSet,
ReferenceSet. Code, der über Part-Children iteriert, muss bereits nach Klasse filtern;
eine Klasse mehr ist keine neue Kategorie von Problem. Das echte Restrisiko sind
ungewöhnliche Parents (Annotation an einer BrepReference oder Operation), wo Children
homogen sein könnten.

Zwei gezielte Härtungen statt Systemwechsel:

1. **Parents einschränken** — `idTypes` im `annotation.create`-Param auf die Typen
   begrenzen, die wirklich gebraucht werden.
2. Falls konkrete Iterationen stolpern: die betroffene Stelle nach Klasse filtern lassen —
   oder Annotationen unter einen dedizierten Container je Produkt hängen. Letzteres kostet
   allerdings den Kern des Designs (das Objekt *ist* die Referenz) und holt die toten
   Zeiger zurück. Nur tun, wenn ein realer Bruch nachgewiesen ist, nicht vorsorglich.

## Fazit

userData wäre erst tragfähig nach:

1. CAD-4429 (fileVersion-Bump → Save **und** Undo aktiv),
2. einem `insert_or_assign`-Fix in `CCDbObject::SetUserData`,
3. einem Konzept gegen das Lost-Update bei parallelen Kommentaren

— und tauscht dann typisierte Struktur gegen ein String-Blob ohne Entry-API. Die
Children-Sorge lässt sich billiger und direkter adressieren.
