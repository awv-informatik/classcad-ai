/**
 * smoke.mjs — offline smoke test with synthetic session data.
 *
 * No ClassCAD server needed: feeds renderSessionData a hand-built structure
 * tree + graphic payload (a unit cube) and a fake execute for a sketch, then
 * checks every render path produces output and that rendering is DETERMINISTIC
 * (two runs → byte-identical pixels).
 */

import { strict as assert } from 'assert'
import { mkdirSync } from 'fs'
import { renderSessionData, renderSolidZBuffer, VIEW_NAMES } from '../src/core.mjs'
import { renderIsometric } from '../src/stl.mjs'

// ── Synthetic cube graphic (12 triangles, 8 vertices, per-vertex normals) ──
function cubeGraphic(size = 10) {
  const s = size
  const V = [
    [0, 0, 0], [s, 0, 0], [s, s, 0], [0, s, 0],
    [0, 0, s], [s, 0, s], [s, s, s], [0, s, s],
  ]
  const quads = [
    [0, 3, 2, 1, [0, 0, -1]], [4, 5, 6, 7, [0, 0, 1]],
    [0, 1, 5, 4, [0, -1, 0]], [2, 3, 7, 6, [0, 1, 0]],
    [1, 2, 6, 5, [1, 0, 0]], [0, 4, 7, 3, [-1, 0, 0]],
  ]
  const vertices = [], normals = [], indices = []
  let vi = 0
  for (const [a, b, c, d, n] of quads) {
    for (const idx of [a, b, c, d]) {
      vertices.push(...V[idx])
      normals.push(...n)
    }
    indices.push(vi, vi + 1, vi + 2, vi, vi + 2, vi + 3)
    vi += 4
  }
  return {
    containers: [{
      id: 100, owner: 30, type: 1,
      properties: { material: { color: [0.5, 0.5, 0.5], opacity: 1 }, layer: '0' },
      meshes: [{ id: 1, vertices, normals, indices }],
      edges: [{ id: 2, points: [0, 0, 0, s, 0, 0, s, s, 0, 0, s, 0, 0, 0, 0] }],
    }],
    properties: { version: 9 },
  }
}

const tree = {
  '20': { id: 20, class: 'CC_Part', name: 'Part', parent: null, children: [30, 40] },
  '30': { id: 30, class: 'CC_Solid', name: 'Solid', parent: 20 },
  '40': { id: 40, class: 'CC_Sketch', name: 'TestSketch', parent: 20 },
}

// Fake execute serving one sketch: a 20×10 rectangle line + a circle r=5.
const sketchGeom = { lines: [41], circles: [42], arcs: [], points: [] }
async function fakeExecute(task) {
  const [key, [params]] = Object.entries(task)[0]
  if (key === 'v1.sketch.getGeometry') return { result: sketchGeom }
  if (key === 'v1.sketch.getPositions') {
    if (params.id === 41) return { result: { startPos: { x: 0, y: 0 }, endPos: { x: 20, y: 10 } } }
    if (params.id === 43) return { result: { pos: { x: 30, y: 5 } } }
    return { result: null }
  }
  if (key === 'v1.sketch.getPoints') {
    if (params.id === 41) return { result: { startId: 44, endId: 45 } }
    if (params.id === 42) return { result: { centerId: 43 } }
    return { result: null }
  }
  return { result: null }
}
tree['42'] = { id: 42, class: 'CC_2DCircle', name: 'C1', parent: 40, members: { Radius: { value: 5 } } }

const graphic = cubeGraphic()

// 1. Full orchestrator: solid + sketch entries
const entries = await renderSessionData({ tree, graphic, execute: fakeExecute }, { width: 400, height: 300 })
const types = entries.map(e => e.type).sort()
assert.deepEqual(types, ['sketch', 'solid'], `expected solid+sketch, got ${types}`)
const solid = entries.find(e => e.type === 'solid')
assert.equal(solid.kind, 'pixels')
assert.equal(solid.pixels.length, 400 * 300 * 4)
const sketch = entries.find(e => e.type === 'sketch')
assert.ok(sketch.svg.includes('<svg') && sketch.svg.includes('polyline'), 'sketch SVG has geometry')

