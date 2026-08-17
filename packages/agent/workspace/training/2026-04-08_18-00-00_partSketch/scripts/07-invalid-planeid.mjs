// 07 — Error cases: invalid planeId values
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Non-existent planeId
  const r1 = await api.v1.part.sketch({ id: partId, planeId: 99999 })
  console.log('[07] bad planeId — maxLevel:', r1.maxLevel, 'result:', r1.result)
  console.log('[07] bad planeId — msgs:', JSON.stringify(r1.messages))

  // planeId = partId (wrong type — part is not a plane)
  const r2 = await api.v1.part.sketch({ id: partId, planeId: partId })
  console.log('[07] partId as planeId — maxLevel:', r2.maxLevel, 'result:', r2.result)
  console.log('[07] partId as planeId — msgs:', JSON.stringify(r2.messages))

  filewrite({ badPlane: r1.messages, partAsPlane: r2.messages }, 'planeid-errors')

  return { badPlaneLevel: r1.maxLevel, partAsPlaneLevel: r2.maxLevel }
}
