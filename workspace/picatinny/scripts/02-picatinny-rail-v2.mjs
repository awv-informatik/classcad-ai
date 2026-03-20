/**
 * MIL-STD-1913 Picatinny Rail Section — v2
 *
 * Fixed cross-section: 45° on BOTH top and bottom of the dovetail section.
 * The bottom 45° is the bearing surface, the top 45° is the matching chamfer.
 * This gives the dovetail a symmetric diamond-like profile at the widest point.
 *
 * Cross-section profile (XY plane):
 *       ____________           ← top flat
 *      /            \          ← 45° inward (upper chamfer)
 *     / widest 21.21 \        ← max width point
 *     \              /         ← 45° outward (bearing surface)
 *      |            |          ← body (15.67mm)
 *      |____________|          ← bottom
 */
export default async function ({ execute }, { snapshot }) {
  // ========== MIL-STD-1913 Dimensions (mm) ==========
  const W_TOP_HALF  = 10.605   // Half of 21.21mm (widest point)
  const W_BODY_HALF = 7.835    // Half of 15.67mm body width
  const H_BODY      = 5.0      // Body height below dovetail
  const H_DOVETAIL  = 4.16     // Dovetail section height
  const H_45        = W_TOP_HALF - W_BODY_HALF  // 2.77mm — each 45° section
  const H_LIP       = H_DOVETAIL - H_45         // 1.39mm — upper 45° section
  const H_TOTAL     = H_BODY + H_DOVETAIL       // 9.16mm total
  const W_FLAT_HALF = W_TOP_HALF - H_LIP        // 9.215mm — half of top flat

  const SLOT_WIDTH   = 5.23    // Slot width along rail (Z)
  const SLOT_DEPTH   = 3.0     // Cut depth from top surface
  const SLOT_SPACING = 10.01   // Center-to-center
  const RAIL_LENGTH  = 100     // Extrusion length along Z
  const SLOT_COUNT   = 9       // Number of transverse slots
  const TOOTH_WIDTH  = SLOT_SPACING - SLOT_WIDTH  // 4.78mm
  const FIRST_SLOT_Z = TOOTH_WIDTH / 2            // 2.39mm

  // ========== 1. Create Part ==========
  const partId = (await execute({ 'v1.part.create': [{ name: 'PicatinnyRail' }] })).result

  // ========== 2. Create Sketch (XY plane) ==========
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId, name: 'RailProfile' }] })).result

  // ========== 3. Draw Cross-Section with symmetric 45° dovetail ==========
  //
  //     5 ____________ 4        ← top flat (18.43mm)
  //      /            \         ← 45° inward (upper chamfer)
  //   6 /              \ 3      ← widest point (21.21mm)
  //     \              /        ← 45° outward (bearing surface)
  //    7 \            / 2       ← body top (15.67mm)
  //       |          |
  //    8  |__________| 1        ← bottom
  //       0
  //
  const P = [
    [-W_BODY_HALF, 0, 0],                       // 0: bottom-left
    [ W_BODY_HALF, 0, 0],                        // 1: bottom-right
    [ W_BODY_HALF, H_BODY, 0],                   // 2: right body top
    [ W_TOP_HALF,  H_BODY + H_45, 0],            // 3: right widest (end of lower 45°)
    [ W_FLAT_HALF, H_TOTAL, 0],                   // 4: top-right (end of upper 45°)
    [-W_FLAT_HALF, H_TOTAL, 0],                   // 5: top-left
    [-W_TOP_HALF,  H_BODY + H_45, 0],            // 6: left widest
    [-W_BODY_HALF, H_BODY, 0],                   // 7: left body top
  ]

  const lineIds = []
  for (let i = 0; i < P.length; i++) {
    const next = (i + 1) % P.length
    const r = await execute({
      'v1.sketch.line': [{ id: skId, startPos: P[i], endPos: P[next] }],
    })
    lineIds.push(r.result)
  }
  console.log(`  [info] lineIds: ${JSON.stringify(lineIds)}`)
  console.log(`  [info] top flat width: ${W_FLAT_HALF * 2}mm, widest: ${W_TOP_HALF * 2}mm`)

  // ========== 4. Sketch Region ==========
  const regionId = (await execute({
    'v1.sketch.sketchRegion': [{ id: skId, name: 'RailRegion', geomIds: lineIds }],
  })).result

  // ========== 5. Extrude Rail Body ==========
  const railExtId = (await execute({
    'v1.part.extrusion': [{
      id: partId,
      name: 'RailBody',
      references: [regionId],
      type: 'UP',
      limit2: RAIL_LENGTH,
    }],
  })).result

  await snapshot('rail-body')

  // ========== 6. Slot Cutter ==========
  const slotWcs = (await execute({
    'v1.part.workCSys': [{
      id: partId,
      name: 'SlotOrigin',
      offset: [-(W_TOP_HALF + 2), H_TOTAL - SLOT_DEPTH, FIRST_SLOT_Z],
    }],
  })).result

  const slotBoxId = (await execute({
    'v1.part.box': [{
      id: partId,
      name: 'SlotCutter',
      references: [slotWcs],
      length: (W_TOP_HALF + 2) * 2,
      width: SLOT_DEPTH,
      height: SLOT_WIDTH,
    }],
  })).result

  // ========== 7. Pattern Slots ==========
  const zAxis = (await execute({
    'v1.part.workAxis': [{
      id: partId,
      name: 'ZAxis',
      direction: [0, 0, 1],
    }],
  })).result

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

  // ========== 8. Boolean Subtract ==========
  const boolId = (await execute({
    'v1.part.boolean': [{
      id: partId,
      type: 'SUBTRACTION',
      target: railExtId,
      tools: [patternId],
    }],
  })).result

  await snapshot('final-rail')

  return { partId, railExtId, slotBoxId, patternId, boolId }
}
