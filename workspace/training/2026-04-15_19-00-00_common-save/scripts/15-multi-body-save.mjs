// Save model with multiple bodies — verify all are preserved
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiBody' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  const box1 = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result
  const cyl1 = (await api.v1.solid.cylinder({ id: eifId, radius: 20, height: 60, position: [120, 0, 0] })).result
  const sph1 = (await api.v1.solid.sphere({ id: eifId, radius: 25, position: [0, 100, 0] })).result

  console.log('[15] box:', box1, 'cyl:', cyl1, 'sph:', sph1)

  await snapshot('multi-before')

  // Get structure before save to count nodes
  const beforeStruct = (await api.v1.common.save({ format: 'OFB' }))
  const ofbLen = beforeStruct.result.content.length
  console.log('[15] OFB with 3 bodies length:', ofbLen)

  // STP with 3 bodies
  const stp = await api.v1.common.save({ format: 'STP' })
  console.log('[15] STP with 3 bodies length:', stp.result.content.length)

  // STL with 3 bodies (base64)
  const stl = await api.v1.common.save({ format: 'STL', encoding: 'base64' })
  console.log('[15] STL with 3 bodies length:', stl.result.content.length)

  // Roundtrip to verify
  const saved = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  await api.v1.common.clear({})
  const loadR = await api.v1.common.load({ data: saved.result.content, format: 'OFB', encoding: 'base64', compression: 'deflate' })
  console.log('[15] roundtrip load id:', loadR.result?.id)

  await snapshot('multi-after-roundtrip')

  filewrite({
    ofbLength: ofbLen,
    stpLength: stp.result.content.length,
    stlLength: stl.result.content.length,
    loadResult: loadR.result,
  }, 'multi-body')

  return { partId }
}
