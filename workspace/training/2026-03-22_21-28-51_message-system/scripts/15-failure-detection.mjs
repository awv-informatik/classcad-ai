// Q: What's the reliable failure detection pattern?
// Options: check result===null, check maxLevel>31, check messages.length>0
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const tests = []

  // 1. Success — result=ID, maxLevel=31, messages=[]
  const r1 = await api.v1.part.box({ id: partId, xLen: 50, yLen: 50, zLen: 50 })
  tests.push({ case: 'success box', result: r1.result, resultNull: r1.result === null, maxLevel: r1.maxLevel, msgCount: r1.messages.length })

  // 2. Error — result=null, maxLevel=51, messages=[...]
  const r2 = await api.v1.part.box({})
  tests.push({ case: 'error missing param', result: r2.result, resultNull: r2.result === null, maxLevel: r2.maxLevel, msgCount: r2.messages.length })

  // 3. VOID success — result=null but OK (e.g., setObjectName)
  const boxId = r1.result
  const r3 = await api.v1.common.setObjectName({ id: boxId, name: 'MyBox' })
  tests.push({ case: 'VOID success', result: r3.result, resultNull: r3.result === null, maxLevel: r3.maxLevel, msgCount: r3.messages.length })

  // 4. Silent error — result=null, maxLevel=31, messages=[]
  const r4 = await api.v1.common.evaluateExpression({ expression: 'bad!!!', silent: true })
  tests.push({ case: 'silent error', result: r4.result, resultNull: r4.result === null, maxLevel: r4.maxLevel, msgCount: r4.messages.length })

  // 5. getUserData missing key — result="" (empty string), not null
  const r5 = await api.v1.common.getUserData({ id: boxId, key: 'nonexistent' })
  tests.push({ case: 'missing key', result: r5.result, resultNull: r5.result === null, maxLevel: r5.maxLevel, msgCount: r5.messages.length })

  console.log('[15] Failure detection matrix:')
  for (const t of tests) {
    console.log(`  ${t.case}: result=${JSON.stringify(t.result)} null=${t.resultNull} maxLevel=${t.maxLevel} msgs=${t.msgCount}`)
  }

  console.log('\n[15] Conclusion:')
  console.log('  result===null is NOT reliable (VOID returns null on success)')
  console.log('  maxLevel>31 IS reliable for detecting warnings/errors')
  console.log('  BUT silent mode suppresses messages AND keeps maxLevel=31')
}
