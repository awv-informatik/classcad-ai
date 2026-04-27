export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'FullPart' })).result
  console.log('[05] tplId:', tplId)

  // Inspect the template node's internal structure
  const r = await api.v1.assembly.partTemplate({ name: 'Dummy' })
  const tplNode = r.structure?.tree?.[String(tplId)]
  console.log('[05] template class:', tplNode?.class)
  console.log('[05] template parent:', tplNode?.parent)
  console.log('[05] template children:', JSON.stringify(tplNode?.children))
  console.log('[05] template expressionSet:', tplNode?.expressionSet)
  console.log('[05] template geometrySet:', tplNode?.geometrySet)
  console.log('[05] template flags:', tplNode?.flags)

  filewrite(tplNode, 'template-node-detail')

  // Build comprehensive content inside the first template
  // 1. Expression
  const exprR = await api.v1.part.expression({
    id: tplId,
    toCreate: [{ name: 'width', value: 60 }, { name: 'height', value: 'width * 0.5' }],
  })
  console.log('[05] expression result:', exprR.result, 'maxLevel:', exprR.maxLevel)

  // 2. Get expression
  const getExpr = await api.v1.part.getExpression({ id: tplId, name: 'height' })
  console.log('[05] getExpression height:', JSON.stringify(getExpr.result))

  // 3. Sketch
  const skR = await api.v1.part.sketch({ id: tplId, name: 'Sk1' })
  console.log('[05] sketch result:', skR.result, 'maxLevel:', skR.maxLevel)

  // 4. Work geometry
  const wpR = await api.v1.part.workPlane({
    id: tplId,
    name: 'WP1',
    origin: [0, 0, 50],
    normal: [0, 0, 1],
    xDirection: [1, 0, 0],
  })
  console.log('[05] workPlane result:', wpR.result, 'maxLevel:', wpR.maxLevel)

  // 5. Box feature
  const boxR = await api.v1.part.box({ id: tplId, name: 'MainBox', length: 80, width: 50, height: 30 })
  console.log('[05] box result:', boxR.result, 'maxLevel:', boxR.maxLevel)

  // Dump final structure of this template
  const finalNode = boxR.structure?.tree?.[String(tplId)]
  console.log('[05] final children:', JSON.stringify(finalNode?.children))
  filewrite(finalNode, 'template-with-content')

  return { asmId, tplId }
}
