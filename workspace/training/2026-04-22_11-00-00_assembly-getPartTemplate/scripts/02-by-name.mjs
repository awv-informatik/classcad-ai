export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'TestAsm' })).result

  const t1 = (await api.v1.assembly.partTemplate({ name: 'Alpha' })).result
  const t2 = (await api.v1.assembly.partTemplate({ name: 'Beta' })).result
  const t3 = (await api.v1.assembly.partTemplate({ name: 'Gamma' })).result

  // Lookup by exact name
  const rAlpha = await api.v1.assembly.getPartTemplate({ name: 'Alpha' })
  console.log('[02] Alpha:', rAlpha.result, 'maxLevel:', rAlpha.maxLevel)

  const rBeta = await api.v1.assembly.getPartTemplate({ name: 'Beta' })
  console.log('[02] Beta:', rBeta.result, 'maxLevel:', rBeta.maxLevel)

  const rGamma = await api.v1.assembly.getPartTemplate({ name: 'Gamma' })
  console.log('[02] Gamma:', rGamma.result, 'maxLevel:', rGamma.maxLevel)

  // Case sensitivity
  const rLower = await api.v1.assembly.getPartTemplate({ name: 'alpha' })
  console.log('[02] alpha (lowercase):', rLower.result, 'maxLevel:', rLower.maxLevel)

  const rUpper = await api.v1.assembly.getPartTemplate({ name: 'ALPHA' })
  console.log('[02] ALPHA (uppercase):', rUpper.result, 'maxLevel:', rUpper.maxLevel)

  // Partial match
  const rPartial = await api.v1.assembly.getPartTemplate({ name: 'Alp' })
  console.log('[02] Alp (partial):', rPartial.result, 'maxLevel:', rPartial.maxLevel)

  filewrite({
    alpha: { result: rAlpha.result, maxLevel: rAlpha.maxLevel },
    beta: { result: rBeta.result, maxLevel: rBeta.maxLevel },
    gamma: { result: rGamma.result, maxLevel: rGamma.maxLevel },
    lowercase: { result: rLower.result, maxLevel: rLower.maxLevel, messages: rLower.messages },
    uppercase: { result: rUpper.result, maxLevel: rUpper.maxLevel, messages: rUpper.messages },
    partial: { result: rPartial.result, maxLevel: rPartial.maxLevel, messages: rPartial.messages },
  }, 'name-lookup')

  return { asmId }
}