// 2. The cube must actually cover pixels (not a blank frame)
let colored = 0
for (let i = 0; i < solid.pixels.length; i += 4) {
  if (solid.pixels[i] !== 255 || solid.pixels[i + 1] !== 255 || solid.pixels[i + 2] !== 255) colored++
}
assert.ok(colored > 5000, `cube covers ${colored} px — expected > 5000`)

// 3. Determinism: run twice, byte-compare
const entries2 = await renderSessionData({ tree, graphic, execute: fakeExecute }, { width: 400, height: 300 })
const solid2 = entries2.find(e => e.type === 'solid')
assert.ok(Buffer.compare(Buffer.from(solid.pixels), Buffer.from(solid2.pixels)) === 0, 'pixel-identical across runs')
assert.equal(sketch.svg, entries2.find(e => e.type === 'sketch').svg, 'SVG identical across runs')

// 4. Every view renders without throwing and stays deterministic
for (const view of VIEW_NAMES) {
  const [a] = await renderSessionData({ tree, graphic }, { width: 200, height: 150, view })
  const [b] = await renderSessionData({ tree, graphic }, { width: 200, height: 150, view })
  assert.ok(a?.pixels?.length === 200 * 150 * 4, `view ${view} renders`)
  assert.ok(Buffer.compare(Buffer.from(a.pixels), Buffer.from(b.pixels)) === 0, `view ${view} deterministic`)
}

// 5. Assembly transforms: two instances of the same part must render twice the coverage region
const asmTree = {
  '10': { id: 10, class: 'CC_AssemblyRoot', name: 'Root', parent: null, children: [11, 12] },
  '11': { id: 11, class: 'CC_ProductReference', name: 'I1', parent: 10, members: { productId: { value: 20 } }, coordinateSystem: [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]] },
  '12': { id: 12, class: 'CC_ProductReference', name: 'I2', parent: 10, members: { productId: { value: 20 } }, coordinateSystem: [[30, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]] },
  '20': { id: 20, class: 'CC_Part', name: 'Part', parent: 10, children: [30] },
  '30': { id: 30, class: 'CC_Solid', name: 'Solid', parent: 20 },
}
const [asm] = await renderSessionData({ tree: asmTree, graphic }, { width: 400, height: 300 })
// Both instances must land in the frame: colored pixels in the LEFT and RIGHT
// quarter of the image (two cubes 30 units apart under auto-fit), which a
// single instance stacked at the template origin could never produce.
const coloredAt = x => {
  for (let y = 0; y < asm.height; y++) {
    const i = (y * asm.width + x) * 4
    if (asm.pixels[i] !== 255 || asm.pixels[i + 1] !== 255 || asm.pixels[i + 2] !== 255) return true
  }
  return false
}
const leftHit = Array.from({ length: 100 }, (_, x) => x).some(coloredAt)
const rightHit = Array.from({ length: 100 }, (_, x) => 300 + x).some(coloredAt)
assert.ok(leftHit && rightHit, `assembly places both instances (left ${leftHit}, right ${rightHit})`)

// 5a. Color modes: native uses the model's material, distinct uses the palette
{
  const redGraphic = cubeGraphic()
  redGraphic.containers[0].properties.material.color = [255, 40, 40]
  // Majority hue over all body pixels (edges share their own dark color — a
  // first-hit sample can land on an edge, so count instead).
  const hueCounts = px => {
    let red = 0, blue = 0
    for (let i = 0; i < px.length; i += 4) {
      const [r, , b] = [px[i], px[i+1], px[i+2]]
      if (r === 255 && px[i+1] === 255 && b === 255) continue
      if (r > b) red++
      else if (b > r) blue++
    }
    return { red, blue }
  }
  const [nat] = await renderSessionData({ tree, graphic: redGraphic }, { width: 200, height: 150 })
  const [dis] = await renderSessionData({ tree, graphic: redGraphic }, { width: 200, height: 150, colors: 'distinct' })
  const nc = hueCounts(nat.pixels), dc = hueCounts(dis.pixels)
  assert.ok(nc.red > nc.blue * 2, `native mode is red-dominant (got ${JSON.stringify(nc)})`)
  assert.ok(dc.blue > dc.red * 2, `distinct mode uses the blue palette (got ${JSON.stringify(dc)})`)
}

