// 09 — Build outline from individual arcs + lines (no polyline2d)
// This gives exact circular arc segments connected end-to-end
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ArcsOutline' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'Arcs' })).result

  // ============================================================
  // OUTLINE — built from individual arcs + connecting lines
  // Going CW from left edge top
  // ============================================================
  const ol = (await api.v1.curve.shape({ id: eifId, name: 'Outline' })).result

  // --- 1. Left edge vertical line ---
  const leftTop = [0, 0.1875]       // left edge top
  const leftBot = [0, -0.1875]      // left edge bottom
  await api.v1.curve.line({
    id: ol,
    startPos: [leftBot[0]*IN, leftBot[1]*IN, 0],
    endPos:   [leftTop[0]*IN, leftTop[1]*IN, 0]
  })

  // --- 2. Left top R.750 quarter arc ---
  // Center: (0.750, 0.1875), R=0.750
  // From (0, 0.1875) [180°] to (0.750, 0.9375) [90°] → CW
  const bossTop = [0.750, 0.9375]
  await api.v1.curve.arcByCenter({
    id: ol,
    centerPos: [0.750*IN, 0.1875*IN, 0],
    startPos: [leftTop[0]*IN, leftTop[1]*IN, 0],
    endPos:   [bossTop[0]*IN, bossTop[1]*IN, 0],
    isClockwise: true
  })

  // --- 3. R1.750 arc from top of left boss descending right ---
  // Center: (0.750, -0.8125), R=1.750
  // From (0.750, 0.9375) [90°] to (2.000, 0.413) [~44°] → CW
  const r1750End = [2.000, 0.413]
  await api.v1.curve.arcByCenter({
    id: ol,
    centerPos: [0.750*IN, -0.8125*IN, 0],
    startPos: [bossTop[0]*IN, bossTop[1]*IN, 0],
    endPos:   [r1750End[0]*IN, r1750End[1]*IN, 0],
    isClockwise: true
  })

  // --- 4. Line from R1.750 end to right boss entry ---
  // R.875 at (4.929, 0): entry at ~135° → (4.310, 0.619)
  const rbEntry = [4.310, 0.619]
  await api.v1.curve.line({
    id: ol,
    startPos: [r1750End[0]*IN, r1750End[1]*IN, 0],
    endPos:   [rbEntry[0]*IN, rbEntry[1]*IN, 0]
  })

  // --- 5. R.875 arc — right boss (270° CW from 135° to -135°) ---
  // Center: (4.929, 0), R=0.875
  const rbExit = [4.310, -0.619]
  await api.v1.curve.arcByCenter({
    id: ol,
    centerPos: [4.929*IN, 0*IN, 0],
    startPos: [rbEntry[0]*IN, rbEntry[1]*IN, 0],
    endPos:   [rbExit[0]*IN, rbExit[1]*IN, 0],
    isClockwise: true   // CW = major arc (270°)
  })

  // --- 6. Line from right boss exit to bottom center ---
  const botCenter = [2.500, -1.000]
  await api.v1.curve.line({
    id: ol,
    startPos: [rbExit[0]*IN, rbExit[1]*IN, 0],
    endPos:   [botCenter[0]*IN, botCenter[1]*IN, 0]
  })

  // --- 7. Line from bottom center to left boss bottom ---
  const bossBot = [0.750, -0.9375]
  await api.v1.curve.line({
    id: ol,
    startPos: [botCenter[0]*IN, botCenter[1]*IN, 0],
    endPos:   [bossBot[0]*IN, bossBot[1]*IN, 0]
  })

  // --- 8. Left bottom R.750 quarter arc ---
  // Center: (0.750, -0.1875), R=0.750
  // From (0.750, -0.9375) [270°] to (0, -0.1875) [180°] → CW
  await api.v1.curve.arcByCenter({
    id: ol,
    centerPos: [0.750*IN, -0.1875*IN, 0],
    startPos: [bossBot[0]*IN, bossBot[1]*IN, 0],
    endPos:   [leftBot[0]*IN, leftBot[1]*IN, 0],
    isClockwise: true
  })

  // ============================================================
  // LEFT SLOT
  // ============================================================
  const slot = (await api.v1.curve.shape({ id: eifId, name: 'LeftSlot' })).result
  await api.v1.curve.arcByCenter({
    id: slot, centerPos: [1.375*IN, 0, 0],
    startPos: [1.375*IN, -0.750*IN, 0], endPos: [1.375*IN, 0.750*IN, 0],
    isClockwise: false
  })
  await api.v1.curve.line({ id: slot,
    startPos: [1.375*IN, 0.750*IN, 0], endPos: [0.625*IN, 0.750*IN, 0] })
  await api.v1.curve.arcByCenter({
    id: slot, centerPos: [0.625*IN, 0, 0],
    startPos: [0.625*IN, 0.750*IN, 0], endPos: [0.625*IN, -0.750*IN, 0],
    isClockwise: false
  })
  await api.v1.curve.line({ id: slot,
    startPos: [0.625*IN, -0.750*IN, 0], endPos: [1.375*IN, -0.750*IN, 0] })

  // ============================================================
  // HOLES
  // ============================================================
  const h1 = (await api.v1.curve.shape({ id: eifId, name: 'H1625' })).result
  await api.v1.curve.circle({ id: h1, centerPos: [2.500*IN, 0.400*IN, 0], radius: 0.8125*IN })
  const h2 = (await api.v1.curve.shape({ id: eifId, name: 'H0750' })).result
  await api.v1.curve.circle({ id: h2, centerPos: [3.250*IN, 0.400*IN, 0], radius: 0.375*IN })
  const h3 = (await api.v1.curve.shape({ id: eifId, name: 'H1125' })).result
  await api.v1.curve.circle({ id: h3, centerPos: [3.750*IN, -0.200*IN, 0], radius: 0.5625*IN })

  // Centerline
  const ref = (await api.v1.curve.shape({ id: eifId, name: 'Ref' })).result
  await api.v1.curve.line({ id: ref, startPos: [-0.5*IN, 0, 0], endPos: [6.5*IN, 0, 0] })

  await snapshot('arcs-v1')
  console.log('[09] Outline from individual arcs: R.750 (left) + R1.750 (top) + R.875 (right)')
  console.log('[09] Bottom still simplified as straight lines')
}
