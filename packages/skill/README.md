# @classcad/skill

An [agent skill](https://agentskills.io) for the [ClassCAD](https://classcad.ch) headless CAD engine — structured API references with verified annotations that help AI agents generate correct ClassCAD code.

> **Status: 0.0.x pre-release.** Content is actively evolving; expect additions and corrections between versions.

## What this is

ClassCAD is a headless, programmable parametric CAD engine driven entirely through a JSON/WebSocket API (264 methods across 7 domains: part, assembly, sketch, curve, solid, drawing2d, common). This package documents that API for LLM consumption:

- [`SKILL.md`](SKILL.md) — entry point: domain index, all 264 APIs with one-line summaries, cross-cutting guides
- `references/api/*.md` — source API documentation per domain (signatures, parameter tables, return types)
- `references/<domain>/*.md` — per-API LLM docs: gotchas, dead ends, common errors, working examples
- `recipes/*.md` — end-to-end verified workflow guides incl. `constrained-sketching.md`; the data contract (`DATA`/`STRUCTURE`/`GRAPHICS`) ships with [`@classcad/script`](https://www.npmjs.com/package/@classcad/script)
- `method-registry.json` / `bundle.json` — build artifacts: the full v1 method registry (generated from engine JSDoc) and every doc bundled as JSON (browser-safe, no filesystem)

Every per-API doc is **battle-tested**: the documented behavior was observed by executing real API calls against a live ClassCAD server — including the failure modes, silent no-ops, and doc discrepancies that source documentation doesn't cover.

## The discovery module — one source for every agent host

`@classcad/skill/discovery` is the single implementation of everything an
agent host needs to serve this knowledge:

- **`searchMethods`** — BM25 search over name + summary (whole words, camelCase
  split, plurals folded) with CAD-synonym expansion (split→slice, hole→bore,
  round→fillet, …); an array of queries
  returns one ranked group per entry, so broad concepts can't crowd out the rest
- **`describeMethod`** — one key, fuzzy: bare names resolve, ambiguity lists
  candidates, typos get suggestions; also serves whole documents (topic docs,
  domain overviews, recipes)
- **`methodIndex`** — the compact one-line-per-method index (~5k tokens) that
  hosts put into the system prompt / MCP initialize instructions so the model
  knows the full surface from turn one
- **`bulkDocs` + `DOCS_TOOL`** — the `docs(keys[])` bulk tool itself: contract
  (name, LLM-facing description, key/size caps) AND implementation
  (`# ═══ key ═══` sections, "not found" reporting, optional per-key resolver
  hook for host-specific key spaces)

The buerli in-app agent and the ClassCAD MCP server both register their
discovery tools from this module — same code, same behavior, verbatim.

```js
import { createDiscovery, DOCS_TOOL } from '@classcad/skill/discovery'
import registry from '@classcad/skill/method-registry.json' with { type: 'json' }
import bundle from '@classcad/skill/bundle.json' with { type: 'json' }
// The DATA/STRUCTURE/GRAPHICS contract docs are owned by the script medium —
// hosts merge them in via `extraDocs` (the skill alone doesn't carry them):
import { docs as scriptDocs } from '@classcad/script/docs'

const discovery = createDiscovery({ registry, bundle, extraDocs: scriptDocs })
const { text } = await discovery.bulkDocs(['DATA', 'v1.part.extrusion', 'v1.part.chamfer'])
```

## Usage

**As a Claude Code / agent skill** — drop the package into your skills directory:

```bash
npm install @classcad/skill
mkdir -p .claude/skills
ln -s ../../node_modules/@classcad/skill .claude/skills/classcad
```

`SKILL.md` carries Agent Skills frontmatter (`name: classcad`), so any skill-aware agent picks it up from there.

**With the [ClassCAD MCP server](https://github.com/awv-informatik/classcad-ai/tree/master/packages/mcp)** (`packages/mcp` in this monorepo) — it consumes this package directly (workspace dependency; `CLASSCAD_SKILL_PATH` overrides for live-doc development) and serves these docs through its `docs`/`describe_method` tools.

**As plain context** — load `SKILL.md` as the index and pull `references/` files on demand. The per-API docs are self-contained.

## Testing

`npm run build` ends with a snapshot check, and `npm test` runs it together with the discovery unit tests.
`test/snapshot.mjs` records everything an agent host gets from this package against the baselines in
`test/snapshots/`:

| Snapshot | Covers |
|---|---|
| `registry.json` | every method: summary and parameter names |
| `indexes.json` | `listDocs`, `docIndex`, `methodIndex`, bundle keys, limits, doc aliases, synonym table |
| `prompts.json` | `RECIPES_POINTER`, `REFERENCE_IMAGE_POINTER`, the `docs` tool contract |
| `docs.json` | every bundle document via `readDoc` and `describeMethod`: size, hash, headings |
| `describe.json` | every method by full key, without `v1.`, lower case, bare name and one-letter typo; edge keys |
| `search-methods.json` | `searchMethods` for every method name, synonym, vocabulary word, domain × verb, task phrase, multi-concept array, and every option |
| `search-docs.json` | `searchDocs` for task phrases, every recipe/guide title and key, synonyms, arrays, options |
| `bulk-docs.json` | `bulkDocs` for every document and every page of paged docs, plus deferral, missing keys, duplicates, key limit, small budgets and a host resolver |

A difference fails the build with a per-path diff (`~ changed`, `- removed`, `+ added`). When the change
is intended — an edited doc, a new synonym, a ranking tweak — review the diff, run `npm run test:update`,
and commit the updated snapshots with the change.

## Related

- [classcad.ch/docs](https://classcad.ch/docs/) — official ClassCAD documentation
- [classcad-ai/packages/mcp](https://github.com/awv-informatik/classcad-ai/tree/master/packages/mcp) — MCP server for driving ClassCAD from agents
- [buerli.io](https://buerli.io) — CAD-as-a-service built on ClassCAD

## License

MIT © [AWV Informatik AG](https://awv-informatik.ch)
