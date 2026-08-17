// Q: One expression drives two features — update once, both change
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'SharedExpr' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [{ name: 'size', value: 50 }],
  })

  // Box 1: height driven by 'size'
  const box1 = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 80, width: 60, height: '@expr.size',
  })).result

  // Create WCS to offset second box
  const wcsId = (await api.v1.part.workCSys({
    id: partId, name: 'Offset',
    offset: [120, 0, 0],
  })).result

  // Box 2: also height driven by 'size'
  const box2 = (await api.v1.part.box({
    id: partId, name: 'Box2',
    references: [wcsId],
    length: 60, width: 80, height: '@expr.size',
  })).result

  await snapshot('both-h50')

  // Update once — both should change
  await api.v1.part.updateExpression({ id: partId, toUpdate: [{ name: 'size', value: 120 }] })
  await api.v1.common.recalc()

  await snapshot('both-h120')
  console.log('[05] multi-feature sharing: ✓ one update → both boxes changed')
  return { partId, box1, box2 }
}
