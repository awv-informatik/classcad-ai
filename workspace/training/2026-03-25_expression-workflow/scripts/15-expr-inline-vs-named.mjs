// Q: Compare inline formulas (no named expr) vs @expr references vs linkWithExpression
// All three methods side-by-side — which updates when you change a named expression?
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'CompareBindings' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'S', value: 60 }],
  })

  // Box1: inline formula (no @expr) — height = 60 literal
  const box1 = (await api.v1.part.box({
    id: partId, name: 'Inline',
    length: 80, width: 80, height: '30 + 30',  // inline = 60
  })).result

  // Box2: @expr reference — height linked at creation
  const wcs2 = (await api.v1.part.workCSys({ id: partId, offset: [120, 0, 0] })).result
  const box2 = (await api.v1.part.box({
    id: partId, name: 'AtExpr',
    references: [wcs2],
    length: 80, width: 80, height: '@expr.S',
  })).result

  // Box3: plain value, then link post-hoc
  const wcs3 = (await api.v1.part.workCSys({ id: partId, offset: [240, 0, 0] })).result
  const box3 = (await api.v1.part.box({
    id: partId, name: 'Linked',
    references: [wcs3],
    length: 80, width: 80, height: 60,
  })).result
  await api.v1.part.linkWithExpression({ id: box3, exprName: 'S', name: 'height' })
  await api.v1.common.recalc()

  await snapshot('all-three-h60')
  console.log('[15] all three boxes at height 60')

  // Now update S to 120 — which boxes change?
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'S', value: 120 }] })
  await api.v1.common.recalc()

  await snapshot('after-S-120')
  console.log('[15] after S=120:')
  console.log('[15]   Inline (30+30) — should stay 60 (no expr dependency)')
  console.log('[15]   @expr.S — should become 120')
  console.log('[15]   linkWithExpression(S) — should become 120')

  return { partId, box1, box2, box3 }
}
