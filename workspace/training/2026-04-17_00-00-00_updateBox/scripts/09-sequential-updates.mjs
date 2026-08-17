export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const refBoxId = (await api.v1.part.box({ id: partId, name: 'Ref', length: 20, width: 20, height: 20 })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Target', length: 80, width: 60, height: 40 })).result
  console.log('[09] boxId:', boxId)

  await snapshot('before')

  // Multiple updateBox calls within a single open/close
  await api.v1.part.openFeature({ id: boxId })

  const up1 = await api.v1.part.updateBox({ id: boxId, height: 100 })
  console.log('[09] update1 (height=100) result:', up1.result, 'maxLevel:', up1.maxLevel)

  const up2 = await api.v1.part.updateBox({ id: boxId, width: 120 })
  console.log('[09] update2 (width=120) result:', up2.result, 'maxLevel:', up2.maxLevel)

  const up3 = await api.v1.part.updateBox({ id: boxId, length: 30 })
  console.log('[09] update3 (length=30) result:', up3.result, 'maxLevel:', up3.maxLevel)

  await api.v1.part.closeFeature({ id: boxId })

  await snapshot('after')

  // All three should have taken effect: 30x120x100
  filewrite({
    update1: { result: up1.result, maxLevel: up1.maxLevel },
    update2: { result: up2.result, maxLevel: up2.maxLevel },
    update3: { result: up3.result, maxLevel: up3.maxLevel },
  }, 'sequential-responses')

  return { partId, boxId }
}
