/**
 * 02-after-create.mjs — after part.create, the part appears in tree().
 */

export default async function (api, { tree, filewrite }) {
  const r = await api.v1.part.create({ name: 'PartA' })
  const partId = r.result

  const t = await tree()
  filewrite(t, 'tree-after-create')

  const part = await tree({ id: partId })
  const allParts = await tree({ type: 'CC_Part' })

  const found = part && part.id === partId
  const named = part && part.name === 'PartA'
  console.log(`[02] partId=${partId} — found in tree: ${found ? '✓' : '❌'}`)
  console.log(`[02] name="PartA": ${named ? '✓' : '❌'} (got "${part?.name}")`)
  console.log(`[02] CC_Part count: ${allParts.length}`)
}
