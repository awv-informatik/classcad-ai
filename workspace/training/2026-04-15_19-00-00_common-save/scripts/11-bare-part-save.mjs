// Save a bare part with no geometry — minimum viable save
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BarePart' })).result
  console.log('[11] partId:', partId)

  const ofb = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  console.log('[11] bare OFB success:', ofb.result.success)
  console.log('[11] bare OFB length:', ofb.result.content?.length)
  console.log('[11] bare OFB maxLevel:', ofb.maxLevel)

  const stp = await api.v1.common.save({ format: 'STP' })
  console.log('[11] bare STP success:', stp.result.success)
  console.log('[11] bare STP length:', stp.result.content?.length)
  console.log('[11] bare STP maxLevel:', stp.maxLevel)
  console.log('[11] bare STP messages:', JSON.stringify(stp.messages))

  const stl = await api.v1.common.save({ format: 'STL', encoding: 'base64' })
  console.log('[11] bare STL success:', stl.result.success)
  console.log('[11] bare STL length:', stl.result.content?.length)
  console.log('[11] bare STL maxLevel:', stl.maxLevel)

  filewrite({
    ofb: { success: ofb.result.success, length: ofb.result.content?.length, maxLevel: ofb.maxLevel },
    stp: { success: stp.result.success, length: stp.result.content?.length, maxLevel: stp.maxLevel, messages: stp.messages },
    stl: { success: stl.result.success, length: stl.result.content?.length, maxLevel: stl.maxLevel },
  }, 'bare-part')

  return { partId }
}
