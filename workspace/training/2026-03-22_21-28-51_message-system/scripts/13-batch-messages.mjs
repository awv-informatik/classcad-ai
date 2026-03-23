// Q: How do messages work in batch? Does each sub-call get its own messages? Or merged?
export default async function (api) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  // Batch with mix of success and failure
  const r1 = await api.v1.common.batch({
      jobs: [
        { api: 'v1.common.getAppVersion' },
        { api: 'v1.part.box', param: {} },  // will fail — no id
        { api: 'v1.common.getClassFileVersion' },
      ]
    })
  console.log('[13] batch mixed:', JSON.stringify(r1, (k, v) => k === 'structure' || k === 'graphic' ? undefined : v, 2))

  // Batch with all success
  const r2 = await api.v1.common.batch({
      jobs: [
        { api: 'v1.common.getAppVersion' },
        { api: 'v1.common.getClassFileVersion' },
      ]
    })
  console.log('[13] batch all success:', JSON.stringify({ result: r2.result, msgs: r2.messages, maxLevel: r2.maxLevel }, null, 2))
}
