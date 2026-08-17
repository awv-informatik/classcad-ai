// Investigate: In script 07, intersection returned null (target destroyed), then merge on
// same target ID succeeded. Is this because the target was only "partially" destroyed,
// or did something else happen?
// Reproduce the exact script 07 chain and check what state the target is in after each op.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Mystery' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result

  const target = (await api.v1.solid.box({ id: eifId, length: 100, width: 80, height: 60 })).result
  console.log('[10] target:', target)

  // 1. Union
  const addBox = (await api.v1.solid.box({ id: eifId, length: 40, width: 40, height: 30, translation: [30, 20, 60] })).result
  const r1 = await api.v1.solid.union({ id: eifId, target, tools: [addBox] })
  console.log('[10] after union: result=', r1.result, 'maxLevel=', r1.maxLevel)

  // 2. Subtraction
  const hole = (await api.v1.solid.cylinder({ id: eifId, diameter: 20, height: 100, translation: [50, 40, -10] })).result
  const r2 = await api.v1.solid.subtraction({ id: eifId, target, tools: [hole] })
  console.log('[10] after sub: result=', r2.result, 'maxLevel=', r2.maxLevel)

  // 3. Intersection — same sphere as script 07
  const sphere = (await api.v1.solid.sphere({ id: eifId, diameter: 120, translation: [50, 40, 30] })).result
  const r3 = await api.v1.solid.intersection({ id: eifId, target, tools: [sphere] })
  console.log('[10] after intersection: result=', r3.result, 'maxLevel=', r3.maxLevel)
  console.log('[10] intersection messages:', JSON.stringify(r3.messages))

  // Check if the target ID is still addressable
  const rTranslate = await api.v1.solid.translation({ id: eifId, target, translation: [0, 0, 1] })
  console.log('[10] translate after int: maxLevel=', rTranslate.maxLevel)

  // 4. Merge — same as script 07
  const mergeBox = (await api.v1.solid.box({ id: eifId, length: 30, width: 30, height: 30, translation: [80, 60, 0] })).result
  const r4 = await api.v1.solid.merge({ id: eifId, target, tools: [mergeBox] })
  console.log('[10] merge after destroyed int: result=', r4.result, 'maxLevel=', r4.maxLevel)
  console.log('[10] merge messages:', JSON.stringify(r4.messages))

  filewrite({
    union: { result: r1.result, maxLevel: r1.maxLevel },
    sub: { result: r2.result, maxLevel: r2.maxLevel },
    intersection: { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages },
    translateAfterInt: { maxLevel: rTranslate.maxLevel },
    merge: { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages }
  }, 'mystery-results')

  return { partId }
}
