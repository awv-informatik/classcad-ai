export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'AllTypes' })).result
  // Asymmetric box so all views differ
  await api.v1.part.box({ id: partId, name: 'Box', length: 80, width: 60, height: 40 })

  const allTypes = ['TOP', 'FRONT', 'RIGHT', 'LEFT', 'BOTTOM', 'RIGHT_90', 'LEFT_90', 'BACK', 'ISO']
  await api.v1.drawing2d.view({ id: partId, types: allTypes })

  const r = await api.v1.drawing2d.getBoundaryBoxFromView({ id: partId, types: allTypes })
  console.log('[08] result count:', r.result?.length, '(expected 9)')

  // Show each type's bbox dimensions (width × height)
  for (let i = 0; i < allTypes.length; i++) {
    const bb = r.result[i]
    const w = (bb.max.x - bb.min.x).toFixed(2)
    const h = (bb.max.y - bb.min.y).toFixed(2)
    console.log(`[08] ${allTypes[i].padEnd(8)}: ${w} × ${h}`)
  }

  filewrite(r.result, 'all-types-bbox')

  return { partId }
}
