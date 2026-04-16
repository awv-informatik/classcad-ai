// Compare STP versions: AP203 (1), AP214 (2), AP242 (3)
// Measure size differences and content characteristics
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'StpVersions' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })
  const cylId = (await api.v1.solid.cylinder({ id: eifId, height: 60, diameter: 20, translation: [40, 30, -10] })).result

  const results = {}

  for (const version of [1, 2, 3]) {
    const label = version === 1 ? 'AP203' : version === 2 ? 'AP214' : 'AP242'
    const r = await api.v1.common.save({ format: 'STP', encoding: 'base64', stp: { version } })
    results[label] = {
      success: r.result?.success,
      contentLength: r.result?.content?.length || 0,
      maxLevel: r.maxLevel,
      messageCount: r.messages?.length || 0,
    }
    console.log(`[06] ${label} (v${version}): success=${r.result?.success}, b64len=${r.result?.content?.length || 0}, maxLevel=${r.maxLevel}`)
  }

  // Also test asPart variants
  for (const version of [1, 2, 3]) {
    const label = version === 1 ? 'AP203' : version === 2 ? 'AP214' : 'AP242'
    const r = await api.v1.common.save({ format: 'STP', encoding: 'base64', stp: { version, asPart: 1 } })
    results[`${label}_asPart`] = {
      success: r.result?.success,
      contentLength: r.result?.content?.length || 0,
      maxLevel: r.maxLevel,
    }
    console.log(`[06] ${label} asPart: b64len=${r.result?.content?.length || 0}, maxLevel=${r.maxLevel}`)
  }

  filewrite(results, 'stp-versions')
  return { partId }
}
