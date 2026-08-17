// Q: Unlink workflow: link → verify → unlink → verify frozen → update expr → verify no change
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'UnlinkWorkflow' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'H', value: 120 }],
  })

  // Create box with @expr
  const boxId = (await api.v1.part.box({
    id: partId, name: 'ExprBox',
    length: 80, width: 60, height: '@expr.H',
  })).result

  await snapshot('linked-h120')

  // Unlink height
  await api.v1.part.unlinkExpression({ id: boxId, name: 'height' })
  await api.v1.common.recalc()

  await snapshot('unlinked-h120-frozen')
  console.log('[03] after unlink: height should still be 120 (frozen)')

  // Update expression — should NOT affect box
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'H', value: 999 }] })
  await api.v1.common.recalc()

  const hVal = (await api.v1.part.getExpression({ id: partId, name: 'H' })).result
  console.log('[03] H expr value:', hVal.value, '(should be 999)')

  await snapshot('after-expr-update-box-still-120')
  console.log('[03] unlink workflow: ✓ box should still be 120 despite H=999')
  return { partId, boxId }
}
