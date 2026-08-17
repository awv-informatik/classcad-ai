// Do inline formulas (no named expressions) work in feature params?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Inline formula directly in box params — no @expr, no named expressions
  const r1 = await api.v1.part.box({
    id: partId,
    name: 'InlineBox',
    length: '3 * 40',
    width: '2 * 30 + 10',
    height: 'sqrt(2500)',
  })
  console.log('[02] inline formula box result:', r1.result, 'maxLevel:', r1.maxLevel)

  // Try with C:PI
  const r2 = await api.v1.part.cylinder({
    id: partId,
    name: 'PiCyl',
    diameter: 'C:PI * 20',
    height: '100',
  })
  console.log('[02] C:PI cylinder result:', r2.result, 'maxLevel:', r2.maxLevel)

  await snapshot('inline-formulas')
  return { partId, boxId: r1.result, cylId: r2.result }
}