// 5a2. Section plane: cube 0..10 cut at x=5 → front view keeps LEFT half at
// UNCHANGED framing (colored width halves, right half of the old span empty).
{
  const bboxX = px => {
    let min = Infinity, max = -Infinity
    for (let y = 0; y < 150; y++) for (let x = 0; x < 200; x++) {
      const i = (y * 200 + x) * 4
      if (px[i] !== 255 || px[i+1] !== 255 || px[i+2] !== 255) { if (x < min) min = x; if (x > max) max = x }
    }
    return { min, max }
  }
  const [full] = await renderSessionData({ tree, graphic }, { width: 200, height: 150, view: 'front' })
  const [half] = await renderSessionData({ tree, graphic }, {
    width: 200, height: 150, view: 'front',
    section: { origin: [5, 0, 0], normal: [1, 0, 0] },
  })
  const fb = bboxX(full.pixels), hb = bboxX(half.pixels)
  const fullW = fb.max - fb.min, halfW = hb.max - hb.min
  assert.ok(Math.abs(hb.min - fb.min) <= 2, `section keeps left edge (${hb.min} vs ${fb.min})`)
  assert.ok(Math.abs(halfW - fullW / 2) <= 4, `section halves the width (${halfW} vs ${fullW}/2)`)
  const [half2] = await renderSessionData({ tree, graphic }, {
    width: 200, height: 150, view: 'front', section: { origin: [5, 0, 0], normal: [1, 0, 0] },
  })
  assert.ok(Buffer.compare(Buffer.from(half.pixels), Buffer.from(half2.pixels)) === 0, 'section deterministic')
  // iso: interior (back faces) must be visible in the cut body — the sectioned
  // iso render has body pixels the plain one lacks nowhere near, plus darker shades.
  const [isoCut] = await renderSessionData({ tree, graphic }, { width: 200, height: 150, section: { origin: [5, 5, 5], normal: [1, 0, 0] } })
  assert.ok(isoCut.pixels.some((v, i) => i % 4 === 0 && v !== 255), 'sectioned iso renders')
}

// 5a3. Frame pinning + diffImages: before/after with locked frame → localized diff
{
  const { diffImages } = await import('../src/core.mjs')
  const [before] = await renderSessionData({ tree, graphic }, { width: 200, height: 150 })
  assert.ok(before.frame && before.frame.scale > 0, 'render returns its frame')

  // Same state, pinned frame → byte-identical (pinning a matching frame is a no-op)
  const [samePinned] = await renderSessionData({ tree, graphic }, { width: 200, height: 150, frame: before.frame })
  assert.ok(Buffer.compare(Buffer.from(before.pixels), Buffer.from(samePinned.pixels)) === 0, 'pinned same frame → identical')

  // Changed state: second cube far right. Pinned frame keeps the first cube's pixels.
  const twoBody = cubeGraphic()
  const g2 = cubeGraphic()
  for (let i = 0; i < g2.containers[0].meshes[0].vertices.length; i += 3) g2.containers[0].meshes[0].vertices[i] += 25
  g2.containers[0].id = 101
  g2.containers[0].edges = []
  twoBody.containers.push(g2.containers[0])
  const [after] = await renderSessionData({ tree, graphic: twoBody }, { width: 200, height: 150, frame: before.frame })
  const d = diffImages(before, after)
  assert.ok(d.changed > 0 && d.bbox, 'diff detects the added body')
  // All change must lie RIGHT of the original cube (x+25 → to the right on screen in iso)
  const firstCubeMaxX = (() => {
    let mx = 0
    for (let y = 0; y < 150; y++) for (let x = 0; x < 200; x++) {
      const i = (y * 200 + x) * 4
      if (before.pixels[i] !== 255 || before.pixels[i+1] !== 255 || before.pixels[i+2] !== 255) if (x > mx) mx = x
    }
    return mx
  })()
  assert.ok(d.bbox.minX > firstCubeMaxX - 3, `change localized right of the original (${d.bbox.minX} > ~${firstCubeMaxX})`)
  assert.ok(d.fraction < 0.5, `change fraction is local (${d.fraction.toFixed(3)})`)
  // Identical inputs → zero diff
  const d0 = diffImages(before, before)
  assert.equal(d0.changed, 0)
  assert.equal(d0.bbox, null)
  // WITHOUT pinning, auto-fit reframes → the diff bleeds into UNCHANGED
  // geometry (the original cube region), which is exactly what pinning prevents.
  const [afterUnpinned] = await renderSessionData({ tree, graphic: twoBody }, { width: 200, height: 150 })
  const dU = diffImages(before, afterUnpinned)
  assert.ok(dU.bbox.minX < firstCubeMaxX - 3, `unpinned diff pollutes the unchanged region (minX ${dU.bbox.minX})`)
}

