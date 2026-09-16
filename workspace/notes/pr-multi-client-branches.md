# PR texts — `multi-client` and `multi-client-annotations`

Ready-to-paste PR descriptions for every repo on the multi-client line:
classcad-runtime, classcad-cclasses, buerligons, buerli-react-cad, buerli and
buerli-modeler — plus the stacked `multi-client-annotations` branches where
they exist. Sibling-branch links at the bottom of each.

---

## classcad-runtime — `multi-client`

### Multi-client session sharing for the WebSocket server

This branch makes one ClassCAD session shareable by multiple clients. One
client (the **host**) owns the session; others (**guests**) join via invite
tokens and stay synchronized through server-side fan-out. Everything is
specified in `Source/NetworkService/docs/SessionSharing.md` (wire protocol +
buerli client API); server internals in `DrogonServer.md`.

**Contains**

- **Session join model** (`DrogonController`/`DrogonServer`): host = the
  parameterless main connection; guests connect with `?invite=<token>` (or a
  `ClassCAD-Invite` header for non-browser clients). Session ids never leave
  the server.
- **Invite management**: `CreateInvite` / `RevokeInvite` — 128-bit CSPRNG
  bearer tokens, multi-use, individually revocable, host-only, die with the
  session. Each invite carries a **role** (`edit` | `view`), reported by the
  server and enforced client-side.
- **Peer events**: `SessionJoined`, `PeerJoined`/`PeerLeft` with server-assigned
  `peerId`s; command **results fan out** to all session members so every client
  keeps a consistent model (structure broadcast stays the ordinary sync path).
- **Presence channel**: fire-and-forget ephemeral frames fanned out to session
  siblings — used for shared viewpoints (peer cameras) and peer cursors; the
  `cursor` channel name is reserved. Presence is never persisted and never
  touches the model.
- **Serializer fix**: `RapidJsonTreeWriter` now serializes KeyValueMembers
  inside array members (generic tree-protocol correctness).
- Up to date with `main` (merged).

**Explicitly not here:** model annotations (`CC_Annotation` serialization) —
they live on `multi-client-annotations` while the storage design decision
(in-model vs. userData vs. database) is open.

