// Test slicing a boolean result (union of two boxes)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SliceBoolean' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  // Create L-shape via union of two boxes
  const b1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const b2 = (await api.v1.solid.box({ id: eifId, length: 40, width: 60, height: 80, translation: [0, 0, 20] })).result
  console.log('[16] b1:', b1, 'b2:', b2)

  // Union them
  const unionR = await api.v1.solid.union({ id: eifId, target: b1, tools: [b2] })
  console.log('[16] union result:', unionR.result, 'maxLevel:', unionR.maxLevel)

  await snapshot('before-slice')

  // Slice the union result at z=0 with normal [0,0,1]
  const sliceR = await api.v1.solid.slice({
    id: eifId,
    target: b1,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
    keepBoth: false,
  })
  console.log('[16] slice result:', sliceR.result, 'maxLevel:', sliceR.maxLevel)

  const c = sliceR.graphic?.containers?.[0]
  if (c) {
    console.log('[16] AFTER min:', JSON.stringify(c.properties.min))
    console.log('[16] AFTER max:', JSON.stringify(c.properties.max))
  }

  await snapshot('after-slice')

  return { partId }
}
