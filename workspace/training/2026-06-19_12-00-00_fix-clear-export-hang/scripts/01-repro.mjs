// TODO #64 minimal repro: clear({keepIds}) then STEP export. Does it hang on the
// partially-cleared state? Tested against the entry-48 boolean-cleanup fix.
export default async function (api, { filewrite }) {
  const withTimeout = (p, ms, l) =>
    Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`HUNG (${ms}ms): ${l}`)), ms))])

  const partId = (await api.v1.part.create({ name: 'KeepTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF1' })).result
  const boxId = (await api.v1.solid.box({ id: eifId, length: 60, width: 40, height: 30 })).result
  console.log('[64] part', partId, 'eif', eifId, 'box', boxId)

  const c = await api.v1.common.clear({ keepIds: [partId] })
  console.log('[64] clear keepIds=[partId] maxLevel', c.maxLevel)

  try {
    const r = await withTimeout(api.v1.common.save({ format: 'STP', encoding: 'base64', stp: { version: 2 } }), 12000, 'save STP')
    console.log('[64] save returned: maxLevel', r.maxLevel, '-> NOT hanging')
    filewrite({ save: { maxLevel: r.maxLevel, hung: false } }, '64-result')
  } catch (e) {
    console.error('[64]', e.message)
    filewrite({ save: { hung: true } }, '64-result')
  }
}
