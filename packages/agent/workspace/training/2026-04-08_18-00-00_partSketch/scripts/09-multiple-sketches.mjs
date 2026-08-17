// 09 — Create multiple sketches via part.sketch, verify IDs and structure
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'Test' })).result

  const ids = []
  for (let i = 1; i <= 5; i++) {
    const r = await api.v1.part.sketch({ id: partId, name: `Sketch${i}` })
    ids.push(r.result)
    console.log(`[09] sketch ${i}: id=${r.result} maxLevel=${r.maxLevel}`)
  }

  // Check ID spacing
  for (let i = 1; i < ids.length; i++) {
    console.log(`[09] id gap ${i-1}→${i}: ${ids[i] - ids[i-1]}`)
  }

  // Get structure after all sketches
  const r = await api.v1.common.getAppVersion({})
  filewrite(r.structure, 'structure-5-sketches')

  return { partId, sketchIds: ids }
}
