export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'UseBeforeCommit' })).result

  // Create an uncommitted box
  const boxId = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Box', name: 'PreCommitBox' })).result
  console.log('[15] uncommitted boxId:', boxId)

  // Try to use it as a boolean target before committing
  const box2 = (await api.v1.part.box({ id: partId, name: 'ToolBox', length: 30, width: 30, height: 30, translation: [10, 10, 10] })).result
  console.log('[15] toolBox:', box2)

  // Try boolean with uncommitted as target
  const boolR = await api.v1.part.boolean({ id: partId, name: 'Bool1', type: 'UNION', target: boxId, tools: [box2] })
  console.log('[15] boolean with uncommitted target:', boolR.result, 'maxLevel:', boolR.maxLevel, 'msg:', boolR.messages?.[0]?.message || 'none')

  // Try expression linking on uncommitted feature
  await api.v1.part.expression({ id: partId, toCreate: [{ name: 'myLen', value: 80 }] })
  const linkR = await api.v1.part.linkWithExpression({ id: boxId, exprName: 'myLen', name: 'length' })
  console.log('[15] linkWithExpression on uncommitted:', linkR.result, 'maxLevel:', linkR.maxLevel, 'msg:', linkR.messages?.[0]?.message || 'none')

  // Try calculateMassProperties on uncommitted
  const massR = await api.v1.part.calculateMassProperties({ id: partId })
  console.log('[15] mass properties:', JSON.stringify(massR.result))

  filewrite({
    boolean: { result: boolR.result, maxLevel: boolR.maxLevel, messages: boolR.messages },
    link: { result: linkR.result, maxLevel: linkR.maxLevel, messages: linkR.messages },
    mass: { result: massR.result, maxLevel: massR.maxLevel },
  }, 'before-commit-ops')

  return { partId }
}
