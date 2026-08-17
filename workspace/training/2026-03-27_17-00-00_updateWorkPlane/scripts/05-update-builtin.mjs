// 05 — Update built-in planes (Top, Front, Right)
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })

  const topId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })).result
  console.log('[05] Top id:', topId)

  await snapshot('before')

  // A) Update offset of built-in Top
  await api.v1.part.openFeature({ id: topId })
  const r1 = await api.v1.part.updateWorkPlane({ id: topId, offset: 50 })
  console.log('[05] update Top offset=50:', r1.result, 'maxLevel:', r1.maxLevel)
  if (r1.messages?.length) console.log('[05] msgs:', r1.messages[0]?.message)
  await api.v1.part.closeFeature({ id: topId })

  await snapshot('after-top-offset')

  // B) Rename built-in Top
  await api.v1.part.openFeature({ id: topId })
  const r2 = await api.v1.part.updateWorkPlane({ id: topId, name: 'MyTop' })
  console.log('[05] rename Top→MyTop:', r2.result, 'maxLevel:', r2.maxLevel)
  await api.v1.part.closeFeature({ id: topId })

  const g1 = await api.v1.part.getWorkGeometry({ id: partId, name: 'MyTop' })
  const g2 = await api.v1.part.getWorkGeometry({ id: partId, name: 'Top' })
  console.log('[05] lookup "MyTop":', g1.result, '"Top":', g2.result)

  return { partId }
}
