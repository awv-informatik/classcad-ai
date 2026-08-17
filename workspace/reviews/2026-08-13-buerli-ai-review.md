# buerli-ai Review — warum der In-App-Agent hinterherhinkt, und wie wir ihn hochziehen

**Datum:** 2026-08-13 · **Autor:** cc · **Anlass:** ph — „das buerli-ai Panel, selbst mit Opus, könnte den Sprocket nie bauen. Warum, und was tun?"
**Untersucht:** `websites/packages/shared-buerli-ai` (src komplett), `@classcad/skill`-Bundle 0.0.4, buerligons-Einbindung (`buerligons.io/src/components/editor.jsx`).

---

## 1. Wie es heute funktioniert

`@buerli.io/ai` ist ein sauber gebauter Browser-Chat-Agent:

- **Loop** (`agentLoop.ts`): klassischer tool-use-Zyklus. Provider-Abstraktion (Anthropic / OpenAI-Responses / Chat-Completions / Copilot-Proxy), max. 25 Iterationen, `maxTokens` default 4096, History wächst verbatim (kein Compaction).
- **Tools** (12): `call_api` (jede v1-/buerli-Methode), `call_api_batch` (Sequenz mit `$N`-Referenzen auf frühere Ergebnisse — IDs, keine Berechnung), `tree`/`find`/`inspect`, Selektion lesen/setzen, `list_methods` (mit CAD-Synonym-Suche), `describe_method` (Registry + Skill-Markdown), `snapshot`, `load_file`, `download`, `delegate` (Subagent).
- **Wissen**: npm-Paket `@classcad/skill` — `method-registry.json` (254 Methoden, Signaturen) + `bundle.json` (238 Markdown-Docs). Der komplette Methoden-Index (~4.6k Tokens) wird in den System-Prompt injiziert; Detail-Docs holt das Modell per `describe_method`.
- **Subagents**: `delegate` startet einen genesteten Loop mit Persona-Prompt (sketch/boolean/…), leerer History, max. 15 Iterationen.
- **Code-Panel**: die Session wird als generiertes buerli-Script angezeigt (nachträglich, aus dem Call-Log).

Die Codequalität ist gut — Fehleranreicherung mit Signaturen, tolerante `$N`-Auflösung, Synonym-Ranking, saubere Provider-Discovery. Das Problem ist nicht Schlamperei. **Das Problem ist das Paradigma.**

## 2. Warum es beim Sprocket zwangsläufig scheitert

Referenz: was den Sprocket in meinen Trainings-Sessions möglich gemacht hat, Punkt für Punkt gegen das Panel gehalten.

### 2.1 Kein Rechenmedium — der Kernfehler

Der Sprocket ist zu ~80 % **Mathematik**: `Rp = P/(2·sin(π/N))`, Tangentenbedingungen, Arc-Branches, Bulges `tan(sweep/4)`, 8 Profil-Entities × Koordinaten aus verketteter Trigonometrie, Rotation über N Zähne, Einheiten-Kaskade. Ich habe dafür ~1000 Zeilen JS geschrieben (`_model.mjs` mit der Mathematik, `_build.mjs` mit dem Aufbau) — Variablen, Funktionen, Schleifen, Wiederverwendung.

Das Panel-Modell muss **jede Zahl im Kopf ausrechnen und als Literal in JSON-Tool-Calls inlinen**. LLMs sind schlecht in verketteter Arithmetik; ein einziger falscher Sinus und der Sketch löst nicht mehr — mit einem opaken Solver-Fehler, den das Modell nicht auf die falsche Zahl zurückführen kann. `call_api_batch` reicht IDs weiter (`$0.id`), kann aber **nicht rechnen**. Es gibt keine Schleifen, keine Funktionen, keine Zwischengrößen. Opus scheitert hier nicht an Intelligenz, sondern daran, dass das Medium falsch ist — als müsste man ein CAD-Programm diktieren statt es zu schreiben.

