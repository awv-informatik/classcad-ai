# Training: assembly.from

**Date:** 2026-05-09

## Goal

Testing `v1.assembly.from` — creating assemblies from JSON/ECXML/XML definitions.

**Methods to cover:**

- `from` — data parameter with JSON format
- `from` — data parameter with XML format
- `from` — data parameter with ECXML format
- `from` — file parameter
- `from` — format parameter behavior (when required, when inferred)
- `from` — return value (root assembly ID)

**Questions:**

- What does the JSON format look like? Docs don't specify the schema.
- Can we round-trip: build assembly manually → export somehow → re-import with `from`?
- What's the difference between JSON, XML, and ECXML formats?
- Does `from` clear the current drawing or add to it?
- What happens with invalid/malformed data?
- Can we use `common.save` OFB data with `from`, or is `from` strictly for structured formats?
- What's the relationship between `from` and `loadProduct`?

---

## 01 — basic JSON probing

Script: `scripts/01-basic-json.mjs` — ❌ All attempts fail. Empty `{}`, `{ name }`, `[]`, and `{ type, name, parts }` all return errors.

**Data:** Empty JSON `{}` returns result=14 (assembly root ID) but maxLevel=51 (error). Error messages reveal three internal phases: `jsonAsmBuilder.CreateTemplates`, `CreateInstances`, `CreateConstraints` — each trying to iterate a null array.

**Learned:** The builder expects `templates`, `instances`, `constraints` arrays. Missing them causes "NullMem has been defined as type Array addressed."

**📌 LLM doc:** The JSON format uses `{ templates: [], instances: [], constraints: [] }` top-level structure.

## 02 — JSON schema discovery

Script: `scripts/02-json-schema.mjs` — ✅ Empty arrays succeed (maxLevel 31). Template entries fail.

**Data:** `{ templates: [], instances: [], constraints: [] }` returns result=14, maxLevel=31 (info — no errors). Adding ANY template entry `{ name: 'Box1' }` fails with "Uninitialized member."

**Learned:** The top-level structure IS `{ templates, instances, constraints }`. Empty arrays are valid. Template entries require unknown fields.

**📌 LLM doc:** Empty arrays work and create a usable assembly root.

## 03–04 — template field exploration (OFB data, file references)

Scripts: `scripts/03-template-with-ofb.mjs`, `scripts/04-template-fields.mjs` — ❌ All fail with "Uninitialized member."

**Data:** Tried template entries with: `data`, `file`, `url`, `source`, `content`, `format`, `encoding`, `type`, `kind`, `id`, `ident` — ALL produce the same error.

## 05 — export format exploration

Script: `scripts/05-save-json.mjs` — ❌ No JSON/ECXML export available.

**Data:**
- `common.save` supports: OFB, SCG, STP, IWP, STL, DXF (error code 1013 for JSON/ECXML)
- `assembly.exportNode` supports: OFB, STP only (error code 1013 for JSON/ECXML)

**Learned:** There is NO way to export an assembly to JSON or ECXML. The format is input-only, which means there's no way to discover the schema by round-tripping.

**📌 LLM doc:** JSON/ECXML are input-only formats. Cannot export to them.

## 06 — file references and direct file loading

Script: `scripts/06-file-reference.mjs` — ❌ Template file refs fail. OFB file directly rejected.

**Data:** `assembly.from({ file: '/tmp/cc-test-box.ofb' })` explicitly says: "It's not possible to create assembly from other formats than json, xml or ecxml." Template entries with `file`, `source`, `path` fields all fail with "Uninitialized member."

**Learned:** `from()` strictly accepts JSON/XML/ECXML. No OFB/STP.

**📌 LLM doc:** `from()` only accepts JSON/XML/ECXML, NOT OFB/STP files.

## 07 — ECXML format exploration

Script: `scripts/07-ecxml-and-fields.mjs` — ⚠ ECXML parser exists but element types not implemented.

**Data:** `<ecxml>` as root element gives WARNING: "This node type is not implemented yet. Creating it will be skipped. Type: ecxml". Same for XML and file-based ECXML.

**Learned:** The ECXML parser converts XML element names to node types and tries to create ClassCAD objects. The "ecxml" type is not implemented. Additional JSON field scan (18 more fields) found nothing.

## 08 — XML element type exploration (WORKER HANG)

Script: `scripts/08-xml-elements.mjs` — ⚠ `<AssemblyRoot>` and `<CC_AssemblyRoot>` are "not implemented." `<assembly>` caused a **worker hang** (100% CPU).

**Data:** Worker PID showed 98.7% CPU after processing `<assembly>` element. Required `kill -9` and restart.

**Learned:** ECXML element types must match internal ClassCAD class names, but most are "not implemented." The `<assembly>` element specifically causes a hang — a server bug.

**📌 LLM doc:** ECXML is non-functional. `<assembly>` element hangs the worker.

