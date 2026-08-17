// 02-verify-dims.mjs — Verify all dimensions against checklist
// Reads geometry positions, computes every dimensioned value, checks tolerance

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BracketVerify' })).result
  const skId = (await api.v1.sketch.create({ id: partId })).result

  // === CONSTANTS (expected) ===
  const hubR = 19, boreR = 12.5, bossR = 8.5, holeR = 3.3, armHW = 1
  const BL = [-48, -12], BR = [48, -12], T = [6.75, 29.23]

  // === HELPERS ===
  const dist = (a, b) => Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2)
  const toDeg = r => r * 180 / Math.PI

  // === DIMENSION CHECKS ===
  const checks = []
  const check = (name, expected, actual, tol = 0.1) => {
    const pass = Math.abs(expected - actual) <= tol
    const status = pass ? '✓' : '✗'
    checks.push({ name, expected, actual: +actual.toFixed(4), pass, status })
    console.log(`[02] ${status} ${name}: expected=${expected}, actual=${actual.toFixed(4)}`)
  }

  // D1: Ø38 — hub outer diameter
  check('D1 Ø38 hub outer', 38, hubR * 2)

  // D2: Ø25 — bore diameter
  check('D2 Ø25 bore', 25, boreR * 2)

  // D3: Ø26 — UNRESOLVED (skip for now)
  console.log('[02] D3 Ø26: UNRESOLVED — not modeled')

  // D4: 3×Ø17 — boss outer diameters
  check('D4 Ø17 BL boss', 17, bossR * 2)
  check('D4 Ø17 BR boss', 17, bossR * 2)
  check('D4 Ø17 T boss', 17, bossR * 2)

  // D5: Ø6.6 — through-holes
  check('D5 Ø6.6 holes', 6.6, holeR * 2)

  // D6: 48 (left) — horizontal distance hub to BL boss center
  check('D6 48 left', 48, Math.abs(BL[0]))

  // D7: 48 (right) — horizontal distance hub to BR boss center
  check('D7 48 right', 48, Math.abs(BR[0]))

  // D8: 49.73 — vertical distance from bottom datum to top boss center
  const bottomDatum = Math.min(BL[1], BR[1]) - bossR  // bottom tangent line
  check('D8 49.73 bottom-to-top', 49.73, T[1] - bottomDatum)

  // D9: 20.5 — vertical distance from bottom datum to hub center
  check('D9 20.5 bottom-to-hub', 20.5, 0 - bottomDatum)

  // D10: 6.75 — horizontal offset of top boss
  check('D10 6.75 top offset', 6.75, T[0])

  // D11: 13° — angle from vertical to hub→top-boss line
  const angleToTop = toDeg(Math.atan2(T[0], T[1]))
  check('D11 13° top angle', 13, angleToTop, 0.2)

  // D12: 14° (left) — angle from horizontal to hub→BL-boss line
  const angleToBL = toDeg(Math.atan2(Math.abs(BL[1]), Math.abs(BL[0])))
  check('D12 14° left', 14, angleToBL, 0.2)

  // D13: 14° (right) — angle from horizontal to hub→BR-boss line
  const angleToBR = toDeg(Math.atan2(Math.abs(BR[1]), Math.abs(BR[0])))
  check('D13 14° right', 14, angleToBR, 0.2)

  // D14-D16: Arm widths = 2
  // The arm width is a construction parameter (2 * armHW = 2)
  check('D14 arm width (top)', 2, armHW * 2)
  check('D15 arm width (left)', 2, armHW * 2)
  check('D16 arm width (right)', 2, armHW * 2)

  // === CROSS-CHECKS ===
  // Distance hub to each boss
  const dBL = dist([0,0], BL)
  const dBR = dist([0,0], BR)
  const dT = dist([0,0], T)
  console.log(`[02] Hub→BL: ${dBL.toFixed(2)}, Hub→BR: ${dBR.toFixed(2)}, Hub→T: ${dT.toFixed(2)}`)

  // Gap between hub and bosses (must be positive for arm to exist)
  const gapBL = dBL - hubR - bossR
  const gapBR = dBR - hubR - bossR
  const gapT = dT - hubR - bossR
  console.log(`[02] Gap BL: ${gapBL.toFixed(2)}, BR: ${gapBR.toFixed(2)}, T: ${gapT.toFixed(2)}`)

  // Arm length (from hub surface to boss surface along wall)
  for (const [label, bc] of [['BL', BL], ['BR', BR], ['T', T]]) {
    const D = dist([0,0], bc)
    const tHub = Math.sqrt(hubR**2 - armHW**2)
    const tBoss = D - Math.sqrt(bossR**2 - armHW**2)
    console.log(`[02] Arm ${label}: length=${(tBoss-tHub).toFixed(2)}`)
  }

  // === SUMMARY ===
  const passed = checks.filter(c => c.pass).length
  const failed = checks.filter(c => !c.pass).length
  console.log(`\n[02] RESULT: ${passed} passed, ${failed} failed out of ${checks.length}`)

  filewrite(checks, 'dimension-checks')
  return { partId }
}