Siblings: [cclasses multi-client](https://dev.azure.com/awv-informatik/ClassCAD/_git/classcad-cclasses?version=GBmulti-client) ·
[buerligons](https://github.com/awv-informatik/buerligons/tree/multi-client) ·
[react-cad](https://github.com/awv-informatik/buerli-react-cad/tree/multi-client) ·
[buerli](https://github.com/awv-informatik/buerli/tree/multi-client) ·
[buerli-modeler](https://github.com/awv-informatik/buerli-modeler/tree/multi-client)

---

## classcad-runtime — `multi-client-annotations`

### Model annotations: CC_Annotation serialization (stacked on multi-client)

`multi-client` **plus** the runtime side of model annotations. Kept separate
while the annotation storage decision (in-model vs. userData vs. database) is
open — merging this branch adopts the feature, deleting it costs nothing.

**Adds on top of multi-client**

- **`CC_Annotation` entries in `filterconfig.json` / `-minimal` / `-full`** —
  serializes annotation nodes (name, class, id, flags, coordinateSystem, and
  the `entries` member) into the client structure tree. This is the whole
  runtime footprint: annotations are ordinary model objects, so persistence,
  undo and multi-client sync ride the existing structure broadcast — **no new
  sync channel, no C++ changes**.
- The annotation section in `SessionSharing.md` (why annotations are not a
  presence feature).

Requires [cclasses multi-client-annotations](https://dev.azure.com/awv-informatik/ClassCAD/_git/classcad-cclasses?version=GBmulti-client-annotations)
(the `CC_Annotation` class + `v1.annotation` API). UI:
[buerligons multi-client-annotations](https://github.com/awv-informatik/buerligons/tree/multi-client-annotations).
Workspace pins: [buerli-modeler multi-client-annotations](https://github.com/awv-informatik/buerli-modeler/tree/multi-client-annotations).

---

## classcad-cclasses — `multi-client`

### Engine-side base for the multi-client line

Deliberately thin: the multi-client collaboration features live in the runtime
(WebSocket server) and the clients — the cclasses side needs almost nothing.
This branch exists so the engine pair (cclasses + runtime) tracks the same
line.

**Contains**

- `fix(basemodeling)`: region operations **reject an all-construction
  selection** with a proper error instead of hanging (OperationsHelper +
  PartAPI test).
- Up to date with `main` (merged, incl. BrepAPI topology and v1.common.batch).

**Explicitly not here:** `CC_Annotation` / `AnnotationAPI_v1` — moved to
`multi-client-annotations` while the storage design decision is open. Note:
OFB/ccapp files saved *with* annotations during the spike will not load against
this branch (unknown class); spike files are dev-only.

Siblings: [runtime multi-client](https://dev.azure.com/awv-informatik/ClassCAD/_git/classcad-runtime?version=GBmulti-client) ·
[buerligons](https://github.com/awv-informatik/buerligons/tree/multi-client) ·
[react-cad](https://github.com/awv-informatik/buerli-react-cad/tree/multi-client) ·
[buerli](https://github.com/awv-informatik/buerli/tree/multi-client) ·
[buerli-modeler](https://github.com/awv-informatik/buerli-modeler/tree/multi-client)

---

## classcad-cclasses — `multi-client-annotations`

### Model annotations: CC_Annotation class + v1.annotation API (stacked on multi-client)

`multi-client` **plus** the engine side of model annotations — comment threads
pinned to model objects. Kept separate while the storage decision (in-model
vs. userData vs. database) is open.

**Adds on top of multi-client**

- **`CC_Annotation.cclass`**: a plain model object attached as a **child of the
  object it annotates** (containment — the parent *is* the reference; no
  reference member, no dangling pointers). Local position = its coordinate
  system, so it follows every transformation of its parent for free. Comments
  live in an `entries` array of `[author, comment, created]` rows (arrays, not
  KeyValueMembers — required by the structure protocol).
- **`AnnotationAPI_v1`** (`v1.annotation.*`, all undoable):
  - `create({ id, position?, author?, comment?, created? })` — attach to any
    object; owner-local position converted to global (correct on transformed
    assembly instances)
  - `addEntry` / `removeEntry` — append / delete by index; removing the last
    entry deletes the annotation itself
  - `remove` — delete a thread (uses `OBJ_Delete`, safe on plain objects
    inside assemblies)
- Registration: `BuerliDemoApp` (`RegisterInterface`), `ClassCadKeyApp`
  `apiClassMap` (`common` group), key-app test claims.

Because annotations are ordinary model structure, save/load, undo and
multi-client sync work without any dedicated code — see the runtime
counterpart for serialization.

Requires [runtime multi-client-annotations](https://dev.azure.com/awv-informatik/ClassCAD/_git/classcad-runtime?version=GBmulti-client-annotations)
(filterconfig serialization). UI:
[buerligons multi-client-annotations](https://github.com/awv-informatik/buerligons/tree/multi-client-annotations).
Workspace pins: [buerli-modeler multi-client-annotations](https://github.com/awv-informatik/buerli-modeler/tree/multi-client-annotations).

---

## buerligons — `multi-client`

### Collaboration UI: shared sessions, viewpoints, follow mode, peer cursors

The client-side of multi-client collaboration, built on the runtime's session
sharing and the react-cad session infrastructure.

**Contains**

- **Session sharing**: guests join via invite URL, `edit`/`view` roles
  (view-only overlay + badge: `GuestSessionOverlay`, `ViewOnlyBadge`); invite
  management lives in the react-cad `SessionManagement` plugin.
- **Shared viewpoints**: Fusion-style peer camera frustums with name tags —
  animated between presence samples, pinned to the screen border when
  off-view, placed on a ring scaled by the model bounds
  (`SharedViewpoints.tsx`).
- **Follow mode**: click a peer's name tag to look through their camera;
  banner with X to exit; cam controls gated while following
  (`FollowBanner.tsx`).
- **Peer cursors**: live pointer sharing with click animation
  (`SharedCursor.tsx`).
- **Identity colors**: every identity keyed by display name gets one tone on
  every surface — frustum, name tag, cursor, token swatch (from
  `@buerli.io/react-cad`).

**Explicitly not here:** the annotations UI — it lives on
`multi-client-annotations` while the storage design decision (in-model vs.
userData vs. database) is open.

Siblings: [react-cad](https://github.com/awv-informatik/buerli-react-cad/tree/multi-client) Â·
[buerli](https://github.com/awv-informatik/buerli/tree/multi-client) Â·
[runtime](https://dev.azure.com/awv-informatik/ClassCAD/_git/classcad-runtime?version=GBmulti-client) Â·
[cclasses](https://dev.azure.com/awv-informatik/ClassCAD/_git/classcad-cclasses?version=GBmulti-client) Â·
[buerli-modeler](https://github.com/awv-informatik/buerli-modeler/tree/multi-client)

---

## buerligons — `multi-client-annotations`

### Model annotations UI (stacked on multi-client)

`multi-client` **plus** comment threads pinned to the model.

**Adds on top of multi-client**

- **Right-click -> "Add comment"** on any part/instance: a draft marker at the
  click point, then a thread panel (name + text, Enter submits, Escape
  cancels). Deliberately allowed for view-only guests — review is their job;
  the model-edit gate is unaffected.
- **Markers pinned to geometry**: each thread is a `CC_Annotation` child of
  the product it annotates, its position owner-local — markers follow every
  move/transform without re-anchoring, persist with the file, and sync to all
  session clients through the ordinary structure broadcast.
- **Thread panel**: entries with author, timestamp and full-surface issuer
  colors (pastel identity surfaces, dark-mode aware); author name prefilled
  from the token/username identity; hover preview animation.
- **Data layer** (`src/annotations/annotations.ts`): thin wrappers over the
  engine's `v1.annotation` API + `CC_Annotation` tree parsing + draft store —
  no client-side storage, the model is the source of truth.

Requires [cclasses multi-client-annotations](https://dev.azure.com/awv-informatik/ClassCAD/_git/classcad-cclasses?version=GBmulti-client-annotations)
(class + API) and [runtime multi-client-annotations](https://dev.azure.com/awv-informatik/ClassCAD/_git/classcad-runtime?version=GBmulti-client-annotations)
(serialization).

---

## buerli-react-cad — `multi-client`

### Session infrastructure and shared identity for the component library

The reusable pieces of multi-client collaboration, hoisted out of buerligons so
every react-cad host gets them.

**Contains**

- **`SessionManagement` plugin**: the invite panel (create/revoke tokens,
  role picker, peer list with identity swatches) as a view plugin — moved here
  from buerligons; guest detection included.
- **Read-only mode for `Drawing`**: the `view` role propagates through
  `ReadOnlyContext` into the model tree, features and context menus.
- **`session/` module**: `sessionClient` (invite URL helpers, useSessionClient),
  `viewpoints` (presence-driven viewpoint + cursor stores), and
  **`identity.ts`** — the name-keyed identity-color system (`identityColors`,
  pastel bg/accent/text + solid) shared by frustums, cursors, swatches and any
  consumer (annotations use it too).
- Theme fixes (docRoot variables, panel swatch on the pastel surface).

No annotations branch here: this repo contains no annotation code — the
identity layer is shared infrastructure.

Siblings: [buerligons](https://github.com/awv-informatik/buerligons/tree/multi-client) Â·
[buerli](https://github.com/awv-informatik/buerli/tree/multi-client) Â·
[buerli-modeler](https://github.com/awv-informatik/buerli-modeler/tree/multi-client)

---

## buerli — `multi-client`

### WSClient: full Drogon protocol, invites, presence + facade accessors

The `@buerli.io/*` packages' side of multi-client: everything a client app
needs to join and drive a shared session.

**Contains**

- **`WSClient` with full Drogon WebSocket protocol support** (replaces the
  bare socket path).
- **Invite API**: `createInvite` / `revokeInvite` with roles, invite handling
  on connect.
- **Presence API**: `sendPresence`, `presence` event, `inviteName` — the
  transport under shared viewpoints and cursors.
- **`BuerliCadFacade.tree()` / `.graphic()`** (+ `useBuerliCadFacade` return):
  the structure tree and current tessellation as typed facade accessors —
  the guaranteed script surface (`api.v1` + tree + graphic) that AI/scripting
  clients rely on, off the api object itself.

No annotations branch here: no annotation code in these packages.

Siblings: [buerligons](https://github.com/awv-informatik/buerligons/tree/multi-client) Â·
[react-cad](https://github.com/awv-informatik/buerli-react-cad/tree/multi-client) Â·
[runtime](https://dev.azure.com/awv-informatik/ClassCAD/_git/classcad-runtime?version=GBmulti-client)

---

## buerli-modeler — `multi-client`

### Workspace: session-enabled modeler + submodule line-up

The umbrella repo tying the multi-client line together.

**Contains**

- **Modeler joins shared sessions**: connect via `WSClient` with the session
  invite from the URL; session sharing wired across modeler + buerli +
  react-cad + buerligons.
- **Optional ClassCAD MCP bridge** in the modeler (selection read/write for
  coding agents).
- **Submodule pins** onto the multi-client tips of buerligons, buerli and
  react-cad (examples/starter follow master).
- Up to date with `master` (merged).

`multi-client-annotations` here differs by exactly one pin: buerligons on its
annotations tip.

Siblings: all of the above.