## 09–13 — exhaustive JSON field probing

Scripts: `scripts/09-json-deep-probe.mjs` through `scripts/13-alt-toplevel.mjs` — ❌ 60+ field names tried, none work.

**Data:** Tried: `data`, `file`, `url`, `content`, `format`, `encoding`, `compression`, `name`, `id`, `ident`, `label`, `type`, `kind`, `class`, `src`, `source`, `path`, `ofb`, `stp`, `geometry`, `model`, `shape`, `body`, `component`, `definition`, `resource`, `location`, `ref`, `reference`, `load`, `importFrom`, `import`, `product`, `part`, `assembly`, `template`, `value`, `localPath`, `rootPath`, `partName`, `solid`, `features`, `operations`, `loadFrom`, `CC_Part`, `Part`, capitalized variants, structure-tree node format, whole structure tree as JSON. ALL produce "Uninitialized member."

**Learned:** The JSON template/instance entry format is completely undocumented and cannot be discovered empirically. Over 60 field names exhausted.

## 14 — empty assembly behavior

Script: `scripts/14-empty-assembly.mjs` — ✅ Key behavioral findings.

**Data:**
- `from()` returns assembly root ID (result=99, maxLevel=31)
- Existing drawing content is CLEARED (part created before `from()` was not preserved)
- The created assembly is fully usable — added templates and instances successfully
- Second `from()` call replaces everything again

| ![from-then-build](files/14-empty-assembly-from-then-build-solid.png) |
|---|

**Learned:** `from()` with empty arrays is functionally equivalent to `common.clear() + assembly.create()`. It creates a fresh assembly root that can be populated with the standard assembly APIs.

**📌 LLM doc:** `from()` CLEARS the drawing and creates a new assembly root. Equivalent to `clear + create` with empty arrays.

## 15 — instances, constraints, and from-vs-create comparison

Script: `scripts/15-instances-constraints.mjs` — ❌ Instance/constraint entries fail, but constraint builder reads `type` field.

**Data:**
- Instance entries fail with "Uninitialized member" (same as templates)
- Constraint entries give "Unknown constraint type!" — the builder READS `type` but 'fastened' is not recognized
- **from() with empty arrays produces IDENTICAL tree to assembly.create()**: both have `AllObjects, CC_AssemblyContainer, CC_AssemblyRoot, CC_ConstraintSet, CC_ExpressionSet, CC_GeometrySet, CC_PartContainer, CC_WorkCSys`

**📌 LLM doc:** `from()` empty = `assembly.create()` structurally.

## 16 — constraint type and instance field probing

Script: `scripts/16-constraint-types.mjs` — ❌ No constraint types recognized. Instance `ident` field gives different error.

**Data:** Tried constraint types: FASTENED, Fastened, fastened, FASTENED_ORIGIN, REVOLUTE, CYLINDRICAL, PLANAR, PARALLEL, SLIDER, SPHERICAL, GEAR, GROUP, FIXED, RIGID — ALL "Unknown constraint type." Instance with `ident` field got further (different error) but still failed.

## 17 — from() vs loadProduct() comparison

Script: `scripts/17-from-vs-loadProduct.mjs` — Key relationship clarified.

**Data:**
- `loadProduct()` with OFB data: ✅ Works perfectly, returns `{ id: 26 }`
- `from()` with OFB data as JSON: ❌ "Not possible to create assembly from provided stream, url or file."
- `from()` with `name` in JSON: ❌ Name is IGNORED — root is always "AssemblyRoot"
- `from()` result is the root assembly ID (same as `assembly.create()`)

**Learned:** `from()` and `loadProduct()` serve completely different purposes:
- `from()` — creates assembly from structured JSON/XML/ECXML definitions (but the format is undocumented)
- `loadProduct()` — imports OFB/STP model data as a template into an existing assembly

**📌 LLM doc:** Use `loadProduct()` to import geometry. `from()` is for structured definitions.

---

## Summary

`assembly.from` is designed to create assemblies from JSON/XML/ECXML structured definitions, but **the data format is undocumented and non-functional via the JS API**:

1. **JSON format**: Top-level `{ templates, instances, constraints }` is correct. Empty arrays work (creates empty assembly). But template, instance, and constraint entry schemas are unknown — 60+ field names tried, none work.
2. **ECXML format**: Parser exists but most XML element types are "not implemented." `<assembly>` hangs the worker.
3. **Behavior**: Clears the drawing, returns root assembly ID. With empty arrays, functionally identical to `assembly.create()`.
4. **No round-trip**: Cannot export to JSON/ECXML — `exportNode` only supports OFB/STP, `common.save` doesn't support JSON.
5. **vs loadProduct**: `loadProduct` imports OFB/STP into templates; `from` is for structured definitions.

**Recommendation:** Do NOT use `assembly.from` — use `assembly.create()` + standard assembly APIs instead.
