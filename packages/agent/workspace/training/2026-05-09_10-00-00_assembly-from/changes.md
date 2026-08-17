# Changes — assembly.from

## New file: `references/assembly/from.md`

```diff
+# assembly.from
+
+Creates an assembly from a JSON, XML, or ECXML structured definition. **Effectively unusable** — the JSON/ECXML data formats are undocumented and no working examples exist.
+
+## What It Does
+
+- **Clears the drawing** and creates a new assembly root
+- Returns the root assembly ID
+- Accepts `data` (string), `file` (local path), or `url` parameters
+- Requires `format` param when using `data` or `url` (values: `"JSON"`, `"XML"`, `"ECXML"`)
+- For `file`, format is inferred from extension (`.json`, `.xml`, `.ecxml`)
+
+## JSON Format (Partially Discovered)
+
+The top-level structure is `{ templates: [], instances: [], constraints: [] }`. Empty arrays create a valid assembly root identical to `assembly.create()`.
+
+**Template, instance, and constraint entry formats are unknown.** Adding any entry to these arrays fails with internal errors. Over 60 field name combinations were tested — none produce a valid result.
+
+## ECXML / XML Format
+
+The ECXML parser exists but most XML element types are "not implemented." Attempting to use `<assembly>` as an element **hangs the ClassCAD worker** (100% CPU, requires kill -9).
+
+## What NOT to Do
+
+- **Do not pass OFB/STP data** — `from()` explicitly rejects them
+- **Do not pass `<assembly>` element in ECXML** — causes a server hang
+- **Do not expect to export JSON/ECXML** — input-only formats
+
+## Gotchas
+
+- Clears existing drawing content
+- `name` field in JSON is ignored — root always "AssemblyRoot"
+- With empty arrays, functionally identical to `clear + create`
+- Returns result ID even on error — always check maxLevel
+
+## Use Instead: `assembly.create()` + standard APIs, or `assembly.loadProduct()` for imports
```
