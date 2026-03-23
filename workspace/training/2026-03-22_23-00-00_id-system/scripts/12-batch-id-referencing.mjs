// Q: In batch, can you reference IDs from earlier jobs? Or must you pre-compute them?
export default async function (api) {
  // Batch: create part then try to use its ID for a box
  // Since batch returns array of results, you'd need to know the ID in advance
  const r1 = await api.v1.common.batch({
      jobs: [
        { api: 'v1.part.create', param: { name: 'BatchPart' } },
        // We don't know the partId yet — try using a literal number
        { api: 'v1.part.box', param: { id: 4, name: 'BatchBox' } },
      ]
    })
  console.log('[12] batch result:', JSON.stringify(r1.result?.map((r, i) => ({
    job: i,
    result: r.result,
    maxLevel: r.maxLevel,
    msgs: r.messages?.map(m => m.message)
  })), null, 2))
  console.log('[12] batch maxLevel:', r1.maxLevel)
}
