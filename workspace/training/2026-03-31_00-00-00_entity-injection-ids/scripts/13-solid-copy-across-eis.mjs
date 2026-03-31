// Q: solid.copy takes EI id + target solid id. Can you copy a solid from one EI to another?
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result
  const ei1 = (await api.v1.part.entityInjection({ id: partId, name: 'EI_Source' })).result
  const ei2 = (await api.v1.part.entityInjection({ id: partId, name: 'EI_Dest' })).result

  const boxId = (await api.v1.solid.box({ id: ei1, length: 60, width: 40, height: 30 })).result
  console.log('[13] ei1:', ei1, 'ei2:', ei2, 'boxId:', boxId)

  await snapshot('before-copy')

  // Copy solid from ei1 into ei2
  const copyR = await api.v1.solid.copy({ id: ei2, target: boxId, translation: [100, 0, 0] })
  console.log('[13] copy cross-EI — result:', copyR.result, 'maxLevel:', copyR.maxLevel)
  if (copyR.messages) {
    for (const m of copyR.messages) {
      console.log('[13] msg:', m.message, 'level:', m.level)
    }
  }
  filewrite({ result: copyR.result, messages: copyR.messages, maxLevel: copyR.maxLevel }, 'cross-ei-copy')

  await snapshot('after-copy')
  return { partId, ei1, ei2, boxId, copyId: copyR.result }
}