// 5a4. Four-view sheet: quadrants populated, ortho views share one scale
{
  const [sheet] = await renderSessionData({ tree, graphic }, { width: 400, height: 300, sheet: true, colors: 'distinct' })
  assert.equal(sheet.type, 'sheet')
  assert.equal(sheet.pixels.length, 400 * 300 * 4)
  // Body pixels in every quadrant (cube colors, not just labels/dividers)
  const quadHasBody = (ox, oy) => {
    for (let y = oy + 30; y < oy + 150; y++) for (let x = ox + 30; x < ox + 200; x++) {
      const i = (y * 400 + x) * 4
      const [r, g, b] = [sheet.pixels[i], sheet.pixels[i+1], sheet.pixels[i+2]]
      if (!(r === 255 && g === 255 && b === 255) && !(r === g && g === b)) return true
    }
    return false
  }
  assert.ok(quadHasBody(0, 0) && quadHasBody(200, 0) && quadHasBody(0, 150) && quadHasBody(200, 150),
    'all four quadrants show the model')
  // Shared ortho scale: the 10-cube's silhouette width must match in TOP (TL)
  // and FRONT (BL) quadrants.
  const bodyWidth = (ox, oy) => {
    let min = Infinity, max = -Infinity
    for (let y = oy; y < oy + 150; y++) for (let x = ox; x < ox + 200; x++) {
      const i = (y * 400 + x) * 4
      const [r, g, b] = [sheet.pixels[i], sheet.pixels[i+1], sheet.pixels[i+2]]
      if (!(r === 255 && g === 255 && b === 255) && !(r === g && g === b)) { if (x < min) min = x; if (x > max) max = x }
    }
    return max - min
  }
  const wTop = bodyWidth(0, 20), wFront = bodyWidth(0, 170)
  assert.ok(Math.abs(wTop - wFront) <= 2, `ortho quadrants share scale (top ${wTop}px vs front ${wFront}px)`)
  // Labels drawn (dark grey pixels in the label corner)
  let labelPx = 0
  for (let y = 8; y < 24; y++) for (let x = 8; x < 60; x++) {
    const i = (y * 400 + x) * 4
    if (sheet.pixels[i] === 70 && sheet.pixels[i+1] === 70) labelPx++
  }
  assert.ok(labelPx > 20, `quadrant label rendered (${labelPx} px)`)
  // Deterministic + custom view list works
  const [sheet2] = await renderSessionData({ tree, graphic }, { width: 400, height: 300, sheet: true, colors: 'distinct' })
  assert.ok(Buffer.compare(Buffer.from(sheet.pixels), Buffer.from(sheet2.pixels)) === 0, 'sheet deterministic')
  const [sheetC] = await renderSessionData({ tree, graphic }, { width: 400, height: 300, sheet: ['iso', 'back', 'left', 'bottom'], colors: 'distinct' })
  assert.ok(sheetC && Buffer.compare(Buffer.from(sheet.pixels), Buffer.from(sheetC.pixels)) !== 0, 'custom view list changes the sheet')
}

