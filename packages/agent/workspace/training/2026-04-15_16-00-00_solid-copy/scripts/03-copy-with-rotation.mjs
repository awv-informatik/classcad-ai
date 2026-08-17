// Copy with rotation — verify the copy is rotated
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'CopyRotate' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Use a non-symmetric box so rotation is visible
  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 30, height: 20 })).result
  console.log('[03] boxId:', boxId)

  // Copy rotated 45 degrees around Z
  const copyId = (await api.v1.solid.copy({
    id: eifId, target: boxId,
    rotation: [0, 0, Math.PI / 4]
  })).result
  console.log('[03] copyId:', copyId)

  // Also translate original away so both are visible
  // Actually no — they share origin. Let's just snapshot and see overlap.
  await snapshot('rotated-copy')

  // Get graphic to count bodies
  const checkR = await api.v1.common.getAppVersion({})
  filewrite({ boxId, copyId, maxLevel: checkR.maxLevel }, 'ids')

  return { partId, eifId, boxId, copyId }
}
