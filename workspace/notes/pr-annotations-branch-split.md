# Annotations: split into `multi-client` (base) + `multi-client-annotations`

The CC_Annotation storage question (in-model vs. userData vs. database, see the
team discussion) is undecided. To keep `multi-client` mergeable without
pre-empting that decision, the annotation work now lives on a stacked branch —
**in every affected repo under the same names**:

- **`multi-client`** — the collaboration base (session sharing, shared
  viewpoints, follow mode, peer cursors, identity colors) **without**
  annotations. One removal commit per repo, nothing else changed; history was
  not rewritten.
- **`multi-client-annotations`** — base **plus** the complete annotation
  feature (`CC_Annotation` class, `v1.annotation` API, filterconfig
  serialization, buerligons UI). Technically: the removal commit followed by
  its revert, so the branch merges cleanly in both directions.

## What was removed from `multi-client`, per repo

| Repo | Removed |
|---|---|
| **classcad-cclasses** | `CC_Annotation.cclass`, `AnnotationAPI_v1.cclass`, the `RegisterInterface` line (BuerliDemoApp), the `apiClassMap` entry (ClassCadKeyApp) and the key-app test claims |
| **classcad-runtime** | The `CC_Annotation` blocks in `filterconfig.json` / `-minimal` / `-full` and the annotation section in `SessionSharing.md`. The KeyValueMember-in-array serializer fix **stays** (generic) |
| **buerligons** | `src/annotations/`, `canvas/Annotations.tsx`, the `<Annotations>` mount and the "Add comment" context-menu entry. The name-keyed identity-color system **stays** (shared with viewpoints/cursors/swatches) |
| **buerli-modeler** | Submodule pins only |

react-cad and buerli contain no annotation code and have **no** annotations
branch. All branches are up to date with their main/master.

## Working rules

- Base work → `multi-client`. Annotation work → `multi-client-annotations`.
- Keeping the annotations branch current: `git merge multi-client` — conflict-free
  (the branch re-adds the files via the revert; only rebuilding the seam lines in
  `Buerligons.tsx` / `useContextMenuItems.tsx` on the base would conflict).
- **Decision PRO annotations:** merge `multi-client-annotations` into
  `multi-client` — the revert comes along, no extra steps.
- **Decision CONTRA:** delete the branches (optionally tag the tip first); the
  base is already clean.
- ⚠️ OFB/ccapp files saved **with** annotations during the spike contain
  `CC_Annotation` objects and will not load against the base engine (unknown
  class). Spike files are dev-only; if any circulate, the fallback is keeping
  the class (without API registration) in the base.
- Branch name note: `multi-client/annotations` is impossible next to
  `multi-client` (git ref paths), hence `multi-client-annotations`.

## Branches

| Repo | base | annotations |
|---|---|---|
| classcad-cclasses | [multi-client](https://dev.azure.com/awv-informatik/ClassCAD/_git/classcad-cclasses?version=GBmulti-client) | [multi-client-annotations](https://dev.azure.com/awv-informatik/ClassCAD/_git/classcad-cclasses?version=GBmulti-client-annotations) |
| classcad-runtime | [multi-client](https://dev.azure.com/awv-informatik/ClassCAD/_git/classcad-runtime?version=GBmulti-client) | [multi-client-annotations](https://dev.azure.com/awv-informatik/ClassCAD/_git/classcad-runtime?version=GBmulti-client-annotations) |
| buerligons | [multi-client](https://github.com/awv-informatik/buerligons/tree/multi-client) | [multi-client-annotations](https://github.com/awv-informatik/buerligons/tree/multi-client-annotations) |
| buerli-modeler | [multi-client](https://github.com/awv-informatik/buerli-modeler/tree/multi-client) | [multi-client-annotations](https://github.com/awv-informatik/buerli-modeler/tree/multi-client-annotations) |
| buerli-react-cad | [multi-client](https://github.com/awv-informatik/buerli-react-cad/tree/multi-client) | — |
| buerli | [multi-client](https://github.com/awv-informatik/buerli/tree/multi-client) | — |
