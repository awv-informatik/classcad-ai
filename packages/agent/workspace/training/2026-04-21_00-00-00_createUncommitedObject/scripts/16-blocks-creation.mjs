export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'BlocksTest' })).result

  // Create a normal box first
  const normalBox = (await api.v1.part.box({ id: partId, name: 'NormalBox', length: 60, width: 40, height: 30 })).result
  console.log('[16] normalBox:', normalBox)

  // Now create an uncommitted object
  const uncommitted = (await api.v1.part.createUncommitedObject({ id: partId, type: 'CC_Cylinder', name: 'PendingCyl' })).result
  console.log('[16] uncommitted cyl:', uncommitted)

  // Try various creation APIs while uncommitted exists
  const boxR = await api.v1.part.box({ id: partId, name: 'Blocked1', length: 30, width: 20, height: 10 })
  console.log('[16] part.box:', boxR.result, 'maxLevel:', boxR.maxLevel, 'msg:', boxR.messages?.[0]?.message || 'none')

  const cylR = await api.v1.part.cylinder({ id: partId, name: 'Blocked2', height: 30, diameter: 20 })
  console.log('[16] part.cylinder:', cylR.result, 'maxLevel:', cylR.maxLevel, 'msg:', cylR.messages?.[0]?.message || 'none')

  // Try sketch creation
  const skR = await api.v1.part.sketch({ id: partId, name: 'BlockedSk' })
  console.log('[16] part.sketch:', skR.result, 'maxLevel:', skR.maxLevel, 'msg:', skR.messages?.[0]?.message || 'none')

  // Try work geometry
  const wpR = await api.v1.part.workPlane({ id: partId, name: 'BlockedWP', origin: [0, 0, 0], normal: [0, 0, 1], xDirection: [1, 0, 0] })
  console.log('[16] part.workPlane:', wpR.result, 'maxLevel:', wpR.maxLevel, 'msg:', wpR.messages?.[0]?.message || 'none')

  // Try expression creation (not a feature — should this be allowed?)
  const exprR = await api.v1.part.expression({ id: partId, toCreate: [{ name: 'testExpr', value: 42 }] })
  console.log('[16] expression:', exprR.result, 'maxLevel:', exprR.maxLevel, 'msg:', exprR.messages?.[0]?.message || 'none')

  // Try entity injection
  const eiR = await api.v1.part.entityInjection({ id: partId, name: 'BlockedEI' })
  console.log('[16] entityInjection:', eiR.result, 'maxLevel:', eiR.maxLevel, 'msg:', eiR.messages?.[0]?.message || 'none')

  filewrite({
    box: { result: boxR.result, maxLevel: boxR.maxLevel, msg: boxR.messages?.[0]?.message },
    cylinder: { result: cylR.result, maxLevel: cylR.maxLevel, msg: cylR.messages?.[0]?.message },
    sketch: { result: skR.result, maxLevel: skR.maxLevel, msg: skR.messages?.[0]?.message },
    workPlane: { result: wpR.result, maxLevel: wpR.maxLevel, msg: wpR.messages?.[0]?.message },
    expression: { result: exprR.result, maxLevel: exprR.maxLevel, msg: exprR.messages?.[0]?.message },
    entityInjection: { result: eiR.result, maxLevel: eiR.maxLevel, msg: eiR.messages?.[0]?.message },
  }, 'blocked-ops')

  return { partId }
}
