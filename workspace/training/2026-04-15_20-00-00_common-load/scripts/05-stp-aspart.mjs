// STP load with stp.asPart option — flattening assembly structure
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StpAsPartTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })
  await api.v1.solid.sphere({ id: eifId, radius: 20, translation: [100, 0, 0] })

  // Save as STP
  const saved = await api.v1.common.save({ format: 'STP', encoding: 'base64' })
  console.log('[05] STP save success:', saved.result.success)

  // Load with asPart: true
  await api.v1.common.clear({})
  const loadR = await api.v1.common.load({
    data: saved.result.content,
    format: 'STP',
    encoding: 'base64',
    stp: { asPart: 1 },
  })
  console.log('[05] Load asPart result:', JSON.stringify(loadR.result))
  console.log('[05] Load asPart maxLevel:', loadR.maxLevel)

  filewrite({ result: loadR.result, maxLevel: loadR.maxLevel, messages: loadR.messages }, 'stp-aspart-response')
  filewrite(loadR.structure, 'stp-aspart-structure')

  await snapshot('after-stp-aspart-load')

  // Also load without asPart for comparison
  await api.v1.common.clear({})
  const loadR2 = await api.v1.common.load({
    data: saved.result.content,
    format: 'STP',
    encoding: 'base64',
  })
  console.log('[05] Load default result:', JSON.stringify(loadR2.result))

  filewrite(loadR2.structure, 'stp-default-structure')

  await snapshot('after-stp-default-load')

  return { asPartId: loadR.result?.id, defaultId: loadR2.result?.id }
}
