// Deep investigation: factor=0 and factor=-1 with numeric graphic data
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ZeroNegDataTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Box centered at origin: 40x30x20
  const boxId = (await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20 })).result

  // Get bounding box before
  const before = await api.v1.solid.scale({ id: eifId, target: boxId, factor: 1 })
  const bbBefore = before.graphic?.containers?.[0]?.properties
  console.log('[16] before min:', JSON.stringify(bbBefore?.min), 'max:', JSON.stringify(bbBefore?.max))

  // Scale by -1 (mirror)
  const negResp = await api.v1.solid.scale({ id: eifId, target: boxId, factor: -1 })
  const bbNeg = negResp.graphic?.containers?.[0]?.properties
  console.log('[16] after -1 min:', JSON.stringify(bbNeg?.min), 'max:', JSON.stringify(bbNeg?.max))

  // Get first few normals before and after
  const normsBefore = before.graphic?.containers?.[0]?.meshes?.[0]?.normals?.slice(0, 12)
  const normsAfter = negResp.graphic?.containers?.[0]?.meshes?.[0]?.normals?.slice(0, 12)
  console.log('[16] normals before (first 12):', JSON.stringify(normsBefore))
  console.log('[16] normals after -1 (first 12):', JSON.stringify(normsAfter))

  filewrite({
    before: { min: bbBefore?.min, max: bbBefore?.max, firstNormals: normsBefore },
    afterNeg1: { min: bbNeg?.min, max: bbNeg?.max, firstNormals: normsAfter },
  }, 'neg-scale-comparison')

  // Now scale by -1 again (should restore original — cumulative -1*-1=1)
  const restoreResp = await api.v1.solid.scale({ id: eifId, target: boxId, factor: -1 })
  const bbRestore = restoreResp.graphic?.containers?.[0]?.properties
  console.log('[16] after -1*-1 min:', JSON.stringify(bbRestore?.min), 'max:', JSON.stringify(bbRestore?.max))

  // Now test factor=0 on a fresh box
  const box2 = (await api.v1.solid.box({ id: eifId, length: 50, width: 40, height: 30, translation: [0, 80, 0] })).result
  const zeroResp = await api.v1.solid.scale({ id: eifId, target: box2, factor: 0 })
  const bbZero = zeroResp.graphic?.containers?.find(c => c.owner === box2)?.properties
  console.log('[16] after 0x — container count:', zeroResp.graphic?.containers?.length)
  console.log('[16] after 0x min:', JSON.stringify(bbZero?.min), 'max:', JSON.stringify(bbZero?.max))

  filewrite({
    zeroScale: {
      containerCount: zeroResp.graphic?.containers?.length,
      targetContainer: bbZero,
    },
  }, 'zero-scale-data')

  await snapshot('after-investigations')

  return { partId, eifId, boxId, box2 }
}
