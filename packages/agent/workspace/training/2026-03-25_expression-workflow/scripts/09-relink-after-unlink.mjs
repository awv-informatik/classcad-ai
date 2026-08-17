// Q: Can you unlink, then re-link to a different expression?
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'RelinkTest' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'A', value: 60 },
      { name: 'B', value: 120 },
    ],
  })

  // Create box with height linked to A
  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box',
    length: 80, width: 80, height: '@expr.A',
  })).result

  await snapshot('linked-A-h60')

  // Unlink
  await api.v1.part.unlinkExpression({ id: boxId, name: 'height' })
  await api.v1.common.recalc()
  console.log('[09] after unlink: height frozen at 60')

  // Re-link to B
  await api.v1.part.linkWithExpression({ id: boxId, exprName: 'B', name: 'height' })
  await api.v1.common.recalc()

  await snapshot('relinked-B-h120')
  console.log('[09] after re-link to B: height should be 120')

  // Update B — should affect box
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'B', value: 200 }] })
  await api.v1.common.recalc()

  await snapshot('B-updated-h200')
  console.log('[09] relink: ✓ unlink → relink to different expr → update works')
  return { partId, boxId }
}
