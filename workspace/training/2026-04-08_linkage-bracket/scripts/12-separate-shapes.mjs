// 12 — Each outline segment in its own shape to debug rendering
const IN = 25.4

export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SepShapes' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'Sep' })).result

  const mk = async (name) => (await api.v1.curve.shape({ id: eifId, name })).result

  // Key points
  const leftTop = [0, 0.1875]
  const leftBot = [0, -0.1875]
  const bossTop = [0.750, 0.9375]
  const bossBot = [0.750, -0.9375]
  const r1750End = [2.000, 0.41224]  // exact point on R1.750 circle
  const rbEntry = [4.310, 0.619]
  const rbRight = [5.804, 0.000]
  const rbExit = [4.310, -0.619]
  const botCenter = [2.500, -1.000]

  const p = (pt) => [pt[0]*IN, pt[1]*IN, 0]

  // 1. Left edge
  const s1 = await mk('S1_leftEdge')
  await api.v1.curve.line({ id: s1, startPos: p(leftBot), endPos: p(leftTop) })

  // 2. Left top R.750
  const s2 = await mk('S2_R750top')
  await api.v1.curve.arcByCenter({
    id: s2, centerPos: [0.750*IN, 0.1875*IN, 0],
    startPos: p(leftTop), endPos: p(bossTop), isClockwise: true
  })

  // 3. R1.750
  const s3 = await mk('S3_R1750')
  await api.v1.curve.arcByCenter({
    id: s3, centerPos: [0.750*IN, -0.8125*IN, 0],
    startPos: p(bossTop), endPos: p(r1750End), isClockwise: true
  })

  // 4. Line to right boss
  const s4 = await mk('S4_toRB')
  await api.v1.curve.line({ id: s4, startPos: p(r1750End), endPos: p(rbEntry) })

  // 5a. R.875 upper
  const s5a = await mk('S5a_R875up')
  await api.v1.curve.arcByCenter({
    id: s5a, centerPos: [4.929*IN, 0, 0],
    startPos: p(rbEntry), endPos: p(rbRight), isClockwise: true
  })

  // 5b. R.875 lower
  const s5b = await mk('S5b_R875lo')
  await api.v1.curve.arcByCenter({
    id: s5b, centerPos: [4.929*IN, 0, 0],
    startPos: p(rbRight), endPos: p(rbExit), isClockwise: true
  })

  // 6. Line to bottom center
  const s6 = await mk('S6_toBotC')
  await api.v1.curve.line({ id: s6, startPos: p(rbExit), endPos: p(botCenter) })

  // 7. Line to boss bottom
  const s7 = await mk('S7_toBotL')
  await api.v1.curve.line({ id: s7, startPos: p(botCenter), endPos: p(bossBot) })

  // 8. Left bottom R.750
  const s8 = await mk('S8_R750bot')
  await api.v1.curve.arcByCenter({
    id: s8, centerPos: [0.750*IN, -0.1875*IN, 0],
    startPos: p(bossBot), endPos: p(leftBot), isClockwise: true
  })

  await snapshot('separate-shapes')
  console.log('[12] 8 outline segments in separate shapes')
}
