# @classcad/skill

An [agent skill](https://agentskills.io) for the [ClassCAD](https://classcad.ch) headless CAD engine — structured API references with verified annotations that help AI agents generate correct ClassCAD code.

> **Status: 0.0.x pre-release.** Content is actively evolving; expect additions and corrections between versions.

## What this is

ClassCAD is a headless, programmable parametric CAD engine driven entirely through a JSON/WebSocket API (254 methods across 7 domains: part, assembly, sketch, curve, solid, drawing2d, common). This package documents that API for LLM consumption:

- [`SKILL.md`](SKILL.md) — entry point: domain index, all 254 APIs with one-line summaries, cross-cutting guides
- `references/api/*.md` — source API documentation per domain (signatures, parameter tables, return types)
- `references/<domain>/*.md` — per-API LLM docs: gotchas, dead ends, common errors, working examples
- `references/SKETCHING.md` / `STRUCTURE.md` / `GRAPHICS.md` — cross-cutting guides (constrained sketching workflow, structure tree, graphic protocol)

Every per-API doc is **battle-tested**: the documented behavior was observed by executing real API calls against a live ClassCAD server — including the failure modes, silent no-ops, and doc discrepancies that source documentation doesn't cover.

## Usage

**As a Claude Code / agent skill** — drop the package into your skills directory:

```bash
npm install @classcad/skill
mkdir -p .claude/skills
ln -s ../../node_modules/@classcad/skill .claude/skills/classcad
```

`SKILL.md` carries Agent Skills frontmatter (`name: classcad`), so any skill-aware agent picks it up from there.

**With [classcad-mcp](https://github.com/awv-informatik/classcad-mcp)** — the ClassCAD MCP server resolves this package automatically (via `CLASSCAD_SKILL_PATH` or a sibling `classcad-skill` checkout) and composes these docs into its `describe_method` tool.

**As plain context** — load `SKILL.md` as the index and pull `references/` files on demand. The per-API docs are self-contained.

## Related

- [classcad.ch/docs](https://classcad.ch/docs/) — official ClassCAD documentation
- [classcad-mcp](https://github.com/awv-informatik/classcad-mcp) — MCP server for driving ClassCAD from agents
- [buerli.io](https://buerli.io) — CAD-as-a-service built on ClassCAD

## License

MIT © [AWV Informatik AG](https://awv-informatik.ch)
