export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  // Create box with custom name
  const boxId = (await api.v1.part.box({ id: partId, name: 'MyBox' })).result
  console.log('[03] boxId:', boxId)

  // Look up by custom name
  const r1 = await api.v1.part.getFeature({ id: partId, name: 'MyBox' })
  console.log('[03] "MyBox":', r1.result, 'maxLevel:', r1.maxLevel)

  // The default name should NOT work
  const r2 = await api.v1.part.getFeature({ id: partId, name: 'Box' })
  console.log('[03] "Box" (default, should fail):', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    customName: { result: r1.result, maxLevel: r1.maxLevel },
    defaultName: { result: r2.result, maxLevel: r2.maxLevel },
  }, 'custom-name')

  return { partId }
}