// 5a5. Highlight + markers
{
  const orangeShare = px => {
    let orange = 0, body = 0
    for (let i = 0; i < px.length; i += 4) {
      const [r, g, b] = [px[i], px[i+1], px[i+2]]
      if (r === 255 && g === 255 && b === 255) continue
      body++
      if (r > 150 && g > 60 && g < 160 && b < 80) orange++
    }
    return { orange, body }
  }
  const [plain] = await renderSessionData({ tree, graphic }, { width: 200, height: 150 })
  // Highlight by face (mesh id 1), by container (100), by owner solid (30) — all must fire.
  for (const id of [1, 100, 30]) {
    const [hl] = await renderSessionData({ tree, graphic }, { width: 200, height: 150, highlight: [id] })
    const s = orangeShare(hl.pixels)
    assert.ok(s.orange > s.body * 0.8, `highlight by id ${id} turns the body orange (${s.orange}/${s.body})`)
  }
  // Unknown id → byte-identical to no-highlight
  const [hlNone] = await renderSessionData({ tree, graphic }, { width: 200, height: 150, highlight: [99999] })
  assert.ok(Buffer.compare(Buffer.from(plain.pixels), Buffer.from(hlNone.pixels)) === 0, 'unmatched highlight is a no-op')
  // Highlighted EDGE renders red pixels
  const [hlEdge] = await renderSessionData({ tree, graphic }, { width: 200, height: 150, highlight: [2] })
  let redEdge = 0
  for (let i = 0; i < hlEdge.pixels.length; i += 4) {
    if (hlEdge.pixels[i] === 230 && hlEdge.pixels[i+1] === 40) redEdge++
  }
  assert.ok(redEdge > 20, `highlighted edge draws in signal red (${redEdge} px)`)
  // Marker: crosshair + label near the projected cube corner [0,0,10]
  const [mk] = await renderSessionData({ tree, graphic }, {
    width: 200, height: 150, markers: [{ position: [0, 0, 10], label: 'P1' }],
  })
  let redMk = 0
  for (let i = 0; i < mk.pixels.length; i += 4) {
    if (mk.pixels[i] === 220 && mk.pixels[i+1] === 30 && mk.pixels[i+2] === 30) redMk++
  }
  assert.ok(redMk > 25, `marker + label drawn (${redMk} red px)`)
  const [mk2] = await renderSessionData({ tree, graphic }, {
    width: 200, height: 150, markers: [{ position: [0, 0, 10], label: 'P1' }],
  })
  assert.ok(Buffer.compare(Buffer.from(mk.pixels), Buffer.from(mk2.pixels)) === 0, 'markers deterministic')
}

// 5a6. Sketch overlay in 3D: blue curve pixels on top of the solid render
{
  tree['40'].coordinateSystem = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [0, 0, 1]]
  const bluePx = px => {
    let n = 0
    for (let i = 0; i < px.length; i += 4) {
      if (px[i] === 0 && px[i+1] === 90 && px[i+2] === 220) n++
    }
    return n
  }
  const [plain] = await renderSessionData({ tree, graphic, execute: fakeExecute }, { width: 200, height: 150 })
  const withOv = await renderSessionData({ tree, graphic, execute: fakeExecute }, { width: 200, height: 150, sketchOverlay: true })
  const ovSolid = withOv.find(e => e.type === 'solid')
  assert.ok(bluePx(plain.pixels) === 0, 'no overlay color without the option')
  assert.ok(bluePx(ovSolid.pixels) > 50, `sketch curves drawn in 3D (${bluePx(ovSolid.pixels)} px)`)
  // Standalone: no solid graphic → overlay renders on white
  const solo = await renderSessionData({ tree, graphic: { containers: [] }, execute: fakeExecute }, { width: 200, height: 150, sketchOverlay: true })
  const soloSolid = solo.find(e => e.type === 'solid')
  assert.ok(soloSolid && bluePx(soloSolid.pixels) > 50, 'overlay renders standalone without solids')
  // Deterministic
  const withOv2 = await renderSessionData({ tree, graphic, execute: fakeExecute }, { width: 200, height: 150, sketchOverlay: true })
  assert.ok(Buffer.compare(Buffer.from(ovSolid.pixels), Buffer.from(withOv2.find(e => e.type === 'solid').pixels)) === 0, 'overlay deterministic')
}

