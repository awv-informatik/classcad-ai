// Expressions in extrusion params (limit2, taperAngle)
// Use box as base solid, then test expression-driven cylinder instead
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  await api.v1.part.expression({
    id: partId,
    toCreate: [
      { name: 'boxLen', value: 100 },
      { name: 'boxWid', value: 'boxLen * 0.6' },
      { name: 'boxHt', value: 'boxLen * 0.4' },
      { name: 'cylDiam', value: 'boxLen * 0.3' },
      { name: 'cylHt', value: 'boxHt * 2' },
    ],
  })

  // Box driven by expressions
  const boxId = (await api.v1.part.box({
    id: partId,
    name: 'Base',
    length: '@expr.boxLen',
    width: '@expr.boxWid',
    height: '@expr.boxHt',
  })).result
  console.log('[05] boxId:', boxId)

  // Cylinder also driven by shared expressions
  const cylId = (await api.v1.part.cylinder({
    id: partId,
    name: 'Tower',
    diameter: '@expr.cylDiam',
    height: '@expr.cylHt',
  })).result
  console.log('[05] cylId:', cylId)

  await snapshot('expr-multi-feature')

  // Now test inline formula with @expr in cylinder
  const cyl2Id = (await api.v1.part.cylinder({
    id: partId,
    name: 'SmallTower',
    diameter: '@expr.cylDiam / 2',
    height: '@expr.cylHt + 10',
  })).result
  console.log('[05] cyl2Id:', cyl2Id)

  await snapshot('expr-formula-cyl')
  return { partId, boxId, cylId, cyl2Id }
}
