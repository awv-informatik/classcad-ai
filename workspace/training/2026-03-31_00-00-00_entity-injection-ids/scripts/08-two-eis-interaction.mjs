// Q: Can solids from different EIs interact via boolean? solid.subtraction takes EI id + target/tools solid ids.
// What if target is in ei1 but we pass ei1 as id and tool from ei2?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const ei1 = (await api.v1.part.entityInjection({ id: partId, name: 'EI_1' })).result
  const ei2 = (await api.v1.part.entityInjection({ id: partId, name: 'EI_2' })).result
  console.log('[08] ei1:', ei1, 'ei2:', ei2)

  // Box in EI1
  const box1 = (await api.v1.solid.box({ id: ei1, length: 80, width: 80, height: 80 })).result
  // Box in EI2 (overlapping)
  const box2 = (await api.v1.solid.box({ id: ei2, length: 50, width: 50, height: 50, translation: [20, 20, 20] })).result
  console.log('[08] box1:', box1, '(in ei1) box2:', box2, '(in ei2)')

  await snapshot('two-eis-before-subtraction')

  // Try subtraction with target from ei1 and tool from ei2
  const subR = await api.v1.solid.subtraction({
    id: ei1, target: box1, tools: [box2]
  })
  console.log('[08] cross-EI subtraction — result:', subR.result, 'maxLevel:', subR.maxLevel)
  if (subR.messages) {
    for (const m of subR.messages) {
      console.log('[08] msg:', m.message, 'level:', m.level, 'code:', m.code)
    }
  }
  filewrite({ result: subR.result, messages: subR.messages, maxLevel: subR.maxLevel }, 'cross-ei-subtraction')

  await snapshot('two-eis-after-subtraction')
  return { partId, ei1, ei2, box1, box2 }
}