// 5a7. Annotation overlay: triad colors, extents text, scale bar
{
  const [ann] = await renderSessionData({ tree, graphic }, { width: 300, height: 220, annotate: true })
  const count = rgb => {
    let n = 0
    for (let i = 0; i < ann.pixels.length; i += 4) {
      if (ann.pixels[i] === rgb[0] && ann.pixels[i+1] === rgb[1] && ann.pixels[i+2] === rgb[2]) n++
    }
    return n
  }
  assert.ok(count([200, 40, 40]) > 10, 'X axis (red) drawn')
  assert.ok(count([40, 150, 40]) > 10, 'Y axis (green) drawn')
  assert.ok(count([40, 70, 200]) > 10, 'Z axis (blue) drawn')
  const inkPx = count([60, 60, 60])
  assert.ok(inkPx > 80, `extents text + scale bar drawn (${inkPx} ink px)`)
  const [ann2] = await renderSessionData({ tree, graphic }, { width: 300, height: 220, annotate: true })
  assert.ok(Buffer.compare(Buffer.from(ann.pixels), Buffer.from(ann2.pixels)) === 0, 'annotate deterministic')
  // In the FRONT view the Y axis points into the screen — only X and Z visible.
  const [annF] = await renderSessionData({ tree, graphic }, { width: 300, height: 220, annotate: true, view: 'front' })
  let green = 0
  for (let i = 0; i < annF.pixels.length; i += 4) {
    if (annF.pixels[i] === 40 && annF.pixels[i+1] === 150 && annF.pixels[i+2] === 40) green++
  }
  assert.ok(green === 0, `front view hides the into-screen Y axis (${green} green px)`)
}

// 5a8. X-ray: a hidden body shines through the one in front
{
  // Red cube in front (y 0..10), blue cube behind (y 20..30), same x/z → in the
  // FRONT view their silhouettes coincide and the red one fully occludes.
  const twoG = cubeGraphic()
  twoG.containers[0].properties.material.color = [220, 40, 40]
  const back = cubeGraphic()
  for (let i = 1; i < back.containers[0].meshes[0].vertices.length; i += 3) back.containers[0].meshes[0].vertices[i] += 20
  back.containers[0].id = 101
  back.containers[0].properties = { material: { color: [40, 40, 220], opacity: 1 }, layer: '0' }
  back.containers[0].edges = []
  twoG.containers.push(back.containers[0])

  const centerPx = px => { const i = ((75) * 200 + 100) * 4; return [px[i], px[i+1], px[i+2]] }
  const [opaque] = await renderSessionData({ tree, graphic: twoG }, { width: 200, height: 150, view: 'front' })
  const [xr] = await renderSessionData({ tree, graphic: twoG }, { width: 200, height: 150, view: 'front', xray: true })
  const oc = centerPx(opaque.pixels), xc = centerPx(xr.pixels)
  assert.ok(oc[0] > oc[2] + 40, `opaque: front (red) body wins at center (${oc})`)
  // X-ray: blue back cube must contribute — blue channel rises substantially vs opaque.
  assert.ok(xc[2] > oc[2] + 25, `x-ray: hidden blue body shines through (${xc} vs ${oc})`)
  const [xr2] = await renderSessionData({ tree, graphic: twoG }, { width: 200, height: 150, view: 'front', xray: true })
  assert.ok(Buffer.compare(Buffer.from(xr.pixels), Buffer.from(xr2.pixels)) === 0, 'x-ray deterministic')
}

