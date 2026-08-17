// Test ofb.geometry option on load (2=geometry, 3=graphics, 4=both)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'OfbGeoTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Save OFB with geometry level 4 (objects + geometry + graphics)
  const saved = await api.v1.common.save({
    format: 'OFB',
    encoding: 'base64',
    ofb: { geometry: 4 },
  })
  console.log('[07] Save content length:', saved.result.content?.length)

  // Load with geometry=2 (default — use stored geometry)
  await api.v1.common.clear({})
  const loadG2 = await api.v1.common.load({
    data: saved.result.content,
    format: 'OFB',
    encoding: 'base64',
    ofb: { geometry: 2 },
  })
  console.log('[07] ofb.geometry=2 result:', JSON.stringify(loadG2.result), 'maxLevel:', loadG2.maxLevel)
  filewrite({ result: loadG2.result, maxLevel: loadG2.maxLevel, messages: loadG2.messages }, 'ofb-geo2-response')
  await snapshot('ofb-geo-2')

  // Load with geometry=3 (use stored graphics)
  await api.v1.common.clear({})
  const loadG3 = await api.v1.common.load({
    data: saved.result.content,
    format: 'OFB',
    encoding: 'base64',
    ofb: { geometry: 3 },
  })
  console.log('[07] ofb.geometry=3 result:', JSON.stringify(loadG3.result), 'maxLevel:', loadG3.maxLevel)
  filewrite({ result: loadG3.result, maxLevel: loadG3.maxLevel, messages: loadG3.messages }, 'ofb-geo3-response')
  await snapshot('ofb-geo-3')

  // Load with geometry=4 (both)
  await api.v1.common.clear({})
  const loadG4 = await api.v1.common.load({
    data: saved.result.content,
    format: 'OFB',
    encoding: 'base64',
    ofb: { geometry: 4 },
  })
  console.log('[07] ofb.geometry=4 result:', JSON.stringify(loadG4.result), 'maxLevel:', loadG4.maxLevel)
  filewrite({ result: loadG4.result, maxLevel: loadG4.maxLevel, messages: loadG4.messages }, 'ofb-geo4-response')
  await snapshot('ofb-geo-4')

  return { g2: loadG2.result, g3: loadG3.result, g4: loadG4.result }
}
