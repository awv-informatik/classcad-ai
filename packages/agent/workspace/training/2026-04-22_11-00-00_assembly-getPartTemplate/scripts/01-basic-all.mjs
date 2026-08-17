export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  const t1 = (await api.v1.assembly.partTemplate({ name: 'Alpha' })).result
  const t2 = (await api.v1.assembly.partTemplate({ name: 'Beta' })).result
  const t3 = (await api.v1.assembly.partTemplate({ name: 'Gamma' })).result

  console.log('[01] created templates:', t1, t2, t3)

  // No params
  const rNone = await api.v1.assembly.getPartTemplate()
  console.log('[01] getPartTemplate() result:', JSON.stringify(rNone.result), 'maxLevel:', rNone.maxLevel)

  // Empty object
  const rEmpty = await api.v1.assembly.getPartTemplate({})
  console.log('[01] getPartTemplate({}) result:', JSON.stringify(rEmpty.result), 'maxLevel:', rEmpty.maxLevel)

  // Undefined name
  const rUndef = await api.v1.assembly.getPartTemplate({ name: undefined })
  console.log('[01] getPartTemplate({name:undefined}) result:', JSON.stringify(rUndef.result), 'maxLevel:', rUndef.maxLevel)

  filewrite({
    noParams: { result: rNone.result, maxLevel: rNone.maxLevel, messages: rNone.messages },
    emptyObj: { result: rEmpty.result, maxLevel: rEmpty.maxLevel, messages: rEmpty.messages },
    undefName: { result: rUndef.result, maxLevel: rUndef.maxLevel, messages: rUndef.messages },
  }, 'all-variants')

  return { asmId, t1, t2, t3 }
}
