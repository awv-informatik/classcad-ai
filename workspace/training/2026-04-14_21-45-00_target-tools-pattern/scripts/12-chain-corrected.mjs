// Corrected chain test: union → subtraction → intersection → merge
// Fix: sphere uses `radius` not `diameter`
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ChainFixed' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const target = (await api.v1.solid.box({ id: eifId, length: 100, width: 80, height: 60 })).result
  console.log('[12] target:', target)

  // 1. Union — add a box on top
  const addBox = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 30, translation: [30, 20, 60] })).result
  const r1 = await api.v1.solid.union({ id: eifId, target, tools: [addBox] })
  console.log('[12] union: result=', r1.result, 'same=', r1.result === target, 'maxLevel=', r1.maxLevel)
  await snapshot('after-union')

  // 2. Subtraction — cut a cylinder hole
  const hole = (await api.v1.solid.cylinder({ id: eifId, diameter: 20, height: 100, translation: [50, 40, -10] })).result
  const r2 = await api.v1.solid.subtraction({ id: eifId, target, tools: [hole] })
  console.log('[12] sub: result=', r2.result, 'same=', r2.result === target, 'maxLevel=', r2.maxLevel)
  await snapshot('after-sub')

  // 3. Intersection — clip to a large sphere (FIXED: radius not diameter)
  const sphere = (await api.v1.solid.sphere({ id: eifId, radius: 60, translation: [50, 40, 30] })).result
  console.log('[12] sphere created:', sphere)
  const r3 = await api.v1.solid.intersection({ id: eifId, target, tools: [sphere] })
  console.log('[12] intersection: result=', r3.result, 'same=', r3.result === target, 'maxLevel=', r3.maxLevel)
  if (r3.messages?.length) console.log('[12] int messages:', JSON.stringify(r3.messages))
  await snapshot('after-intersection')

  // 4. Merge — add a small reference box
  if (r3.result !== null) {
    const mergeBox = (await api.v1.solid.box({ id: eifId, length: 20, width: 20, height: 20, translation: [90, 70, 0] })).result
    const r4 = await api.v1.solid.merge({ id: eifId, target, tools: [mergeBox] })
    console.log('[12] merge: result=', r4.result, 'same=', r4.result === target, 'maxLevel=', r4.maxLevel)
    await snapshot('after-merge')
  } else {
    console.log('[12] skipping merge — target destroyed by intersection')
  }

  filewrite({
    targetId: target,
    union: { result: r1.result, sameTarget: r1.result === target, maxLevel: r1.maxLevel },
    sub: { result: r2.result, sameTarget: r2.result === target, maxLevel: r2.maxLevel },
    intersection: { result: r3.result, sameTarget: r3.result === target, maxLevel: r3.maxLevel },
  }, 'chain-corrected-results')

  return { partId }
}
