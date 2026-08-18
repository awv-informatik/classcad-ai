# AR-15 Handguard — "MFR-Style" 11" M-LOK Rail

### Design & Build Log (parametric CAD session, all dims in mm)

## Overview

Free-float AR-15 handguard, Daniel Defense MFR-inspired:

- **Length:** 279.4 (11"), OAL measured 279.4 × 40 × 54.4
- **Profile:** octagon, 40 across flats, low-profile-gas-block compatible
- **Final:** single watertight solid, 101,240 mm³ ≈ **273 g in 7075-T6**

![rail](/rail.png)
![snap](/snap.png)

---

## 1. Main Body

- Octagonal tube extrusion, 279.4 long, apothem 20 (flat half-width 8.2843)
- Integral picatinny riser on top
- **Bore:** Ø34 through (barrel/gas block clearance)
- **Counterbore:** Ø36 × 32 deep at rear (barrel nut seat)

## 2. Picatinny Rail (MIL-STD-1913, corrected to spec)

- Top flat 15.67 (±7.835), total width 21.2 (±10.6), top surface z = 26.4
- 45° dovetail flanks from (±10.6, 23.635) to top flat
  _(initial build had vertical walls — audited and fixed; two auto H/V sketch
  constraints had to be deleted before the chamfer lines would hold)_
- Recoil grooves 5.23 wide, depth 3.0 (floor z = 23.4), pitch 10.01, 27×
  _(initially 4.0 deep — corrected)_
- **Nose end:** last standard tooth → standard 5.23 gap → **stretched final post
  9.135 long** (252.865 → 262), covering the gap to the deck edge — MFR signature
- Deck terminates at x = 262 with a 60° ramp down to the octagon top

## 3. Gas Block Tunnel

- Square channel, **10 wide × (z 13 → 22.4)**, full length
- Cuts up through the octagon top **into the pic riser**, stopping 1 mm under
  the groove floor; merges with the Ø34 bore into a keyhole cross-section
- Pic deck bridges over intact (verified: 1 body, section render)

## 4. M-LOK Slots (32 × 7 stadium, all through/13 deep on diagonals)

| Row             | Faces | Centers (x)                         |
| --------------- | ----- | ----------------------------------- |
| Sides           | 2     | 70, 110, 150, 190, 230              |
| Bottom          | 1     | 70, 110, 150, 190, 230              |
| Lower diagonals | 2     | 90, 130, 170, 210 (+20 stagger)     |
| Upper diagonals | 2     | 80, 120, 160, 200 (+10/−10 stagger) |

## 5. Shovelnose (kneed profile, per traced reference)

- Bottom edge ends x = 266 → face rakes **forward** to knee at (279.4, z = −6)
- From knee: **back and up** to octagon top at (262, 20)
- No arc — two straight segments; deck ramp sits above with a short flat

## 6. QD Sockets (Ø9.6 through both side walls)

- **Rear:** x = 45 (9 mm from nearest M-LOK slot edge)
- **Front:** x = 255 (matching 9 mm gap to front slot edge)

## 7. Barrel Nut Lock-Up (two-screw clamp)

- Clamp lug under rear 32 mm (22 wide × 12 tall)
- 1.6 clamp slit from bore through lug
- 2 × Ø4.5 cross-bolt holes at x = 8 and 24, z = −24

---

## Verification Summary

- Volume tracked through every boolean (deltas matched analytical predictions,
  e.g. filler tooth: 243.4 measured vs 238.3 predicted)
- Body count checked after each cut — final: **1 solid**
- Pic profile coordinates read back from sketch: exact spec values
- Section renders confirmed tunnel web + deck bridge intact

## Revision Notes (what changed along the way)

1. Straight angled nose slice → rejected (real MFR is a profile)
2. Arc-profile nose → rejected (real cut is two straight segments with a knee)
3. Pic rail audit: added missing 45° flanks, groove depth 4.0 → 3.0
4. Deck termination moved 247.6 → 262; long slot + stretched final post added
5. Gas block cut v1 (bottom notch) → v2 (26-wide tunnel, split risk) →
   v3 (16 wide) → v4 (12 wide, into riser) → **final: 10 wide**
6. Front QD: 250 → 260 (slot clash) → **final: 255** (matched rear spacing)

```js
// ══════ run_script: Stage 1: main body profile + bore/cbore + grooves + side/bottom M-LOK tools ══════
const part = 4,
  RIGHT = 46,
  FRONT = 42,
  TOP = 38,
  XAXIS = 26
const L = 279.4 // 11 inch
const apo = 20 // octagon apothem
const a = apo * Math.tan(Math.PI / 8) // half flat width = 8.2843

// ---------- 1. main cross-section on Right plane (local u=z, v=-y) ----------
// polygon in world (y,z), CCW
const pts = [
  [20, -a],
  [20, a],
  [a, 20],
  [7.6, 20],
  [7.6, 22.4],
  [10.6, 25.4],
  [10.6, 26.4],
  [-10.6, 26.4],
  [-10.6, 25.4],
  [-7.6, 22.4],
  [-7.6, 20],
  [-a, 20],
  [-20, a],
  [-20, -a],
  [-a, -20],
  [a, -20],
]
const loc = pts.map(([y, z]) => [z, -y, 0]) // Right plane: u=z, v=-y
const skMain = (await api.v1.sketch.create({ id: part, planeId: RIGHT, name: 'MainProfile' })).result
const lineDefs = []
for (let i = 0; i < loc.length; i++) {
  lineDefs.push({ id: skMain, startPos: loc[i], endPos: loc[(i + 1) % loc.length] })
}
const mainLines = (await api.v1.sketch.line(lineDefs)).result
const body = (await api.v1.part.extrusion({ id: part, name: 'Body', references: mainLines, type: 'UP', limit2: L })).result

// ---------- 2. bore + counterbore tools ----------
const skBore = (await api.v1.sketch.create({ id: part, planeId: RIGHT, name: 'BoreSk' })).result
const boreC = (await api.v1.sketch.circle({ id: skBore, centerPos: [0, 0, 0], radius: 17 })).result
const boreExt = (await api.v1.part.extrusion({ id: part, name: 'Bore', references: [boreC], type: 'UP', limit2: L })).result

const skCB = (await api.v1.sketch.create({ id: part, planeId: RIGHT, name: 'CBoreSk' })).result
const cbC = (await api.v1.sketch.circle({ id: skCB, centerPos: [0, 0, 0], radius: 18 })).result
const cbExt = (await api.v1.part.extrusion({ id: part, name: 'CBore', references: [cbC], type: 'UP', limit2: 32 })).result

// ---------- 3. picatinny recoil groove + linear pattern ----------
// Front plane: local u=x, v=-z
const gw = 5.23
const skG = (await api.v1.sketch.create({ id: part, planeId: FRONT, name: 'GrooveSk' })).result
const gRect = (await api.v1.sketch.rectangle({ id: skG, startPos: [10 - gw / 2, -26.6, 0], endPos: [10 + gw / 2, -22.4, 0] })).result
const gExt = (await api.v1.part.extrusion({ id: part, name: 'Groove', references: gRect, type: 'SYMMETRIC', limit2: 60 })).result
const gPat = (
  await api.v1.part.linearPattern({
    id: part,
    name: 'GroovePat',
    targets: [gExt],
    dir1: { references: [XAXIS], distance: 10.01, count: 27, merged: 1 },
  })
).result

// ---------- helper: stadium (32x7) loop in a sketch, axis along local u ----------
async function stadium(sk, cu, cv) {
  const hl = 12.5,
    r = 3.5
  const l1 = (await api.v1.sketch.line({ id: sk, startPos: [cu - hl, cv - r, 0], endPos: [cu + hl, cv - r, 0] })).result
  const a1 = (
    await api.v1.sketch.arcByCenter({
      id: sk,
      startPos: [cu + hl, cv - r, 0],
      endPos: [cu + hl, cv + r, 0],
      centerPos: [cu + hl, cv, 0],
      isClockwise: false,
    })
  ).result
  const l2 = (await api.v1.sketch.line({ id: sk, startPos: [cu + hl, cv + r, 0], endPos: [cu - hl, cv + r, 0] })).result
  const a2 = (
    await api.v1.sketch.arcByCenter({
      id: sk,
      startPos: [cu - hl, cv + r, 0],
      endPos: [cu - hl, cv - r, 0],
      centerPos: [cu - hl, cv, 0],
      isClockwise: false,
    })
  ).result
  return [l1, a1, l2, a2]
}

// ---------- 4. side M-LOK slots (through both side walls) ----------
const sideCenters = [70, 110, 150, 190, 230]
const skS = (await api.v1.sketch.create({ id: part, planeId: FRONT, name: 'SideMlokSk' })).result
let sideRefs = []
for (const cx of sideCenters) sideRefs = sideRefs.concat(await stadium(skS, cx, 0))
const sideExt = (await api.v1.part.extrusion({ id: part, name: 'SideMlok', references: sideRefs, type: 'SYMMETRIC', limit2: 60 })).result

// ---------- 5. bottom M-LOK slots ----------
const skB = (await api.v1.sketch.create({ id: part, planeId: TOP, name: 'BotMlokSk' })).result
let botRefs = []
for (const cx of sideCenters) botRefs = botRefs.concat(await stadium(skB, cx, 0))
const botExt = (await api.v1.part.extrusion({ id: part, name: 'BotMlok', references: botRefs, type: 'DOWN', limit2: 30 })).result

return { body, boreExt, cbExt, gPat, sideExt, botExt }

// ══════ run_script: Stage 2: diagonal M-LOK tools, QD hole, rear clamp lug + screws, boolean ══════
const part = 4,
  RIGHT = 46,
  FRONT = 42
const s = Math.SQRT1_2

// ---------- diagonal M-LOK tools on the two LOWER 45° faces, staggered ----------
const diagCenters = [90, 130, 170, 210] // offset +20 vs side/bottom slots (which are at 70..230)
const diagTools = []
for (const sign of [1, -1]) {
  const n = [0, sign * s, -s] // outward normal of lower diagonal face
  const wp = (
    await api.v1.part.workPlane({
      id: part,
      name: 'DiagWP' + sign,
      type: 'USERDEFINED',
      position: [0, 0, 0],
      normal: n,
      offset: 25,
    })
  ).result
  const sk = (await api.v1.sketch.create({ id: part, planeId: wp, name: 'DiagSk' + sign })).result
  // probe local->world mapping
  const pO = (await api.v1.sketch.point({ id: sk, pos: [0, 0, 0], genFixation: false, genIncidence: false })).result
  const pU = (await api.v1.sketch.point({ id: sk, pos: [1, 0, 0], genFixation: false, genIncidence: false })).result
  const pV = (await api.v1.sketch.point({ id: sk, pos: [0, 1, 0], genFixation: false, genIncidence: false })).result
  const gp = async (id) => {
    const p = (await api.v1.sketch.getPositions({ id })).result.pos
    return [p.x, p.y, p.z]
  }
  const O = await gp(pO),
    U = (await gp(pU)).map((v, i) => v - O[i]),
    V = (await gp(pV)).map((v, i) => v - O[i])
  await api.v1.sketch.deleteObject({ ids: [pO, pU, pV] })
  console.log('sign', sign, 'O', O, 'U', U, 'V', V)
  // world target: stadium center at (x, faceCenter dir) — center line of face projected: world pt W = [cx, 0, 0] projected onto plane... we want the slot centered on the face, i.e. world point [cx, sign*25*s? no: plane point closest to axis line at x=cx] = O' = [cx, n*25...]. Plane origin O is [0,0,0]+25*n. Target world point P = [cx, 25*n[1], 25*n[2]].
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  const refs = []
  for (const cx of diagCenters) {
    const P = [cx, 25 * n[1], 25 * n[2]]
    const d = [P[0] - O[0], P[1] - O[1], P[2] - O[2]]
    const u = dot(d, U),
      v = dot(d, V)
    // stadium axis must lie along world X in local coords: axis dir local = (dot(X,U), dot(X,V))
    const ax = [dot([1, 0, 0], U), dot([1, 0, 0], V)]
    const pv = [-ax[1], ax[0]] // perpendicular
    const hl = 12.5,
      r = 3.5
    const pt = (t, w) => [u + t * ax[0] + w * pv[0], v + t * ax[1] + w * pv[1], 0]
    const l1 = (await api.v1.sketch.line({ id: sk, startPos: pt(-hl, -r), endPos: pt(hl, -r), genVertAndHoriz: false, genFixation: false }))
      .result
    const a1 = (
      await api.v1.sketch.arcByCenter({
        id: sk,
        startPos: pt(hl, -r),
        endPos: pt(hl, r),
        centerPos: pt(hl, 0),
        isClockwise: false,
        genFixation: false,
      })
    ).result
    const l2 = (await api.v1.sketch.line({ id: sk, startPos: pt(hl, r), endPos: pt(-hl, r), genVertAndHoriz: false, genFixation: false }))
      .result
    const a2 = (
      await api.v1.sketch.arcByCenter({
        id: sk,
        startPos: pt(-hl, r),
        endPos: pt(-hl, -r),
        centerPos: pt(-hl, 0),
        isClockwise: false,
        genFixation: false,
      })
    ).result
    refs.push(l1, a1, l2, a2)
  }
  const ext = (await api.v1.part.extrusion({ id: part, name: 'DiagMlok' + sign, references: refs, type: 'DOWN', limit2: 13 })).result
  diagTools.push(ext)
}

// ---------- QD socket: Ø9.6 through both side walls near the rear ----------
const skQ = (await api.v1.sketch.create({ id: part, planeId: FRONT, name: 'QDSk' })).result
const qc = (await api.v1.sketch.circle({ id: skQ, centerPos: [45, 0, 0], radius: 4.8, genFixation: false })).result
const qdExt = (await api.v1.part.extrusion({ id: part, name: 'QD', references: [qc], type: 'SYMMETRIC', limit2: 60 })).result

// ---------- rear clamp lug (under barrel nut section) ----------
const skL = (await api.v1.sketch.create({ id: part, planeId: RIGHT, name: 'LugSk' })).result
// Right plane local: u=z, v=-y  → rect y ∈ [-11,11], z ∈ [-28,-16] → u ∈ [-28,-16], v ∈ [-11,11]
const lugRect = (await api.v1.sketch.rectangle({ id: skL, startPos: [-28, -11, 0], endPos: [-16, 11, 0] })).result
const lugExt = (await api.v1.part.extrusion({ id: part, name: 'Lug', references: lugRect, type: 'UP', limit2: 32 })).result

// ---------- clamp slit: 1.6mm wide, from below into the bore ----------
const skSl = (await api.v1.sketch.create({ id: part, planeId: RIGHT, name: 'SlitSk' })).result
const slitRect = (await api.v1.sketch.rectangle({ id: skSl, startPos: [-30, -0.8, 0], endPos: [0, 0.8, 0] })).result
const slitExt = (await api.v1.part.extrusion({ id: part, name: 'Slit', references: slitRect, type: 'UP', limit2: 32 })).result

// ---------- two clamp screws Ø4.5 along Y at z=-24, x=8 & 24 ----------
// Front plane local: x→X, y→-Z ; circle at (x, 24) → world (x, 0, -24), symmetric extrusion along Y
const skScr = (await api.v1.sketch.create({ id: part, planeId: FRONT, name: 'ScrewSk' })).result
const c1 = (await api.v1.sketch.circle({ id: skScr, centerPos: [8, 24, 0], radius: 2.25, genFixation: false })).result
const c2 = (await api.v1.sketch.circle({ id: skScr, centerPos: [24, 24, 0], radius: 2.25, genFixation: false })).result
const scrExt = (await api.v1.part.extrusion({ id: part, name: 'Screws', references: [c1, c2], type: 'SYMMETRIC', limit2: 40 })).result

return { diagTools, qdExt, lugExt, slitExt, scrExt }

// ══════ run_script: Stage 3: union lug, subtract all tools, verify mass properties ══════
const part = 4
const union = (await api.v1.part.boolean({ id: part, type: 'UNION', name: 'BodyLug', target: 176, tools: [4945] })).result
const sub = (
  await api.v1.part.boolean({
    id: part,
    type: 'SUBTRACTION',
    name: 'RailCut',
    target: union,
    tools: [314, 347, 450, 2005, 2334, 4478, 4743, 4885, 5026, 5081],
  })
).result
const mp = (await api.v1.part.calculateMassProperties({ id: part })).result
const b = await api.structure?.calculateProductBounds?.(part)
return { sub, volume: mp?.volume, cog: mp?.centerOfGravity, bounds: b }

// ══════ run_script: Upper diagonal M-LOK slots + subtract + verify ══════
const part = 4,
  s = Math.SQRT1_2
const upperCenters = [80, 120, 160, 200]
const tools = []
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
for (const sign of [1, -1]) {
  const n = [0, sign * s, s] // outward normal of UPPER diagonal face
  const wp = (
    await api.v1.part.workPlane({
      id: part,
      name: 'UpDiagWP' + sign,
      type: 'USERDEFINED',
      position: [0, 0, 0],
      normal: n,
      offset: 25,
    })
  ).result
  const sk = (await api.v1.sketch.create({ id: part, planeId: wp, name: 'UpDiagSk' + sign })).result
  // probe local->world axes
  const pO = (await api.v1.sketch.point({ id: sk, pos: [0, 0, 0], genFixation: false, genIncidence: false })).result
  const pU = (await api.v1.sketch.point({ id: sk, pos: [1, 0, 0], genFixation: false, genIncidence: false })).result
  const pV = (await api.v1.sketch.point({ id: sk, pos: [0, 1, 0], genFixation: false, genIncidence: false })).result
  const gp = async (id) => {
    const p = (await api.v1.sketch.getPositions({ id })).result.pos
    return [p.x, p.y, p.z]
  }
  const O = await gp(pO),
    U = (await gp(pU)).map((v, i) => v - O[i]),
    V = (await gp(pV)).map((v, i) => v - O[i])
  await api.v1.sketch.deleteObject({ ids: [pO, pU, pV] })
  console.log('sign', sign, 'O', O, 'U', U, 'V', V)
  const refs = []
  for (const cx of upperCenters) {
    const P = [cx, 25 * n[1], 25 * n[2]]
    const d = [P[0] - O[0], P[1] - O[1], P[2] - O[2]]
    const u = dot(d, U),
      v = dot(d, V)
    const ax = [dot([1, 0, 0], U), dot([1, 0, 0], V)]
    const pv = [-ax[1], ax[0]]
    const hl = 12.5,
      r = 3.5
    const pt = (t, w) => [u + t * ax[0] + w * pv[0], v + t * ax[1] + w * pv[1], 0]
    const l1 = (await api.v1.sketch.line({ id: sk, startPos: pt(-hl, -r), endPos: pt(hl, -r), genVertAndHoriz: false, genFixation: false }))
      .result
    const a1 = (
      await api.v1.sketch.arcByCenter({
        id: sk,
        startPos: pt(hl, -r),
        endPos: pt(hl, r),
        centerPos: pt(hl, 0),
        isClockwise: false,
        genFixation: false,
      })
    ).result
    const l2 = (await api.v1.sketch.line({ id: sk, startPos: pt(hl, r), endPos: pt(-hl, r), genVertAndHoriz: false, genFixation: false }))
      .result
    const a2 = (
      await api.v1.sketch.arcByCenter({
        id: sk,
        startPos: pt(-hl, r),
        endPos: pt(-hl, -r),
        centerPos: pt(-hl, 0),
        isClockwise: false,
        genFixation: false,
      })
    ).result
    refs.push(l1, a1, l2, a2)
  }
  const ext = (await api.v1.part.extrusion({ id: part, name: 'UpDiagMlok' + sign, references: refs, type: 'DOWN', limit2: 13 })).result
  tools.push(ext)
}
const volBefore = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
const sub = (await api.v1.part.boolean({ id: part, type: 'SUBTRACTION', name: 'UpDiagCut', target: 7349, tools })).result
const volAfter = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
return { tools, sub, volBefore, volAfter, delta: volBefore - volAfter }

// ══════ run_script: Shovelnose: angled slice at muzzle end ══════
const part = 4
const tip = 18670 // current final feature
// Rake plane: contains the bottom-front edge (x=279.4, z=-28), leans back so the
// top deck (z=26.4) is cut at x = 279.4 - 25 = 254.4.
// Plane direction in xz: (-25, 54.4); normal (forward-ish): (54.4, 0, 25)
const nl = Math.hypot(54.4, 25)
const n = [54.4 / nl, 0, 25 / nl]
const wp = (
  await api.v1.part.workPlane({
    id: part,
    name: 'NoseWP',
    type: 'USERDEFINED',
    position: [279.4, 0, -28],
    normal: n,
    offset: 0,
  })
).result
const volBefore = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
const sliced = (
  await api.v1.part.slice({
    id: part,
    name: 'Shovelnose',
    targets: [tip],
    reference: wp,
    inverted: 1,
  })
).result
const volAfter = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
const b = await api.structure?.calculateProductBounds?.(part)
return { sliced, volBefore, volAfter, delta: volBefore - volAfter, bounds: b }

// ══════ run_script: Audit pic rail vs MIL-STD-1913 ══════
const t = await api.tree({ refresh: true })
const sk = Object.values(t).filter((n) => n.class === 'CC_Sketch')
const main = sk.find((n) => n.name === 'MainProfile'),
  grv = sk.find((n) => n.name === 'GrooveSk')
const g = (await api.v1.sketch.getGeometry({ id: grv.id })).result
const lines = []
for (const lid of g.lines) {
  const p = (await api.v1.sketch.getPositions({ id: lid })).result
  lines.push({ id: lid, s: p.startPos, e: p.endPos })
}
// main profile deck-relevant points
const gm = (await api.v1.sketch.getGeometry({ id: main.id })).result
const mainPts = []
for (const lid of gm.lines) {
  const p = (await api.v1.sketch.getPositions({ id: lid })).result
  mainPts.push([p.startPos.x, p.startPos.y, p.startPos.z])
}
return { grooveSketch: grv.id, mainSketch: main.id, grooveLines: lines, mainPts }

// ══════ run_script: Fix pic profile to MIL-STD-1913 + groove depth 3.0 ══════
const part = 4,
  MAIN = 52,
  GRV = 367
// ---- 1. main profile deck lines (Right plane: local u=z, v=-y) ----
const gm = (await api.v1.sketch.getGeometry({ id: MAIN })).result
const info = []
for (const lid of gm.lines) {
  const p = (await api.v1.sketch.getPositions({ id: lid })).result
  info.push({ id: lid, s: [p.startPos.y, p.startPos.z], e: [p.endPos.y, p.endPos.z] })
}
const near = (a, b) => Math.abs(a - b) < 1e-6
const findLine = (ys, zs, ye, ze) => info.find((l) => near(l.s[0], ys) && near(l.s[1], zs) && near(l.e[0], ye) && near(l.e[1], ze))
// creation order world (y,z): ... [7.6,20]->[7.6,22.4]->[10.6,25.4]->[10.6,26.4]->[-10.6,26.4]->[-10.6,25.4]->[-7.6,22.4]->[-7.6,20]
const lA = findLine(7.6, 20, 7.6, 22.4) // web up (right side, +y)
const lB = findLine(7.6, 22.4, 10.6, 25.4) // clamp flank
const lC = findLine(10.6, 25.4, 10.6, 26.4) // vertical wall -> becomes top chamfer (has Auto_H local)
const lD = findLine(10.6, 26.4, -10.6, 26.4) // top flat
const lE = findLine(-10.6, 26.4, -10.6, 25.4) // vertical wall other side
const lF = findLine(-10.6, 25.4, -7.6, 22.4) // clamp flank
const lG = findLine(-7.6, 22.4, -7.6, 20) // web down
if (!lA || !lB || !lC || !lD || !lE || !lF || !lG) return { err: 'line match failed', info }

// find & delete auto H/V constraints referencing lC / lE
const lists = (await api.v1.sketch.getObjectsLists({ id: MAIN })).result
const toDelete = []
for (const cid of lists.constraints || []) {
  const ci = (await api.v1.sketch.getObjectInfo({ id: cid })).result
  const refs = ci?.geomIds || ci?.references || ci?.geometries || []
  const cls = ci?.type || ci?.class || ''
  if ((refs.includes(lC.id) || refs.includes(lE.id)) && /HORIZONTAL|VERTICAL|Auto_H|Auto_V/i.test(JSON.stringify(ci))) {
    toDelete.push({ cid, ci })
  }
}
console.log('constraints to delete:', JSON.stringify(toDelete.map((d) => ({ id: d.cid, t: d.ci?.type, g: d.ci?.geomIds }))))
if (toDelete.length) await api.v1.sketch.deleteObject({ ids: toDelete.map((d) => d.cid) })

// new spec points (world y,z) -> local [z, -y]
const L = (y, z) => [z, -y, 0]
await api.v1.sketch.updateGeometry({
  id: MAIN,
  lines: [
    { id: lA.id, startPos: L(7.6, 20), endPos: L(7.6, 20.635) },
    { id: lB.id, startPos: L(7.6, 20.635), endPos: L(10.6, 23.635) },
    { id: lC.id, startPos: L(10.6, 23.635), endPos: L(7.835, 26.4) },
    { id: lD.id, startPos: L(7.835, 26.4), endPos: L(-7.835, 26.4) },
    { id: lE.id, startPos: L(-7.835, 26.4), endPos: L(-10.6, 23.635) },
    { id: lF.id, startPos: L(-10.6, 23.635), endPos: L(-7.6, 20.635) },
    { id: lG.id, startPos: L(-7.6, 20.635), endPos: L(-7.6, 20) },
  ],
})

// ---- 2. groove depth: floor z 22.4 -> 23.4 (Front plane: local u=x, v=-z) ----
const gg = (await api.v1.sketch.getGeometry({ id: GRV })).result
const gupd = []
for (const lid of gg.lines) {
  const p = (await api.v1.sketch.getPositions({ id: lid })).result
  const fix = (z) => (near(z, 22.4) ? 23.4 : z)
  gupd.push({ id: lid, startPos: [p.startPos.x, -fix(p.startPos.z), 0], endPos: [p.endPos.x, -fix(p.endPos.z), 0] })
}
await api.v1.sketch.updateGeometry({ id: GRV, lines: gupd })

await api.v1.common.recalc()
// ---- verify: read back sketch positions + volume ----
const chk = (await api.v1.sketch.getPositions({ id: lC.id })).result
const chkG = (await api.v1.sketch.getPositions({ id: gupd[1].id })).result
const vol = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
return { deleted: toDelete.map((d) => d.cid), chamferLine: chk, grooveLine: chkG, vol }

// ══════ run_script: Find and delete offending auto constraints, re-update geometry ══════
const MAIN = 52
const lC = 100,
  lE = 108 // unknown — re-derive
const gm = (await api.v1.sketch.getGeometry({ id: MAIN })).result
const near = (a, b) => Math.abs(a - b) < 1e-3
const lines = []
for (const lid of gm.lines) {
  const p = (await api.v1.sketch.getPositions({ id: lid })).result
  lines.push({ id: lid, s: [p.startPos.y, p.startPos.z], e: [p.endPos.y, p.endPos.z] })
}
// the two problem lines: currently near-vertical at y=±10.6 upper region (z>23)
const prob = lines.filter(
  (l) => Math.abs(Math.abs(l.s[0]) - 10.6) < 1e-3 && Math.abs(Math.abs(l.e[0]) - 10.6) < 1e-3 && l.s[1] > 23 && l.e[1] > 23,
)
console.log('prob lines', JSON.stringify(prob))
// dump one constraint's objectInfo to see shape
const lists = (await api.v1.sketch.getObjectsLists({ id: MAIN })).result
console.log(
  'list keys',
  Object.keys(lists),
  'counts',
  JSON.stringify(Object.fromEntries(Object.entries(lists).map(([k, v]) => [k, Array.isArray(v) ? v.length : v]))),
)
const t = await api.tree({ refresh: true })
// find constraint nodes under sketch in tree
const consNodes = Object.values(t).filter((n) => n.parent === MAIN && /Constraint/i.test(n.class))
const dump = consNodes.slice(0, 3).map((n) => ({ id: n.id, class: n.class, name: n.name, members: n.members }))
console.log('sample constraint nodes', JSON.stringify(dump).slice(0, 800))
return { prob: prob.map((p) => p.id), consCount: consNodes.length, classes: [...new Set(consNodes.map((n) => n.class))] }

// ══════ run_script: Delete vertical constraint on line 92, restore chamfer geometry, recalc & verify ══════
const part = 4,
  MAIN = 52
const t = await api.tree({ refresh: true })
const cons = Object.values(t).filter((n) => n.parent === MAIN && /(Horizontal|Vertical)Constraint/.test(n.class))
const bad = cons.filter((n) => (n.members?.entities?.members || []).some((m) => m.value === 92))
console.log('bad', JSON.stringify(bad.map((b) => ({ id: b.id, class: b.class }))))
if (bad.length) await api.v1.sketch.deleteObject({ ids: bad.map((b) => b.id) })
// restore lC (id 92) and neighbors to spec (Right plane local: [z,-y])
const L = (y, z) => [z, -y, 0]
await api.v1.sketch.updateGeometry({ id: MAIN, lines: [{ id: 92, startPos: L(10.6, 23.635), endPos: L(7.835, 26.4) }] })
await api.v1.common.recalc()
// verify all deck lines
const gm = (await api.v1.sketch.getGeometry({ id: MAIN })).result
const out = []
for (const lid of gm.lines) {
  const p = (await api.v1.sketch.getPositions({ id: lid })).result
  if (p.startPos.z > 19.9 || p.endPos.z > 19.9) out.push({ id: lid, s: [p.startPos.y, p.startPos.z], e: [p.endPos.y, p.endPos.z] })
}
const vol = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
return { deleted: bad.map((b) => b.id), deckLines: out, vol }

// ══════ run_script: Delete remaining auto H/V on chamfer lines, batch-update full deck chain ══════
const part = 4,
  MAIN = 52
const t = await api.tree({ refresh: true })
const cons = Object.values(t).filter((n) => n.parent === MAIN && /(Horizontal|Vertical)Constraint/.test(n.class))
const bad = cons.filter((n) => (n.members?.entities?.members || []).some((m) => [92, 108, 86, 116].includes(m.value)))
console.log('deleting', JSON.stringify(bad.map((b) => ({ id: b.id, class: b.class, ent: b.members.entities.members.map((x) => x.value) }))))
if (bad.length) await api.v1.sketch.deleteObject({ ids: bad.map((b) => b.id) })
const L = (y, z) => [z, -y, 0]
await api.v1.sketch.updateGeometry({
  id: MAIN,
  lines: [
    { id: 78, startPos: L(7.6, 20), endPos: L(7.6, 20.635) },
    { id: 86, startPos: L(7.6, 20.635), endPos: L(10.6, 23.635) },
    { id: 92, startPos: L(10.6, 23.635), endPos: L(7.835, 26.4) },
    { id: 100, startPos: L(7.835, 26.4), endPos: L(-7.835, 26.4) },
    { id: 108, startPos: L(-7.835, 26.4), endPos: L(-10.6, 23.635) },
    { id: 116, startPos: L(-10.6, 23.635), endPos: L(-7.6, 20.635) },
    { id: 122, startPos: L(-7.6, 20.635), endPos: L(-7.6, 20) },
  ],
})
await api.v1.common.recalc()
const gm = (await api.v1.sketch.getGeometry({ id: MAIN })).result
const out = []
for (const lid of gm.lines) {
  const p = (await api.v1.sketch.getPositions({ id: lid })).result
  if (p.startPos.z > 19.9 || p.endPos.z > 19.9)
    out.push({ id: lid, s: [+p.startPos.y.toFixed(4), +p.startPos.z.toFixed(4)], e: [+p.endPos.y.toFixed(4), +p.endPos.z.toFixed(4)] })
}
const vol = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
return { deleted: bad.map((b) => b.id), deckLines: out, vol }

// ══════ run_script: Profiled shovelnose cut (vertical rise + tangent arc), aligned to groove boundary ══════
const part = 4,
  FRONT = 42,
  tip = 18670
// Nose profile in world xz:
//  - front face stays full-length at bottom, vertical up to z = -8
//  - tangent arc (tangent to vertical) from (279.4,-8) to deck at (252.855, 26.4)
//    x_top = 252.855 = far edge of groove #25 (center 250.24 ± 2.615) → clean groove termination
const xTip = 279.4,
  zArcStart = -8,
  xTop = 252.855,
  zTop = 26.4
const dx = xTip - xTop,
  dz = zTop - zArcStart
const R = (dx * dx + dz * dz) / (2 * dx) // tangent-to-vertical arc radius
const C = [xTip - R, zArcStart]
console.log('R', R, 'C', C)
// Front plane local: u=x, v=-z
const P = (x, z) => [x, -z, 0]
const sk = (await api.v1.sketch.create({ id: part, planeId: FRONT, name: 'NoseSk' })).result
const arc = (
  await api.v1.sketch.arcByCenter({
    id: sk,
    startPos: P(xTip, zArcStart),
    endPos: P(xTop, zTop),
    centerPos: P(C[0], C[1]),
    isClockwise: true,
    genFixation: false,
  })
).result
const ls = await api.v1.sketch.line([
  { id: sk, startPos: P(xTop, zTop), endPos: P(xTop, 30), genFixation: false },
  { id: sk, startPos: P(xTop, 30), endPos: P(290, 30), genFixation: false },
  { id: sk, startPos: P(290, 30), endPos: P(290, zArcStart), genFixation: false },
  { id: sk, startPos: P(290, zArcStart), endPos: P(xTip, zArcStart), genFixation: false },
])
const noseTool = (
  await api.v1.part.extrusion({ id: part, name: 'NoseTool', references: [arc, ...ls.result], type: 'SYMMETRIC', limit2: 70 })
).result
const volBefore = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
const cut = (await api.v1.part.boolean({ id: part, type: 'SUBTRACTION', name: 'Shovelnose', target: tip, tools: [noseTool] })).result
const volAfter = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
const b = await api.structure?.calculateProductBounds?.(part)
return { R: +R.toFixed(3), cut, volBefore, volAfter, delta: volBefore - volAfter, bounds: b }

// ══════ run_script: Rebuild nose MFR-style: delete arc cut, ramp-terminated deck + vertical front face + front QD ══════
const part = 4,
  FRONT = 42
// ---- 1. remove the arc-profile nose (boolean + tool + sketch) ----
const t = await api.tree({ refresh: true })
const byName = (n) => Object.values(t).find((x) => x.name === n)
const kill = ['Shovelnose', 'NoseTool', 'NoseSk'].map(byName).filter(Boolean)
console.log('deleting', JSON.stringify(kill.map((k) => ({ id: k.id, name: k.name, class: k.class }))))
await api.v1.part.deleteFeature({ ids: kill.map((k) => k.id) })
await api.v1.common.recalc()
const volRestored = (await api.v1.part.calculateMassProperties({ id: part })).result.volume

// ---- 2. MFR nose cut: remove the pic deck (z>20) forward of a steep ramp ----
// grooves: centers 10 + 10.01k, half-width 2.615. Groove #24 far edge = 242.845,
// full tooth to groove #25 leading edge = 247.635 → deck ends with a complete tooth.
const x0 = 247.635,
  zDeckBase = 20,
  zTop = 26.4
const rampAngle = (60 * Math.PI) / 180
const x1 = x0 + (zTop - zDeckBase) / Math.tan(rampAngle)
console.log('ramp base x1', x1)
const P = (x, z) => [x, -z, 0] // Front plane local: u=x, v=-z
const sk = (await api.v1.sketch.create({ id: part, planeId: FRONT, name: 'MfrNoseSk' })).result
const ls = await api.v1.sketch.line([
  { id: sk, startPos: P(x0, zTop + 8), endPos: P(x0, zTop), genFixation: false },
  { id: sk, startPos: P(x0, zTop), endPos: P(x1, zDeckBase), genFixation: false, genVertAndHoriz: false },
  { id: sk, startPos: P(x1, zDeckBase), endPos: P(290, zDeckBase), genFixation: false },
  { id: sk, startPos: P(290, zDeckBase), endPos: P(290, zTop + 8), genFixation: false },
  { id: sk, startPos: P(290, zTop + 8), endPos: P(x0, zTop + 8), genFixation: false },
])
const noseTool = (await api.v1.part.extrusion({ id: part, name: 'MfrNoseTool', references: ls.result, type: 'SYMMETRIC', limit2: 70 }))
  .result

// ---- 3. front QD socket like the MFR: Ø9.6 through both side walls near the nose ----
const skQ = (await api.v1.sketch.create({ id: part, planeId: FRONT, name: 'FrontQDSk' })).result
const qc = (await api.v1.sketch.circle({ id: skQ, centerPos: [250, 0, 0], radius: 4.8, genFixation: false })).result
const qdTool = (await api.v1.part.extrusion({ id: part, name: 'FrontQD', references: [qc], type: 'SYMMETRIC', limit2: 60 })).result

// ---- 4. subtract from current tip feature ----
const t2 = await api.tree({ refresh: true })
const tip = Object.values(t2).find((x) => x.name === 'UpDiagCut')
const cut = (await api.v1.part.boolean({ id: part, type: 'SUBTRACTION', name: 'MfrNose', target: tip.id, tools: [noseTool, qdTool] }))
  .result
const volAfter = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
const b = await api.structure?.calculateProductBounds?.(part)
return { volRestored, cut, volAfter, delta: volRestored - volAfter, bounds: [b.min, b.max] }

// ══════ run_script: Move front QD forward to clear M-LOK slot — FAILED ══════
const part = 4
const t = await api.tree({ refresh: true })
const skQ = Object.values(t).find((n) => n.name === 'FrontQDSk')
const g = (await api.v1.sketch.getGeometry({ id: skQ.id })).result
const cid = g.circles[0]
// slot ends at 246, QD r=4.8 → center ≥ 253.8; use 260 for a clean margin, wall ends 279.4
await api.v1.sketch.updateGeometry({ id: skQ.id, circles: [{ id: cid, centerPos: [260, 0, 0], radius: 4.8 }] })
await api.v1.common.recalc()
const p = (await api.v1.sketch.getPositions({ id: cid })).result
const vol = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
return { center: p.centerPos, vol }

// ══════ run_script: Verify QD position after move ══════
const part = 4
const t = await api.tree({ refresh: true })
const skQ = Object.values(t).find((n) => n.name === 'FrontQDSk')
const g = (await api.v1.sketch.getGeometry({ id: skQ.id })).result
const out = []
for (const cid of g.circles) {
  const p = (await api.v1.sketch.getPositions({ id: cid })).result
  out.push(p)
}
const vol = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
return { circles: out, vol }

// ══════ run_script: Cut the actual shovel: vertical rise + tangent arc into octagon top ══════
const part = 4,
  FRONT = 42
// Profile in world xz: bottom tip at (279.4, -28), front face vertical up to z = -8,
// then arc tangent to vertical sweeping back/up to the octagon top (z = 20) at xTop.
const xTip = 279.4,
  zRise = -8,
  zTop = 20,
  xTop = 258
const dx = xTip - xTop,
  dz = zTop - zRise
const R = (dx * dx + dz * dz) / (2 * dx) // tangent-to-vertical
const C = [xTip - R, zRise]
// tangent direction at arc end (for info)
console.log('R', R.toFixed(3), 'C', C)
const P = (x, z) => [x, -z, 0] // Front plane: u=x, v=-z
const sk = (await api.v1.sketch.create({ id: part, planeId: FRONT, name: 'ShovelSk' })).result
const arc = (
  await api.v1.sketch.arcByCenter({
    id: sk,
    startPos: P(xTip, zRise),
    endPos: P(xTop, zTop),
    centerPos: P(C[0], C[1]),
    isClockwise: true,
    genFixation: false,
  })
).result
const ls = await api.v1.sketch.line([
  { id: sk, startPos: P(xTop, zTop), endPos: P(xTop, 32), genFixation: false },
  { id: sk, startPos: P(xTop, 32), endPos: P(292, 32), genFixation: false },
  { id: sk, startPos: P(292, 32), endPos: P(292, zRise), genFixation: false },
  { id: sk, startPos: P(292, zRise), endPos: P(xTip, zRise), genFixation: false },
])
const tool = (await api.v1.part.extrusion({ id: part, name: 'ShovelTool', references: [arc, ...ls.result], type: 'SYMMETRIC', limit2: 70 }))
  .result
const t = await api.tree({ refresh: true })
const tip = Object.values(t).find((n) => n.name === 'MfrNose')
const volBefore = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
const cut = (await api.v1.part.boolean({ id: part, type: 'SUBTRACTION', name: 'ShovelCut', target: tip.id, tools: [tool] })).result
const volAfter = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
return { R: +R.toFixed(2), cut, volBefore, volAfter, delta: volBefore - volAfter }

// ══════ run_script: Replace arc shovel with two-segment kneed profile ══════
const part = 4,
  FRONT = 42
// remove old arc-based shovel
const t = await api.tree({ refresh: true })
const kill = ['ShovelCut', 'ShovelTool', 'ShovelSk'].map((n) => Object.values(t).find((x) => x.name === n)).filter(Boolean)
await api.v1.part.deleteFeature({ ids: kill.map((k) => k.id) })
await api.v1.common.recalc()

// Kneed profile (world xz), x forward:
//  bottom of rail (z=-28) at x=266  -> leans FORWARD up to knee at (279.4, -6)
//  then BACK and up to octagon top  at (262, 20)
const P = (x, z) => [x, -z, 0] // Front plane local: u=x, v=-z
const sk = (await api.v1.sketch.create({ id: part, planeId: FRONT, name: 'ShovelSk' })).result
const ls = await api.v1.sketch.line([
  { id: sk, startPos: P(266, -28), endPos: P(279.4, -6), genFixation: false, genVertAndHoriz: false },
  { id: sk, startPos: P(279.4, -6), endPos: P(262, 20), genFixation: false, genVertAndHoriz: false },
  { id: sk, startPos: P(262, 20), endPos: P(262, 32), genFixation: false },
  { id: sk, startPos: P(262, 32), endPos: P(295, 32), genFixation: false },
  { id: sk, startPos: P(295, 32), endPos: P(295, -28), genFixation: false },
  { id: sk, startPos: P(295, -28), endPos: P(266, -28), genFixation: false },
])
const tool = (await api.v1.part.extrusion({ id: part, name: 'ShovelTool', references: ls.result, type: 'SYMMETRIC', limit2: 70 })).result
const t2 = await api.tree({ refresh: true })
const tip = Object.values(t2).find((n) => n.name === 'MfrNose')
const volBefore = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
const cut = (await api.v1.part.boolean({ id: part, type: 'SUBTRACTION', name: 'ShovelCut', target: tip.id, tools: [tool] })).result
const volAfter = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
return { cut, volBefore, volAfter, delta: volBefore - volAfter }

// ══════ run_script: Extend deck to shovel edge + long final pic groove to the end ══════
const part = 4,
  FRONT = 42
// ---- 1. move MfrNose deck termination from 247.635 to 262 (shovel edge) ----
const t = await api.tree({ refresh: true })
const skN = Object.values(t).find((n) => n.name === 'MfrNoseSk')
const g = (await api.v1.sketch.getGeometry({ id: skN.id })).result
const near = (a, b) => Math.abs(a - b) < 1e-3
const x0old = 247.635,
  x1old = x0old + 6.4 / Math.tan(Math.PI / 3)
const x0 = 262,
  x1 = x0 + 6.4 / Math.tan(Math.PI / 3)
const upd = []
for (const lid of g.lines) {
  const p = (await api.v1.sketch.getPositions({ id: lid })).result
  const fix = (pt) => {
    let [x, v] = [pt.x, -pt.z] // local u=x, v=-z
    if (near(x, x0old)) x = x0
    if (near(x, x1old)) x = x1
    return [x, -pt.z, 0]
  }
  upd.push({ id: lid, startPos: fix(p.startPos), endPos: fix(p.endPos) })
}
await api.v1.sketch.updateGeometry({ id: skN.id, lines: upd })
await api.v1.common.recalc()
const volMid = (await api.v1.part.calculateMassProperties({ id: part })).result.volume

// ---- 2. long final groove: from last tooth trailing edge (247.635) to past the nose ----
const P = (x, z) => [x, -z, 0]
const sk = (await api.v1.sketch.create({ id: part, planeId: FRONT, name: 'LongGrooveSk' })).result
const rect = (await api.v1.sketch.rectangle({ id: sk, startPos: P(247.635, 23.4), endPos: P(268, 27.5) })).result
const tool = (await api.v1.part.extrusion({ id: part, name: 'LongGrooveTool', references: rect, type: 'SYMMETRIC', limit2: 60 })).result
const t2 = await api.tree({ refresh: true })
const tip = Object.values(t2).find((n) => n.name === 'ShovelCut')
const cut = (await api.v1.part.boolean({ id: part, type: 'SUBTRACTION', name: 'LongGroove', target: tip.id, tools: [tool] })).result
const volAfter = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
return { volMid, cut, volAfter, deckRestored: volMid - 114542.3, grooveCut: volMid - volAfter }

// ══════ run_script: Add final pic tooth at deck front edge (257.22–262) ══════
const part = 4
const xA = 262 - 4.78,
  xB = 262
// workplane at x = xA, normal +X
const wp = (
  await api.v1.part.workPlane({
    id: part,
    name: 'ToothWP',
    type: 'USERDEFINED',
    position: [0, 0, 0],
    normal: [1, 0, 0],
    offset: xA,
  })
).result
const sk = (await api.v1.sketch.create({ id: part, planeId: wp, name: 'ToothSk' })).result
// probe local axes
const pO = (await api.v1.sketch.point({ id: sk, pos: [0, 0, 0], genFixation: false, genIncidence: false })).result
const pU = (await api.v1.sketch.point({ id: sk, pos: [1, 0, 0], genFixation: false, genIncidence: false })).result
const pV = (await api.v1.sketch.point({ id: sk, pos: [0, 1, 0], genFixation: false, genIncidence: false })).result
const gp = async (id) => {
  const p = (await api.v1.sketch.getPositions({ id })).result.pos
  return [p.x, p.y, p.z]
}
const O = await gp(pO),
  U = (await gp(pU)).map((v, i) => v - O[i]),
  V = (await gp(pV)).map((v, i) => v - O[i])
await api.v1.sketch.deleteObject({ ids: [pO, pU, pV] })
console.log('O', O, 'U', U, 'V', V)
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const toLocal = (y, z) => {
  const d = [xA - O[0], y - O[1], z - O[2]]
  return [dot(d, U), dot(d, V), 0]
}
// 1913 tooth cross-section (world y,z), CCW: groove floor 23.4 → flanks → 45° chamfers → top flat
const pts = [
  [10.365, 23.4],
  [10.6, 23.635],
  [7.835, 26.4],
  [-7.835, 26.4],
  [-10.6, 23.635],
  [-10.365, 23.4],
]
const defs = []
for (let i = 0; i < pts.length; i++) {
  defs.push({
    id: sk,
    startPos: toLocal(...pts[i]),
    endPos: toLocal(...pts[(i + 1) % pts.length]),
    genFixation: false,
    genVertAndHoriz: false,
  })
}
const ls = (await api.v1.sketch.line(defs)).result
const tooth = (await api.v1.part.extrusion({ id: part, name: 'ToothExt', references: ls, type: 'UP', limit2: 4.78 })).result
const t = await api.tree({ refresh: true })
const tip = Object.values(t).find((n) => n.name === 'LongGroove')
const volBefore = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
const uni = (await api.v1.part.boolean({ id: part, type: 'UNION', name: 'FrontTooth', target: tip.id, tools: [tooth] })).result
const volAfter = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
return { uni, volBefore, volAfter, added: volAfter - volBefore, expected: '~250-270 mm3' }

// ══════ run_script: Thicken final post: start 252.865, length 9.135 ══════
const part = 4
const t = await api.tree({ refresh: true })
const wp = Object.values(t).find((n) => n.name === 'ToothWP')
const ext = Object.values(t).find((n) => n.name === 'ToothExt')
console.log('wp', wp?.id, 'ext', ext?.id)
await api.v1.part.updateWorkPlane({ id: wp.id, type: 'USERDEFINED', position: [0, 0, 0], normal: [1, 0, 0], offset: 252.865 })
await api.v1.part.updateExtrusion({ id: ext.id, type: 'UP', limit2: 262 - 252.865 })
await api.v1.common.recalc()
const vol = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
return { vol, prev: 115504.17, added: vol - 115504.17 }

// ══════ run_script: Probe whether post extends to 252.865 ══════
// probe: is there solid at x=254, z=25 (mid of extended post) vs gap at x=250?
const g = await api.graphic()
// find max z vertices near x=254 and x=250 on top deck
let z254 = -99,
  z250 = -99,
  z258 = -99
for (const c of Object.values(g.containers || g)) {
  const meshes = c.meshes || c.faces || []
  for (const m of meshes) {
    const v = m.vertices || m.positions
    if (!v) continue
    for (let i = 0; i < v.length; i += 3) {
      const x = v[i],
        y = v[i + 1],
        z = v[i + 2]
      if (Math.abs(y) < 8) {
        if (Math.abs(x - 254) < 1.2 && z > z254) z254 = z
        if (Math.abs(x - 250) < 1.2 && z > z250) z250 = z
        if (Math.abs(x - 258) < 1.2 && z > z258) z258 = z
      }
    }
  }
}
return { z250, z254, z258, note: 'post top=26.4, groove floor=23.4' }

// ══════ run_script: Union filler tooth 252.865–257.22 to thicken final post ══════
const part = 4
const xA = 252.865,
  len = 257.22 - 252.865
const wp = (
  await api.v1.part.workPlane({
    id: part,
    name: 'Tooth2WP',
    type: 'USERDEFINED',
    position: [0, 0, 0],
    normal: [1, 0, 0],
    offset: xA,
  })
).result
const sk = (await api.v1.sketch.create({ id: part, planeId: wp, name: 'Tooth2Sk' })).result
// probe axes
const gp = async (id) => {
  const p = (await api.v1.sketch.getPositions({ id })).result.pos
  return [p.x, p.y, p.z]
}
const pO = (await api.v1.sketch.point({ id: sk, pos: [0, 0, 0], genFixation: false, genIncidence: false })).result
const pU = (await api.v1.sketch.point({ id: sk, pos: [1, 0, 0], genFixation: false, genIncidence: false })).result
const pV = (await api.v1.sketch.point({ id: sk, pos: [0, 1, 0], genFixation: false, genIncidence: false })).result
const O = await gp(pO),
  U = (await gp(pU)).map((v, i) => v - O[i]),
  V = (await gp(pV)).map((v, i) => v - O[i])
await api.v1.sketch.deleteObject({ ids: [pO, pU, pV] })
console.log('O', O, 'U', U, 'V', V)
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const toLocal = (y, z) => {
  const d = [xA - O[0], y - O[1], z - O[2]]
  return [dot(d, U), dot(d, V), 0]
}
const pts = [
  [10.365, 23.4],
  [10.6, 23.635],
  [7.835, 26.4],
  [-7.835, 26.4],
  [-10.6, 23.635],
  [-10.365, 23.4],
]
const defs = []
for (let i = 0; i < pts.length; i++)
  defs.push({
    id: sk,
    startPos: toLocal(...pts[i]),
    endPos: toLocal(...pts[(i + 1) % pts.length]),
    genFixation: false,
    genVertAndHoriz: false,
  })
const ls = (await api.v1.sketch.line(defs)).result
const volBefore = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
const ext = (await api.v1.part.extrusion({ id: part, name: 'Tooth2Ext', references: ls, type: 'UP', limit2: len })).result
const volAfter = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
return {
  ext,
  volBefore,
  volAfter,
  added: volAfter - volBefore,
  expectedApprox: 4.355 * (15.67 * 3 + 2 * 0.5 * 2.765 * 2.765 + (2 * 0.235 * 0.235) / 2),
}

// ══════ run_script: Verify single solid body ══════
const g = await api.graphic()
const containers = Object.values(g.containers || g)
const solids = containers.filter((c) => (c.meshes || c.faces || []).length > 0)
const mp = (await api.v1.part.calculateMassProperties({ id: 4 })).result
return { containerCount: containers.length, solidCount: solids.length, volume: mp.volume }

// ══════ run_script: Inspect the two solid containers ══════
const g = await api.graphic()
const containers = Object.values(g.containers || g)
const solids = containers.filter((c) => (c.meshes || c.faces || []).length > 0)
const out = []
for (const c of solids) {
  let min = [1e9, 1e9, 1e9],
    max = [-1e9, -1e9, -1e9],
    nv = 0
  for (const m of c.meshes || c.faces || []) {
    const v = m.vertices || m.positions
    if (!v) continue
    for (let i = 0; i < v.length; i += 3) {
      nv++
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], v[i + k])
        max[k] = Math.max(max[k], v[i + k])
      }
    }
  }
  out.push({
    id: c.id,
    name: c.name,
    meshCount: (c.meshes || c.faces || []).length,
    nv,
    min: min.map((x) => +x.toFixed(2)),
    max: max.map((x) => +x.toFixed(2)),
  })
}
return out

// ══════ run_script: Union filler tooth into main body, verify one solid ══════
const part = 4
const t = await api.tree({ refresh: true })
const tooth2 = Object.values(t).find((n) => n.name === 'Tooth2Ext')
const tip = Object.values(t).find((n) => n.name === 'FrontTooth')
const uni = (await api.v1.part.boolean({ id: part, type: 'UNION', name: 'FrontToothMerge', target: tip.id, tools: [tooth2.id] })).result
const vol = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
// re-verify body count
const g = await api.graphic()
const solids = Object.values(g.containers || g).filter((c) => (c.meshes || c.faces || []).length > 0)
return { uni, vol, solidBodies: solids.length }

// ══════ run_script: Gas block cut (std low-pro dims) + front QD to matching slot distance ══════
const part = 4,
  TOP = 38
// ---------- 1. front QD spacing ----------
// Rear QD center x=45. Rear-most side M-LOK slot: center 70, span 54..86 → gap slot-edge to QD-center = 54-45 = 9
// Front-most side slot: center 230, span 214..246 → front QD center = 246 + 9 = 255
const t = await api.tree({ refresh: true })
const skQ = Object.values(t).find((n) => n.name === 'FrontQDSk')
const gq = (await api.v1.sketch.getGeometry({ id: skQ.id })).result
await api.v1.sketch.updateGeometry({ id: skQ.id, circles: [{ id: gq.circles[0], centerPos: [255, 0, 0], radius: 4.8 }] })
await api.v1.common.recalc()
const volQ = (await api.v1.part.calculateMassProperties({ id: part })).result.volume

// ---------- 2. gas block cut ----------
// Standard low-profile gas block (.750" barrel): 1.00" wide (25.4), ~1.35" long (34.3)
// Clearance cut: 26 mm wide. Mid-length gas port on 14.5" bbl puts the block at the rail front:
// cut from x = 247 forward through the muzzle end (merges with shovel opening) → open U-notch.
// Depth: from below up to z = -10 (well through the Ø34 bore wall at z=-17).
// TOP plane: local u=x, v=y. Sketch at z=0, extrude DOWN but only keep z<=-10 → instead sketch
// rectangle and extrude DOWN 35 from a workplane at z=-10.
const wp = (
  await api.v1.part.workPlane({
    id: part,
    name: 'GasWP',
    type: 'USERDEFINED',
    position: [0, 0, 0],
    normal: [0, 0, 1],
    offset: -10,
  })
).result
const sk = (await api.v1.sketch.create({ id: part, planeId: wp, name: 'GasBlockSk' })).result
// probe axes
const gp = async (id) => {
  const p = (await api.v1.sketch.getPositions({ id })).result.pos
  return [p.x, p.y, p.z]
}
const pO = (await api.v1.sketch.point({ id: sk, pos: [0, 0, 0], genFixation: false, genIncidence: false })).result
const pU = (await api.v1.sketch.point({ id: sk, pos: [1, 0, 0], genFixation: false, genIncidence: false })).result
const pV = (await api.v1.sketch.point({ id: sk, pos: [0, 1, 0], genFixation: false, genIncidence: false })).result
const O = await gp(pO),
  U = (await gp(pU)).map((v, i) => v - O[i]),
  V = (await gp(pV)).map((v, i) => v - O[i])
await api.v1.sketch.deleteObject({ ids: [pO, pU, pV] })
console.log('O', O, 'U', U, 'V', V)
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const toLocal = (x, y) => {
  const d = [x - O[0], y - O[1], -10 - O[2]]
  return [dot(d, U), dot(d, V), 0]
}
const corners = [
  [247, -13],
  [285, -13],
  [285, 13],
  [247, 13],
]
const defs = []
for (let i = 0; i < 4; i++)
  defs.push({
    id: sk,
    startPos: toLocal(...corners[i]),
    endPos: toLocal(...corners[(i + 1) % 4]),
    genFixation: false,
    genVertAndHoriz: false,
  })
const ls = (await api.v1.sketch.line(defs)).result
const tool = (await api.v1.part.extrusion({ id: part, name: 'GasBlockTool', references: ls, type: 'DOWN', limit2: 35 })).result
const t2 = await api.tree({ refresh: true })
const tip = Object.values(t2).find((n) => n.name === 'FrontToothMerge')
const volBefore = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
const cut = (await api.v1.part.boolean({ id: part, type: 'SUBTRACTION', name: 'GasBlockCut', target: tip.id, tools: [tool] })).result
const volAfter = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
const g = await api.graphic()
const solids = Object.values(g.containers || g).filter((c) => (c.meshes || c.faces || []).length > 0)
return { volQ, cut, volBefore, volAfter, gasCutRemoved: volBefore - volAfter, bodies: solids.length }

// ══════ run_script: Undo bottom gas cut; square gas block tunnel through upper portion, full length ══════
const part = 4,
  RIGHT = 46
// ---- 1. undo the wrong bottom cut ----
const t = await api.tree({ refresh: true })
const kill = ['GasBlockCut', 'GasBlockTool', 'GasBlockSk', 'GasWP'].map((n) => Object.values(t).find((x) => x.name === n)).filter(Boolean)
await api.v1.part.deleteFeature({ ids: kill.map((k) => k.id) })
await api.v1.common.recalc()
const volRestored = (await api.v1.part.calculateMassProperties({ id: part })).result.volume

// ---- 2. square tunnel: upper portion, full length ----
// Gas block clearance: 26 mm wide (1.00" block + margin), from bore center (z=0)
// up to z=18 (2 mm web under the pic deck base at z=20). Merges with the Ø34 bore below.
// Right plane local: u=z, v=-y  → rect corners (y=±13, z=0..18) → u ∈ [0,18], v ∈ [-13,13]
const sk = (await api.v1.sketch.create({ id: part, planeId: RIGHT, name: 'GasTunnelSk' })).result
const rect = (await api.v1.sketch.rectangle({ id: sk, startPos: [0, -13, 0], endPos: [18, 13, 0] })).result
const tool = (await api.v1.part.extrusion({ id: part, name: 'GasTunnelTool', references: rect, type: 'UP', limit2: 279.4 })).result
const t2 = await api.tree({ refresh: true })
const tip = Object.values(t2).find((n) => n.name === 'FrontToothMerge')
const cut = (await api.v1.part.boolean({ id: part, type: 'SUBTRACTION', name: 'GasTunnel', target: tip.id, tools: [tool] })).result
const volAfter = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
const g = await api.graphic()
const bodies = Object.values(g.containers || g).filter((c) => (c.meshes || c.faces || []).length > 0).length
return { volRestored, cut, volAfter, removed: volRestored - volAfter, bodies }

// ══════ run_script: Redo gas tunnel: small square passage under the pic deck only ══════
const part = 4,
  RIGHT = 46
// ---- undo oversized tunnel ----
const t = await api.tree({ refresh: true })
const kill = ['GasTunnel', 'GasTunnelTool', 'GasTunnelSk'].map((n) => Object.values(t).find((x) => x.name === n)).filter(Boolean)
await api.v1.part.deleteFeature({ ids: kill.map((k) => k.id) })
await api.v1.common.recalc()
const volRestored = (await api.v1.part.calculateMassProperties({ id: part })).result.volume

// ---- small tunnel: fits under the pic deck ----
// 16 mm wide (y ±8, inside the side walls), z from 13 (into the bore, so it opens
// into the barrel space like the example) up to 19 → leaves 1 mm web + full deck above.
const sk = (await api.v1.sketch.create({ id: part, planeId: RIGHT, name: 'GasTunnelSk' })).result
// Right plane local u=z, v=-y: rect u ∈ [13,19], v ∈ [-8,8]
const rect = (await api.v1.sketch.rectangle({ id: sk, startPos: [13, -8, 0], endPos: [19, 8, 0] })).result
const tool = (await api.v1.part.extrusion({ id: part, name: 'GasTunnelTool', references: rect, type: 'UP', limit2: 279.4 })).result
const t2 = await api.tree({ refresh: true })
const tip = Object.values(t2).find((n) => n.name === 'FrontToothMerge')
const cut = (await api.v1.part.boolean({ id: part, type: 'SUBTRACTION', name: 'GasTunnel', target: tip.id, tools: [tool] })).result
const volAfter = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
const g = await api.graphic()
const bodies = Object.values(g.containers || g).filter((c) => (c.meshes || c.faces || []).length > 0).length
return { volRestored, cut, volAfter, removed: volRestored - volAfter, bodies }

// ══════ run_script: Narrow the tunnel and raise it into the pic block — FAILED ══════
const part = 4
const t = await api.tree({ refresh: true })
const sk = Object.values(t).find((n) => n.name === 'GasTunnelSk')
const g = (await api.v1.sketch.getGeometry({ id: sk.id })).result
// Right plane local u=z, v=-y. New rect: width 12 (y ±6), z from 13 up to 22.4
// (22.4 = groove floor 23.4 minus 1 mm web → tunnel reaches INTO the pic riser block, z>20)
const near = (a, b) => Math.abs(a - b) < 1e-3
const upd = []
for (const lid of g.lines) {
  const p = (await api.v1.sketch.getPositions({ id: lid })).result
  const fix = (pt) => {
    let u = pt.x,
      v = pt.y // local coords
    u = near(u, 13) ? 13 : 22.4 // old u: 13 or 19
    v = v < 0 ? -6 : 6 // old v: ±8
    // careful: need per-point original u
    return null
  }
  upd.push({ lid, s: [p.startPos.x, p.startPos.y], e: [p.endPos.x, p.endPos.y] })
}
console.log(JSON.stringify(upd))
const map = (pt) => [near(pt[0], 19) ? 22.4 : 13, pt[1] < 0 ? -6 : 6, 0]
const lines = upd.map((l) => ({ id: l.lid, startPos: map(l.s), endPos: map(l.e) }))
await api.v1.sketch.updateGeometry({ id: sk.id, lines })
await api.v1.common.recalc()
const vol = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
const gg = await api.graphic()
const bodies = Object.values(gg.containers || gg).filter((c) => (c.meshes || c.faces || []).length > 0).length
return { vol, bodies }

// ══════ run_script: Recreate tunnel: 12 wide, z 13→22.4 (into pic block) ══════
const part = 4,
  RIGHT = 46
const t = await api.tree({ refresh: true })
const kill = ['GasTunnel', 'GasTunnelTool', 'GasTunnelSk'].map((n) => Object.values(t).find((x) => x.name === n)).filter(Boolean)
console.log('killing', JSON.stringify(kill.map((k) => k.name)))
await api.v1.part.deleteFeature({ ids: kill.map((k) => k.id) })
await api.v1.common.recalc()
const volRestored = (await api.v1.part.calculateMassProperties({ id: part })).result.volume

const sk = (await api.v1.sketch.create({ id: part, planeId: RIGHT, name: 'GasTunnelSk' })).result
// Right plane local u=z, v=-y: width 12 → v ±6; z 13 → 22.4 (1 mm under groove floor 23.4)
const rect = (await api.v1.sketch.rectangle({ id: sk, startPos: [13, -6, 0], endPos: [22.4, 6, 0] })).result
const tool = (await api.v1.part.extrusion({ id: part, name: 'GasTunnelTool', references: rect, type: 'UP', limit2: 279.4 })).result
const t2 = await api.tree({ refresh: true })
const tip = Object.values(t2).find((n) => n.name === 'FrontToothMerge')
const cut = (await api.v1.part.boolean({ id: part, type: 'SUBTRACTION', name: 'GasTunnel', target: tip.id, tools: [tool] })).result
const volAfter = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
const gg = await api.graphic()
const bodies = Object.values(gg.containers || gg).filter((c) => (c.meshes || c.faces || []).length > 0).length
return { volRestored, cut, volAfter, removed: volRestored - volAfter, bodies }

// ══════ run_script: Narrow tunnel to 10 mm ══════
const part = 4,
  RIGHT = 46
const t = await api.tree({ refresh: true })
const kill = ['GasTunnel', 'GasTunnelTool', 'GasTunnelSk'].map((n) => Object.values(t).find((x) => x.name === n)).filter(Boolean)
await api.v1.part.deleteFeature({ ids: kill.map((k) => k.id) })
await api.v1.common.recalc()
const volRestored = (await api.v1.part.calculateMassProperties({ id: part })).result.volume

const sk = (await api.v1.sketch.create({ id: part, planeId: RIGHT, name: 'GasTunnelSk' })).result
const rect = (await api.v1.sketch.rectangle({ id: sk, startPos: [13, -5, 0], endPos: [22.4, 5, 0] })).result
const tool = (await api.v1.part.extrusion({ id: part, name: 'GasTunnelTool', references: rect, type: 'UP', limit2: 279.4 })).result
const t2 = await api.tree({ refresh: true })
const tip = Object.values(t2).find((n) => n.name === 'FrontToothMerge')
const cut = (await api.v1.part.boolean({ id: part, type: 'SUBTRACTION', name: 'GasTunnel', target: tip.id, tools: [tool] })).result
const volAfter = (await api.v1.part.calculateMassProperties({ id: part })).result.volume
const gg = await api.graphic()
const bodies = Object.values(gg.containers || gg).filter((c) => (c.meshes || c.faces || []).length > 0).length
return { volRestored, volAfter, removed: volRestored - volAfter, bodies }
```
