export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Test' })).result

  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Alpha' })).result
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Beta' })).result

  const rExact = await api.v1.assembly.getPartTemplate({ name: 'Alpha' })
  const rCase1 = await api.v1.assembly.getPartTemplate({ name: 'alpha' })
  const rCase2 = await api.v1.assembly.getPartTemplate({ name: 'ALPHA' })
  const rPartial = await api.v1.assembly.getPartTemplate({ name: 'Alp' })
  const rMissing = await api.v1.assembly.getPartTemplate({ name: 'Nonexistent' })
  const rBeta = await api.v1.assembly.getPartTemplate({ name: 'Beta' })

  console.log('[02] exact Alpha:', rExact.result, 'maxLevel:', rExact.maxLevel, 'type:', typeof rExact.result, 'isArray:', Array.isArray(rExact.result))
  console.log('[02] lowercase alpha:', rCase1.result, 'maxLevel:', rCase1.maxLevel)
  console.log('[02] uppercase ALPHA:', rCase2.result, 'maxLevel:', rCase2.maxLevel)
  console.log('[02] partial Alp:', rPartial.result, 'maxLevel:', rPartial.maxLevel)
  console.log('[02] missing:', rMissing.result, 'maxLevel:', rMissing.maxLevel)
  console.log('[02] exact Beta:', rBeta.result, 'maxLevel:', rBeta.maxLevel)

  filewrite({
    tplIds: { tpl1, tpl2 },
    exact: { result: rExact.result, maxLevel: rExact.maxLevel, type: typeof rExact.result, isArray: Array.isArray(rExact.result) },
    lowercase: { result: rCase1.result, maxLevel: rCase1.maxLevel, messages: rCase1.messages },
    uppercase: { result: rCase2.result, maxLevel: rCase2.maxLevel },
    partial: { result: rPartial.result, maxLevel: rPartial.maxLevel },
    missing: { result: rMissing.result, maxLevel: rMissing.maxLevel },
    beta: { result: rBeta.result, maxLevel: rBeta.maxLevel },
  }, 'by-name-results')

  return { asmId }
}
