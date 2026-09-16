# Multi-client: "Grafik plötzlich weg" — Code-Analyse (2026-08-28)

> **AUFGELÖST (2026-09-02, Roman, buerli 4f498b5):** Die Server-CommandConfig
> ist PER KOMMANDO — die `Configuration` beim Connect hatte nie persistente
> Wirkung, jedes Kommando lief mit Server-Defaults, und `sendGraphic_Invisible`
> fehlte obendrein. Operationen, die Körper temporär unsichtbar machen
> (Feature öffnen → Rollback), lieferten deren Grafik daher nicht nach →
> Container weg, Modell verschwunden. Fix: WSClient hängt die Flags jetzt an
> jeden Request (`config` pro Kommando) + `sendGraphic_Invisible: true`.
> Die unten analysierten Kandidaten bleiben als Härtungs-Punkte gültig
> (Patch-Drop-Resync ist inzwischen gefixt: WSClient `resyncStructure`),
> waren aber nicht die primäre Ursache.
>
> **ÜBERHOLT (2026-09-04, Branch `multi-client-flags` in runtime/buerli/
> classcad-ai):** Die Per-Command-Config ist wieder weg. Der Server hält die
> Emission-Flags jetzt PRO VERBINDUNG (`SetEmissionConfig`/`GetEmissionConfig`, persistent,
> jederzeit änderbar); `GetTree` liefert immer die Struktur,
> `requestVisualisation` immer seine Grafik. Der WSClient setzt sein Profil
> einmal beim Connect. Siehe runtime `docs/SessionSharing.md` §4.3.

Report (Kollege): *"Einmal hatte ich plötzlich keine Grafik mehr, das Modell ist
irgendwie einfach verschwunden. Ich glaube ich wollte ein bestehendes Feature
öffnen, bin aber nicht mehr sicher."* — einmalig, nicht reproduziert.

Untersucht: runtime `DrogonController.h` (Broadcast), `CommandProcessorJsonV1.h`
+ `JSONPatchWorker.cpp` (Patches/Sync), buerli `WSClient.ts` + core
`structure.ts`/`graphic.ts` (Anwendung der Frames), react `Product.tsx`
(Render-Kette), buerligons/react-cad multi-client-Diffs (Viewpoints, Follow,
Guest-Overlay, Feature-Plugins). Keine Änderungen gemacht.

## Wie das Modell überhaupt sichtbar ist (Render-Kette)

`Product` läuft `structure.root` → `tree[..].geometryIdList/solids` →
`geometry.cache[solidId]`. Das Modell verschwindet genau dann, wenn (a) der
Baum die Solid-Referenzen verliert, (b) der Geometrie-Cache die referenzierten
Container verliert und nichts sie neu liefert, oder (c) die Kamera degeneriert.

## Sync-Architektur (relevant für alle Kandidaten)

- Der Server broadcastet **jedes** Text-/Binary-Frame eines Kommandos an alle
  Session-Geschwister (`sendText`/`sendBinary` in DrogonController).
- Struktur kommt als **JSON-Patches gegen eine EINZIGE Session-Baseline**
  (`JSONPatchWorker.treeSnapshot`). Konsistenz setzt voraus, dass **jeder
  Client jeden Patch erfolgreich anwendet** — es gibt keinen Resync-Mechanismus.
- Grafik kommt **dirty-getrieben** (`onGraphicChanged`) — verlorene Grafik wird
  nie unaufgefordert nachgeliefert.
- `GetTree`/`Sync` liefert Voll-Baum + Voll-Grafik im Result-Frame und
  **resettet die Patch-Baseline**; auch dieses Frame wird gebroadcastet
  (heilt nebenbei Desyncs bei allen Geschwistern).

## Kandidaten, nach Plausibilität

### 1. Stiller Patch-Drop → permanenter Baum-Desync (Client)

`structure.ts:applyPatches`: wirft `jsonpatch.apply_patch`, wird der Block
**gefangen, `console.error`, verworfen** — der Server erfährt nichts, der
Client fordert nichts nach. Ab da ist der lokale Baum von der Session-Baseline
abgekoppelt; Folge-Patches können weitere Knoten falsch entfernen oder selbst
fehlschlagen. Verliert der Baum dabei `geometryIdList`-Referenzen bzw. den
Pfad root→Produkt, ist die Ansicht leer — dauerhaft, bis irgendein Client
`GetTree` auslöst (Broadcast heilt) oder Reload.

Konkrete Auslöser für einen ersten Fehlschlag:
- **Join-Fenster**: Guest verbindet, Host-Kommando läuft vor dessen `GetTree`
  durch die Queue → Patches treffen den noch leeren Baum (Default-Tree) →
  throw → Drop. Danach kommt zwar der Voll-Baum, aber die Reihenfolge
  Patches-vor-Snapshot ist ein reales Fenster.
- **Engine-seitig verlorene Patches**: `CreateDiffTree` hat einen
  Exception-Pfad (Encoding, bekannt nach STEP-Import). Schlägt `json::diff`
  nach dem Baseline-Update fehl, ist die Änderung **für alle Clients**
  verloren; der nächste Patch referenziert Pfade, die kein Client hat → Drops
  überall.
- Frontend-seitig existiert der Twist, dass `applyPatches` in ZWEI set()-Blöcken
  läuft (Meta vor Tree, laut Kommentar bewusst) — imperative Reader
  (`getDrawing()` in Callbacks/useFrame) können den Zwischenzustand sehen.

