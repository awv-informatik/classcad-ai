export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Create a bracket template with a named WCS for mating
  const bracketTpl = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
  await api.v1.part.box({ id: bracketTpl, name: 'Body', length: 60, width: 40, height: 10 })
  const mateWcs = (await api.v1.part.workCSys({
    id: bracketTpl, name: 'MatePoint',
    origin: [30, 20, 10], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result
  console.log('[04] bracket MatePoint WCS:', mateWcs)
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create a bolt template with a named WCS at its base
  const boltTpl = (await api.v1.assembly.partTemplate({ name: 'Bolt' })).result
  await api.v1.part.cylinder({ id: boltTpl, name: 'Shaft', diameter: 8, height: 30 })
  const boltBase = (await api.v1.part.workCSys({
    id: boltTpl, name: 'Base',
    origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result
  console.log('[04] bolt Base WCS:', boltBase)
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create instances
  const bracketInst = (await api.v1.assembly.instance({ productId: bracketTpl, ownerId: asmId, name: 'BracketInst' })).result
  const boltInst = (await api.v1.assembly.instance({
    productId: boltTpl, ownerId: asmId, name: 'BoltInst',
    transformation: [[100, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  console.log('[04] bracketInst:', bracketInst, 'boltInst:', boltInst)

  await snapshot('before-constraint')

  // Look up work geometry on instances using assembly.getWorkGeometry
  const bracketMate = (await api.v1.assembly.getWorkGeometry({ id: bracketInst, name: 'MatePoint' })).result
  const boltBaseMate = (await api.v1.assembly.getWorkGeometry({ id: boltInst, name: 'Base' })).result
  console.log('[04] bracketMate (looked up):', bracketMate, '=== template WCS?', bracketMate === mateWcs)
  console.log('[04] boltBaseMate (looked up):', boltBaseMate, '=== template WCS?', boltBaseMate === boltBase)

  // Use the looked-up WCS IDs in a fastened constraint
  const constraintRes = await api.v1.assembly.fastened({
    id: asmId,
    name: 'BoltAttach',
    mate1: { path: [bracketInst], csys: bracketMate },
    mate2: { path: [boltInst], csys: boltBaseMate },
  })
  console.log('[04] fastened result:', constraintRes.result, 'maxLevel:', constraintRes.maxLevel)

  if (constraintRes.maxLevel > 31) {
    console.log('[04] constraint error:', constraintRes.messages?.[0]?.message)
  }

  await snapshot('after-constraint')

  // Measure positions to verify
  const bracketCog = (await api.v1.part.calculateMassProperties({ id: bracketInst })).result
  const boltCog = (await api.v1.part.calculateMassProperties({ id: boltInst })).result
  console.log('[04] bracketCog:', bracketCog?.centerOfGravity)
  console.log('[04] boltCog:', boltCog?.centerOfGravity)

  filewrite({
    bracketMate, boltBaseMate,
    constraintId: constraintRes.result,
    constraintMaxLevel: constraintRes.maxLevel,
    constraintMsg: constraintRes.messages,
    bracketCog: bracketCog?.centerOfGravity,
    boltCog: boltCog?.centerOfGravity,
  }, 'constraint-usage')

  return { asmId }
}
