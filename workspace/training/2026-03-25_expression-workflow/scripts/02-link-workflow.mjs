// Q: Link workflow: create feature with plain values → linkWithExpression → recalc → verify → update → recalc → verify
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'LinkWorkflow' })).result

  // Create expression
  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'bigH', value: 150 }],
  })

  // Create box with plain values
  const boxId = (await api.v1.part.box({
    id: partId, name: 'PlainBox',
    length: 80, width: 60, height: 40,
  })).result

  await snapshot('plain-box-h40')

  // Link height to expression
  await api.v1.part.linkWithExpression({ id: boxId, exprName: 'bigH', name: 'height' })
  await api.v1.common.recalc()

  await snapshot('linked-box-h150')
  console.log('[02] after link: box height should be 150 (from bigH)')

  // Update expression
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'bigH', value: 200 }] })
  await api.v1.common.recalc()

  await snapshot('updated-box-h200')
  console.log('[02] after update: box height should be 200')
  console.log('[02] link workflow: ✓ plain → link → recalc → update → recalc')
  return { partId, boxId }
}
