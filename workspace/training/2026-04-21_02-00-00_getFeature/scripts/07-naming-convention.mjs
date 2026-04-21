export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result

  // Create 5 boxes and check their auto-assigned names
  const ids = []
  for (let i = 0; i < 5; i++) {
    ids.push((await api.v1.part.box({ id: partId })).result)
  }
  console.log('[07] box IDs:', ids)

  // Verify naming pattern: Box, Box0, Box1, Box2, Box3
  const expectedNames = ['Box', 'Box0', 'Box1', 'Box2', 'Box3']
  for (let i = 0; i < expectedNames.length; i++) {
    const r = await api.v1.part.getFeature({ id: partId, name: expectedNames[i] })
    const match = r.result === ids[i]
    console.log('[07] "' + expectedNames[i] + '" → ' + r.result + ' (expected: ' + ids[i] + ', match: ' + match + ')')
  }

  filewrite({ ids, expectedNames }, 'naming-convention')
  return { partId }
}
