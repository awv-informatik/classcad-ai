# Changes — Protocol Envelope Session

## New files

### `references/common/generic.md` (NEW)

LLM documentation for the protocol envelope covering:

- Full envelope structure (5 keys: result, messages, maxLevel, structure, graphic)
- Result type mapping (id→number, VOID→null, booleans→1/0)
- Error detection via maxLevel (31=success, 51+=error)
- Message structure including undocumented `levelStr` field
- Error code catalog (1001, 1004, 1006, 1007, 1201)
- Batch envelope differences (minimal inner envelopes, continues past errors)
- Parameter passing rules (always use `[{}]` or `[]`)
- Structure/graphic field explanation

```
$ git status references/common/
Untracked files:
  references/common/

$ cat references/common/generic.md  # 118 lines, comprehensive protocol reference
```
