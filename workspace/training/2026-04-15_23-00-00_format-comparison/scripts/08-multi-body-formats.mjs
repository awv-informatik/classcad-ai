// Multi-body geometry: how format sizes scale with complexity
// 1 box, then 3 boxes + 2 cylinders = 5 bodies
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'MultiFmt' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  // Create 3 boxes + 2 cylinders at different positions
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })
  await api.v1.solid.box({ id: eifId, length: 40, width: 30, height: 20, translation: [100, 0, 0] })
  await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 50, translation: [0, 80, 0] })
  await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 30, translation: [100, 80, 0] })
  await api.v1.solid.cylinder({ id: eifId, height: 40, diameter: 50, translation: [50, 40, 0] })

  await snapshot('multi-body')

  const results = {}
  for (const fmt of ['OFB', 'STP', 'STL', 'SCG', 'IWP']) {
    const r = await api.v1.common.save({ format: fmt, encoding: 'base64' })
    results[fmt] = r.result?.content?.length || 0
    console.log(`[08] ${fmt}: b64len=${r.result?.content?.length || 0}`)
  }

  const rDeflate = await api.v1.common.save({ format: 'OFB', encoding: 'base64', compression: 'deflate' })
  results['OFB_deflate'] = rDeflate.result?.content?.length || 0
  console.log(`[08] OFB+deflate: b64len=${rDeflate.result?.content?.length || 0}`)

  const rIwpBin = await api.v1.common.save({ format: 'IWP', encoding: 'base64', iwp: { binary: 1 } })
  results['IWP_binary'] = rIwpBin.result?.content?.length || 0
  console.log(`[08] IWP+binary: b64len=${rIwpBin.result?.content?.length || 0}`)

  filewrite(results, 'multi-body-sizes')
  return { partId }
}