Passt zum Bild: einmalig, nicht reproduzierbar, hinterlässt genau einen
`console.error` — den niemand gesehen hat.

### 2. `structure.set` + `cleanupGraphicRecords` beim Broadcast-Vollbaum

`structure.set` (läuft bei JEDEM Geschwister, sobald IRGENDEIN Client
`fetchTree` macht, weil das GetTree-Result gebroadcastet wird) ruft
`cleanupGraphicRecords()`: Container + Geometrie-Cache, die der (neue) Baum
nicht referenziert, werden verworfen. Ist der Snapshot momentan inkonsistent
zur Grafik (GetTreeCommand nimmt den Baum in `Run()`, die Grafik wird ERST
DANACH in `syncFunc` gebaut — rotieren bei einer erzwungenen Neutessellierung
die Container-Ids, referenziert der Baum Ids, die es im Cache nie gab), bleibt
die Ansicht leer, bis etwas re-tesselliert. Grafik wird dirty-getrieben nie
nachgeliefert. Wahrscheinlichkeit mittel — braucht Id-Rotation im Fenster.

### 3. Render-Crash beim Feature-Öffnen auf desyncem Baum

Die Feature-Plugins greifen beim Öffnen ungeschützt in den Baum:
z. B. Sketch `PlaneSelectionMode`: `tree[opSeqId].children` (kein `?.`,
opSeqId kann `NOCCID` sein), Extrusion liest `tree[objectId]?.members?.region.value`
usw. Multi-client macht das erstmals gefährlich: Remote-Patches ändern den
Baum, während lokale UI-Referenzen (Plugin objectId) stehen bleiben. Ein Throw
beim Öffnen entlädt den React-Teilbaum/Canvas → „Modell weg". Passt exakt zum
Timing „ich wollte ein Feature öffnen". Sekundär: ein Throw in einem
`useFrame`-Subscriber (SharedViewpoints) bricht den Frame ab.

### 4. Kamera-/Presence-Schicht (Follow, Viewpoints)

- `FollowCamera` setzt die ECHTE Kamera auf die **normalisierte** Marker-Pose
  (`radius*1.6` vom Target) und `zoom = size.height / data.height`. Degenerierte
  Peer-Daten (`height` 0/∞ bei zoom→0/∞) ⇒ zoom 0/∞ ⇒ leerer Viewport; sehr
  große Modelle können zudem an near/far clippen. Gilt nur WÄHREND Follow
  (Banner sichtbar), Exit stellt die gespeicherte Pose wieder her.
- `ViewpointMarker`/CameraHelper mit NaN-Peer-Daten erzeugt NaN-Geometrie
  (Three-Culling-Ausfälle für den Helper, restliche Szene bleibt) — eher Kosmetik.
- Keine Validierung eingehender Presence-`data` (position/target/up/height
  werden ungeprüft konsumiert) — Härtungs-Kandidat unabhängig vom Bug.

### 5. Korrekt synchronisiertes „Verschwinden" (kein Bug, aber gleiche Optik)

- Der ANDERE Client (zweites Fenster des Testers!) macht File→New/Open oder
  Clear → Baum wird für ALLE geleert; im beobachteten Fenster verschwindet das
  Modell „von selbst".
- Host-Verbindung endet → Guests werden gekickt → `GuestSessionOverlay`
  („Session ended") — explizit, würde erinnert.

### Nebenbefund (nicht der Bug, aber notiert)

- **Undo/Redo unter WSClient**: `cad.states` (current/stack) wird — anders als
  beim SocketIOClient (der ein Server-Push-Frame verarbeitet) — vom WSClient
  nie gesetzt; nur die captionMap wird beim Absenden gepflegt. Undo-Stack-UI
  dürfte unter Drogon-WS leer bleiben; in geteilten Sessions wäre ein geteilter
  Engine-State-Stack mit Client-lokalen captionMaps ohnehin inkonsistent.
- `structure.set` merged flach (`{...alt, ...neu}`): Keys, die der Snapshot
  nicht enthält (z. B. zurückgesetzte current*-Zeiger), bleiben stale.
- `applyPatches` ruft `cleanupGraphicRecords` NICHT — Container leaken bis zum
  nächsten Voll-Snapshot (nur Speicher, kein Sichtbarkeitsproblem).

## Was einen erneuten Vorfall diagnostizierbar machen würde (Vorschläge, nicht umgesetzt)

1. `applyPatches`-Catch: statt still zu verwerfen einmalig ein auffälliges
   `console.warn` + automatischer `fetchTree()` (Self-Heal; der Broadcast des
   Voll-Baums heilt sogar alle Geschwister mit).
2. Presence-`view`-Daten beim Empfang validieren (finite, height > 0), sonst
   Frame verwerfen.
3. Optional ein Sequenznummern-Feld auf Struktur-Frames (Server zählt pro
   Session hoch) — Client erkennt Lücken deterministisch statt erst am
   Patch-Fehler.

## Fazit

Der wahrscheinlichste Mechanismus ist Kandidat 1 (stiller Patch-Drop, evtl. im
Join-Fenster oder nach einem engine-seitig verlorenen Diff), mit Kandidat 3 als
dem Moment, in dem der Desync sichtbar wurde („Feature öffnen" → leerer/
gecrashter Canvas). Kandidat 5 (Aktion im anderen Fenster) ist die banale
Alternative, die niemand ausschließen kann. Ein erneuter Vorfall MIT offener
DevTools-Konsole würde zwischen 1/3 (console.error von jsonpatch bzw. React)
und 4/5 sofort unterscheiden.