### 2.2 Keine Iteration von frischem Zustand

Mein Workflow: Script editieren → frisches Part → laufen lassen → messen → wiederholen. Dutzende Läufe, Fehlschläge kosten nichts. Das Panel operiert auf **einer** lebenden Zeichnung: ein gescheiterter Versuch hinterlässt halbe Features, konsumierte Bodies, verbrauchte Namen. Es gibt kein Checkpoint/Restore, kein Scratch-Part, kein „von vorn". Nach dem zweiten Fehlversuch modelliert der Agent im Trümmerfeld.

### 2.3 Wissen: veraltet, und teilweise unerreichbar

- **Bundle 0.0.4 ist Wochen hinter dem trainierten Skill.** Es fehlen exakt die Fallen, die meine ersten Sprocket-Anläufe gekillt haben: `merged:1`-Pattern-Regel (unmerged friert in Booleans still ein!), EIF-Operationsreihenfolge, polyline2d-Bulges statt Arc-Chains, Planeless-Sketch-Signatur („Couldn't set the value"), `@expr` in Dimensionen, getPositions-Weltkoordinaten, recalc-zerstört-EIF, Expression-Silent-No-op. Ohne die läuft jeder Agent in dieselben stillen Fehler — und ClassCAD meldet dabei **Erfolg** (maxLevel 31). Der Trainings-Pipeline fehlt der letzte Meter ins Produkt.
- **Die Topic-Docs sind toter Code.** `SKETCHING` (24k), `GRAPHICS`, `STRUCTURE` liegen im Bundle, aber `describeMethod` probiert nur `<domain>/<method>` und `api/<domain>` — Top-Level-Keys sind über kein Tool erreichbar. Genau das Dokument, das den Sketch-Workflow im Zusammenhang erklärt, kann das Modell nie lesen.
- **Pull-only**: das Modell muss wissen, wonach es fragen soll. Ein Frisch-Modell kennt die Fallen nicht, also fragt es nicht — und generische CAD-Priors füllen die Lücke (unsere Box-Session-Lektion: Muscle-Memory propagiert falsche Claims).

### 2.4 Verifikation ist abtrainiert — und der Agent ist blind

Der System-Prompt sagt wörtlich: Verify ist „usually UNNECESSARY", snapshot „RARELY". Für Box-Demos richtig (spart Turns), für konstruktive Builds fatal: mein Sprocket stand nur, weil **jede** Behauptung numerisch geprüft wurde (MassProps vs. Monte-Carlo, Brep-Proben, Bounds) — das hat jeden stillen Fehler gefangen (SOUL-Regel: spatial claims require numeric proof). Dazu: `sendSnapshotsToModel` defaultet auf `false` und buerligons setzt es nicht — **Snapshots erreichen das Modell nie**, sie werden nur dem User angezeigt. Der Agent kann sein eigenes Ergebnis buchstäblich nicht sehen.

### 2.5 Budgets für Demo-Größe

25 Iterationen (Subagent 15), 4096 maxTokens, kein Compaction: eine Sprocket-Klasse-Aufgabe braucht bei Einzel-Call-Medium hunderte Runden — und stirbt vorher an der Iterationsgrenze oder am Kontext. (Bei Code-als-Medium reichen die 25 dann wieder.)

### 2.6 Delegate schadet mehr als es nützt

Die Persona **ersetzt** den kompletten System-Prompt (Workflow-Regeln, Editor-Startzustand weg; nur der Methoden-Index wird wieder angehängt). Der Subagent startet ohne Konversationskontext, liefert unstrukturierte Prosa zurück, und die fünf Personas tragen null Spezialwissen. Für CAD-Aufbauten ist das Fragmentierung ohne Gegenwert.

### Kurzform

| Was den Sprocket getragen hat | Panel heute |
|---|---|
| Code als Medium (Mathe, Loops, Module) | Einzel-Tool-Calls mit Kopfrechnen |
| Frisches Part pro Lauf, Fehlschläge gratis | eine lebende Zeichnung, Trümmer bleiben |
| aktueller Skill inkl. aller Fallen | Bundle 0.0.4, Topic-Docs unerreichbar |
| numerische Verifikation als Pflicht | Verifikation abtrainiert, Snapshots blind |
| unbegrenzte Iteration, Journal | 25 Runden, kein Gedächtnis, kein Plan-Artefakt |

## 3. Plan

### P0 — `run_script`: Code-Ausführung als Tool *(der eine große Hebel)*

Ein Tool, das ein vom Modell geschriebenes JS-Script sandboxed im Browser ausführt, mit injiziertem `api` (v1 + buerli-Namespaces auf der aktuellen Zeichnung), `Math`, `console.log`-Capture; Rückgabe = Logs + Return-Value. Damit kollabieren hunderte Tool-Calls zu einem, und Mathematik/Schleifen/Wiederverwendung werden möglich — exakt mein Trainings-Harness, im Browser.

- Sandbox: QuickJS-WASM oder isolierte `Function` ohne DOM-Zugriff (gleiche Trust-Boundary wie `call_api` — das API-Objekt hat der Agent ohnehin).
- Das Code-Panel dreht sich um: das Script ist nicht mehr abgeleitete Ansicht, sondern **das Medium**. (Die Infrastruktur dafür existiert schon halb.)
- `call_api`/`batch` bleiben für kleine Edits — für Aufbauten gehört in den Prompt: „ab ~5 zusammenhängenden Operationen oder sobald gerechnet wird: schreib ein Script."
- Aufwand: der größte Einzelposten, aber überschaubar (Sandbox-Wahl + Result-Capping + Prompt-Umbau).

### P0 — Skill-Pipeline schließen

`@classcad/skill` aus dem trainierten Submodule-Stand (498f6bd) neu bündeln und veröffentlichen; CI-Hook: Skill-Push → Bundle-Publish → Dependency-Bump in websites. Das gesamte Training zahlt erst dann ins Produkt ein. *(Kleinster Aufwand, sofort machbar.)*

### P1 — Wissens-Routing reparieren

1. `read_doc`-Tool (oder describe_method-Fix) für Topic-Docs: `SKETCHING`, `GRAPHICS`, `STRUCTURE`, `api/<domain>`-Übersichten. Prompt-Regel: „vor dem ersten Sketch: SKETCHING lesen."
2. **Rezepte in den Skill**: 3–5 durchgearbeitete End-to-End-Beispiele als eigene Docs — parametrisches Teil (Expressions + Constraints + `@expr`-Dims), pattern-then-subtract mit `merged:1`, EIF/solid-Workflow, Verifikations-Idiome (MassProps, getGeometryIds/Positions-Proben). Destillat der Sprocket-Varianten A/B. Modelle imitieren Rezepte weit besser, als sie aus Methoden-Docs komponieren.

### P1 — Verifikation umdrehen, Blindheit beheben

- Prompt-Regel graduieren: triviale Ops nicht verifizieren; mehrstufige konstruktive Builds **numerisch** prüfen (MassProps/Bounds/Proben) — die Idiome dazu liefert das Rezept-Doc.
- `sendSnapshotsToModel` bei vision-fähigen Modellen auf `true` (Capability-gesteuert, wie die Picker), plus Snapshot nach Abschluss eines Builds als Regelfall.

### P2 — Iteration & Recovery

- **Checkpoint/Restore**: vor riskanten Sequenzen OFB-Save (in-memory), bei Fehlschlag restore — „von vorn" wird billig.
- Budgets: Iterationen für komplexe Tasks hoch (Stop-Button existiert ja), Kontext-Management (Tool-Results cappen, alte Results nach N Turns auf Summaries eindampfen).

### P2 — Delegate reparieren oder entfernen

Mit `run_script` entfällt der Hauptgrund für Delegation. Entweder streichen, oder: Persona **ergänzt** den Basis-Prompt statt ihn zu ersetzen, bekommt relevanten Kontext mit, liefert strukturiert zurück.

### P3 — Plan-/Notiz-Scratchpad

Ein winziges `notes`-Tool (get/set im Store), damit lange Aufgaben ein Plan-Artefakt haben, das Compaction überlebt.

## 4. Umsetzung (2026-08-13, gleiche Session)

Alle Punkte P0–P3 sind implementiert:

- **`run_script`** (`src/tools/script.ts`): AsyncFunction-Sandbox mit injiziertem `api` (v1 direkt, buerli-Namespaces, facade mit auto-drawingId), Math/Loops/Variablen, console-Capture (gecappt), Timeout auf awaited work (60s default), Browser-Globals geshadowt. Sechs Sandbox-Pfade per Smoke-Test verifiziert (API-Call, Shadowing, Fehler+Log-Tail, Timeout, Syntaxfehler, Drawing-Namespace). Scripts erscheinen verbatim im Code-Panel (neues `script`-CodeEvent, gescoped als `await (async api => {...})(facade.api)`).
- **Skill-Pipeline**: `classcad-skill`-Repo auf Trainings-Stand ge-fast-forwarded (dabei api-js 21.0.0→21.2.0-Regression gefixt), Rezepte ergänzt, Version 0.0.5, Bundle neu gebaut (242 Docs), in websites-node_modules synchronisiert, publish-on-tag GitHub-Workflow ergänzt (braucht NPM_TOKEN-Secret; Release = `npm version patch && git push --follow-tags`).
- **Rezepte** (`references/recipes/`): parametric-part, pattern-then-subtract, direct-modeling-eif, verify-numerically — Destillat der Sprocket-Varianten, Submodule-Commit 4f6997c.
- **`read_doc`**: Topic-Docs/Overviews/Rezepte erreichbar (case-insensitive, listet bei Fehlschlag); `describe_method("SKETCHING")` routet jetzt ebenfalls.
- **System-Prompt**: Scripts als Medium („escalate the moment you catch yourself calculating a number"), Rezept-/SKETCHING-Lesepflicht vor Builds, gestufte numerische Verifikationsregel (ersetzt „usually UNNECESSARY"), notes/checkpoint-Workflow.
- **Snapshot-Vision**: `ModelOption.vision` (endpoint-Flag oder Familien-Heuristik), Panel setzt `sendSnapshotsToModel` capability-getrieben; App-Override via Factory-Option.
- **`checkpoint`/`restore`**: in-memory OFB (max 5/Drawing), restore = clear + v0.baseModeler.load; Stale-id-Warnung im Tool-Result.
- **Kontext**: Tool-Results gecappt (30k chars, explizite Truncation-Marker), History-Pruning Richtung `contextLimit` (alte Tool-Results → Stubs, letzte 12 Messages + aller Text bleiben), Defaults 25→40 Iterationen, 4096→8192 Tokens.
- **Delegate**: Persona ERWEITERT jetzt den Basis-Prompt (vorher ersetzt), extraContext bleibt, strukturierter Report-Auftrag.
- **`notes`**: Scratchpad pro Drawing (get/set/append, 8k cap), im Prompt als Pruning-überlebendes Arbeitsgedächtnis verankert.

Typecheck + Build sauber. Uncommitted: websites-Repo (shared-buerli-ai src + README). Committed: classcad-skill 87e4837 (Standalone, unpushed) + Submodule 4f6997c (unpushed).

## 5. Erwartung

P0 allein (Script-Tool + aktueller Skill) verschiebt die Fähigkeitsklasse: aus „diktiere 300 Calls mit Kopfrechnen" wird „schreibe ein Programm mit korrekten Referenz-Docs" — das ist die Differenz zwischen dem Panel heute und dem, was den Sprocket gebaut hat. P1 macht es zuverlässig (Fallen + Rezepte + Selbstkontrolle), P2 macht es ausdauernd.
