# Changes — part.unlinkExpression training

## New file: `references/part/unlinkExpression.md`

- Freeze behavior: param becomes plain value at expression's current value, NOT original hard-coded value
- No validation on param name (silent success for bad names)
- Idempotent: double-unlink is a silent no-op
- Unlinking a never-linked param is also silent success
- Works on both @expr. at creation and linkWithExpression bindings
- Can re-link after unlinking
