// Block: 120 x 80 x 35, R10 on both LEFT corners. Frame: back face z=0, front z=35.
// Profile direct-constructed (exact tangent points) — no trim needed.
// Expected: vol = (9600 - 2*(100-25PI))*35 = 334497.79, COG = (60.26, 40.00, 17.5)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LiquidMixerV2' })).result
  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  const skId = (await api.v1.sketch.create({ id: partId, planeId: topId, name: 'BlockProfile' })).result

  const noGenL = { genFixation: false, genIncidence: false, genVertAndHoriz: false }
  const noGenA = { genFixation: false, genIncidence: false }

  const linesR = await api.v1.sketch.line([
    { id: skId, startPos: [10, 0, 0], endPos: [120, 0, 0], ...noGenL },   // bottom
    { id: skId, startPos: [120, 0, 0], endPos: [120, 80, 0], ...noGenL }, // right
    { id: skId, startPos: [120, 80, 0], endPos: [10, 80, 0], ...noGenL }, // top
    { id: skId, startPos: [0, 70, 0], endPos: [0, 10, 0], ...noGenL },    // left
  ])
  console.log('[03] lines:', JSON.stringify(linesR.result), 'maxLevel:', linesR.maxLevel)

  const arcsR = await api.v1.sketch.arcByCenter([
    // top-left corner: (10,80) @90deg -> (0,70) @180deg, CCW
    { id: skId, startPos: [10, 80, 0], centerPos: [10, 70, 0], endPos: [0, 70, 0], isClockwise: false, ...noGenA },
    // bottom-left corner: (0,10) @180deg -> (10,0) @270deg, CCW
    { id: skId, startPos: [0, 10, 0], centerPos: [10, 10, 0], endPos: [10, 0, 0], isClockwise: false, ...noGenA },
  ])
  console.log('[03] arcs:', JSON.stringify(arcsR.result), 'maxLevel:', arcsR.maxLevel)

  const extR = await api.v1.part.extrusion({
    id: partId, name: 'Block',
    references: [...linesR.result, ...arcsR.result],
    type: 'UP', limit2: 35,
  })
  console.log('[03] extrusion:', extR.result, 'maxLevel:', extR.maxLevel, JSON.stringify(extR.messages ?? []))

  const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
  const expVol = (9600 - 2 * (100 - 25 * Math.PI)) * 35
  console.log('[03] vol:', mp.volume.toFixed(2), 'expected:', expVol.toFixed(2), 'delta%:', (100 * (mp.volume - expVol) / expVol).toFixed(3))
  console.log('[03] COG:', JSON.stringify(mp.cog), 'expected ~(60.26, 40.00, 17.5)')

  filewrite({ vol: mp.volume, expVol, cog: mp.cog, ext: extR.result }, 'block-verify')
  await snapshot('03-block')
  return { partId, ext: extR.result }
}