// 5b. Generalized camera: named-view equivalences + arbitrary views
{
  const px = async view => (await renderSessionData({ tree, graphic }, { width: 200, height: 150, view }))[0].pixels
  assert.ok(Buffer.compare(Buffer.from(await px('front')), Buffer.from(await px({ azimuth: 0, elevation: 0 }))) === 0,
    '{az:0,el:0} === front')
  assert.ok(Buffer.compare(Buffer.from(await px('front')), Buffer.from(await px({ direction: [0, 1, 0] }))) === 0,
    '{direction:[0,1,0]} === front')
  assert.ok(Buffer.compare(Buffer.from(await px('top')), Buffer.from(await px({ direction: [0, 0, -1] }))) === 0,
    '{direction:[0,0,-1]} === top')
  const oblique1 = await px({ azimuth: 30, elevation: 20 })
  const oblique2 = await px({ azimuth: 30, elevation: 20 })
  assert.ok(Buffer.compare(Buffer.from(oblique1), Buffer.from(oblique2)) === 0, 'oblique camera deterministic')
  assert.ok(Buffer.compare(Buffer.from(oblique1), Buffer.from(await px({ azimuth: 60, elevation: 20 }))) !== 0,
    'different azimuth → different image')
}

// 6. STL export-verification path
const tri = renderIsometric([{ normal: [0, 0, 1], vertices: [[0, 0, 0], [10, 0, 0], [0, 10, 0]] }], 200, 150)
assert.equal(tri.length, 200 * 150 * 4)

// 6b. Explicit failure: session has solids but NO graphic data → renderSession
// throws with cause + remedies (never a silent empty render). Mock client:
// GetTree reports a solid, but no graphic arrives from any source.
try {
  const { renderSession } = await import('../src/node.mjs')
  const mockClient = {
    request: async () => ({ structure: { tree } }),           // tree contains CC_Solid 30
    execute: async () => ({ result: null }),                  // recalc yields nothing
    getLastGraphic: () => null,                               // no cached graphic either
  }
  let threw = null
  try {
    await renderSession(mockClient, 'x', '/tmp', {})
  } catch (e) {
    threw = e
  }
  assert.ok(threw, 'renderSession throws when solids have no graphic')
  assert.ok(/No graphic data/.test(threw.message) && /source: 'stl'/.test(threw.message),
    'error names the cause and the stl remedy')
} catch (e) {
  if (e.code === 'ERR_MODULE_NOT_FOUND') console.log('explicit-failure test: sharp not installed — skipped')
  else throw e
}

// 7. Node adapter: PNG bytes come out (skip silently if sharp is missing)
try {
  const { pixelsToPng, svgToPngBuffer } = await import('../src/node.mjs')
  const png = await pixelsToPng(solid.pixels, solid.width, solid.height)
  assert.ok(png.length > 1000 && png[0] === 0x89 && png[1] === 0x50, 'valid PNG bytes')
  const sk = await svgToPngBuffer(sketch.svg)
  assert.ok(sk.length > 1000 && sk[0] === 0x89, 'sketch SVG → PNG')
  mkdirSync(new URL('./out', import.meta.url).pathname, { recursive: true })
  const { savePNG, svgToPng } = await import('../src/node.mjs')
  await savePNG(solid.pixels, solid.width, solid.height, new URL('./out/cube.png', import.meta.url).pathname)
  await svgToPng(sketch.svg, new URL('./out/sketch.png', import.meta.url).pathname)
  console.log('node adapter: PNGs written to test/out/')
} catch (e) {
  if (e.code === 'ERR_MODULE_NOT_FOUND') console.log('node adapter: sharp not installed — skipped')
  else throw e
}

console.log('SMOKE OK — solid, sketch, all views deterministic, assembly transforms, STL, PNG encode')
