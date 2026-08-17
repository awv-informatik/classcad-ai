// Test recalc with no args vs empty object — both should work
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'ParamTest' })).result

  // recalc with no args
  const r1 = await api.v1.common.recalc()
  console.log('[15] recalc(): result:', r1.result, 'maxLevel:', r1.maxLevel)

  // recalc with empty object
  const r2 = await api.v1.common.recalc({})
  console.log('[15] recalc({}): result:', r2.result, 'maxLevel:', r2.maxLevel)

  filewrite({
    noArgs: { result: r1.result, maxLevel: r1.maxLevel },
    emptyObj: { result: r2.result, maxLevel: r2.maxLevel },
    identical: r1.result === r2.result && r1.maxLevel === r2.maxLevel
  }, 'no-params-vs-empty')

  return { identical: r1.result === r2.result && r1.maxLevel === r2.maxLevel }
}
