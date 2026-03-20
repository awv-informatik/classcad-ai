/**
 * MIL-STD-1913 Picatinny Rail Section
 *
 * Creates a ~100mm rail section with dovetail cross-section and transverse
 * recoil grooves (slots), per MIL-STD-1913 (AR) dimensions.
 *
 * Cross-section profile (XY plane):
 *   - Body: 15.67mm wide, 5mm tall (base, height not spec'd)
 *   - Dovetail: 45° flare from 15.67mm to 21.21mm, then 1.39mm vertical lip
 *   - Total height: 9.16mm
 *
 * Slots: 5.23mm wide, 3.0mm deep, 10.01mm center-to-center spacing
 */
export default async function ({ execute }, { snapshot }) {
  // ========== MIL-STD-1913 Dimensions (mm) ==========
  const W_TOP_HALF  = 10.605   // Half of 21.21mm top width
  const W_BODY_HALF = 7.835    // Half of 15.67mm body width
  const H_BODY      = 5.0      // Body height below dovetail (application-dependent)
  const H_DOVETAIL  = 4.16     // Dovetail section height
  const H_45        = W_TOP_HALF - W_BODY_HALF  // 2.77mm — 45° flare (horiz = vert)
  const H_TOTAL     = H_BODY + H_DOVETAIL       // 9.16mm total

  const SLOT_WIDTH   = 5.23    // Slot width along rail (Z)
  const SLOT_DEPTH   = 3.0     // Cut depth from top surface
  const SLOT_SPACING = 10.01   // Center-to-center
  const RAIL_LENGTH  = 100     // Extrusion length along Z
  const SLOT_COUNT   = 9       // Number of transverse slots
  const TOOTH_WIDTH  = SLOT_SPACING - SLOT_WIDTH  // 4.78mm
  const FIRST_SLOT_Z = TOOTH_WIDTH / 2            // 2.39mm — half-tooth at start

  // ========== 1. Create Part ==========
  const partId = (await execute({ 'v1.part.create': [{ name: 'PicatinnyRail' }] })).result

  // ========== 2. Create Sketch (XY plane, default) ==========
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId, name: 'RailProfile' }] })).result

  // ========== 3. Draw Dovetail Cross-Section ==========
  // Profile points (clockwise from bottom-left, Z=0 for XY sketch):
  //
  //   5 __________________ 4      ← top flat (21.21mm)
  //    /                  \       ← 45° flare
  //  6/                    \3
  //   |                    |      ← body (15.67mm)
  //  7|____________________|2
  //   0                    1      ← bottom
  //
  const P = [
    [-W_BODY_HALF, 0, 0],                    // 0: bottom-left
    [ W_BODY_HALF, 0, 0],                    // 1: bottom-right
    [ W_BODY_HALF, H_BODY, 0],               // 2: right neck (dovetail start)
    [ W_TOP_HALF,  H_BODY + H_45, 0],        // 3: right 45° end
    [ W_TOP_HALF,  H_TOTAL, 0],              // 4: top-right
    [-W_TOP_HALF,  H_TOTAL, 0],              // 5: top-left
    [-W_TOP_HALF,  H_BODY + H_45, 0],        // 6: left 45° end
    [-W_BODY_HALF, H_BODY, 0],               // 7: left neck
  ]

  // Draw 8 lines individually to collect all IDs
  const lineIds = []
  for (let i = 0; i < P.length; i++) {
    const next = (i + 1) % P.length
    const r = await execute({
      'v1.sketch.line': [{ id: skId, startPos: P[i], endPos: P[next] }],
    })
    lineIds.push(r.result)
  }
  console.log(`  [info] lineIds: ${JSON.stringify(lineIds)}`)

  // ========== 4. Create Sketch Region ==========
  const regionId = (await execute({
    'v1.sketch.sketchRegion': [{ id: skId, name: 'RailRegion', geomIds: lineIds }],
  })).result
  console.log(`  [info] regionId: ${regionId}`)

  // ========== 5. Extrude Rail Body along Z ==========
  const railExtId = (await execute({
    'v1.part.extrusion': [{
      id: partId,
      name: 'RailBody',
      references: [regionId],
      type: 'UP',
      limit2: RAIL_LENGTH,
    }],
  })).result
  console.log(`  [info] railExtId: ${railExtId}`)

  await snapshot('rail-body')

  // ========== 6. Create Slot Cutter ==========
  // Position the first slot box: centered in X, top of rail minus slot depth in Y,
  // first slot offset in Z
  const slotWcs = (await execute({
    'v1.part.workCSys': [{
      id: partId,
      name: 'SlotOrigin',
      offset: [-(W_TOP_HALF + 2), H_TOTAL - SLOT_DEPTH, FIRST_SLOT_Z],
    }],
  })).result

  // Box: wider than rail in X, slot_depth tall in Y, slot_width deep in Z
  const slotBoxId = (await execute({
    'v1.part.box': [{
      id: partId,
      name: 'SlotCutter',
      references: [slotWcs],
      length: (W_TOP_HALF + 2) * 2,   // 25.21mm — wider than rail top
      width: SLOT_DEPTH,               // 3.0mm — slot depth (Y)
      height: SLOT_WIDTH,              // 5.23mm — slot width (Z)
    }],
  })).result

  // ========== 7. Pattern Slots Along Z ==========
  // Work axis along Z for pattern direction
  const zAxis = (await execute({
    'v1.part.workAxis': [{
      id: partId,
      name: 'ZAxis',
      direction: [0, 0, 1],
    }],
  })).result

  // Linear pattern: 9 slots at 10.01mm spacing
  const patternId = (await execute({
    'v1.part.linearPattern': [{
      id: partId,
      name: 'SlotPattern',
      targets: [slotBoxId],
      dir1: {
        references: [zAxis],
        distance: SLOT_SPACING,
        count: SLOT_COUNT,
        merged: true,
      },
    }],
  })).result

  await snapshot('slot-pattern')

  // ========== 8. Boolean Subtract Slots from Rail ==========
  const boolId = (await execute({
    'v1.part.boolean': [{
      id: partId,
      type: 'SUBTRACTION',
      target: railExtId,
      tools: [patternId],
    }],
  })).result
  console.log(`  [info] boolId: ${boolId}`)

  await snapshot('final-rail')

  return { partId, railExtId, slotBoxId, patternId, boolId }
}
