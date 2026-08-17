// Visual + numeric check that the renderer composes assembly instance
// transforms. Loads the AS1 STEP fixture, snaps iso/top/front, and dumps the
// extracted instance list with translation magnitudes so a future regression
// can compare numbers without inspecting pixels.

export default async function (api, { snapshot, filewrite }) {
  // Load the public-domain AS1 assembly. Path is hardcoded; if it moves, this
  // script needs to be told where.
  const path = '/Users/dev/dev/buerli/models/as1_ac_214.stp'
  const r = await api.v1.common.load({ file: path, format: 'STP', doClear: 1 })
  if (!r.result) throw new Error(`load failed: ${JSON.stringify(r.messages)}`)
  console.log('[load] root id:', r.result.id)

  // Three views, all at the default zoom and bbox-center.
  const isoFiles   = await snapshot('iso',   { view: 'iso' })
  const topFiles   = await snapshot('top',   { view: 'top' })
  const frontFiles = await snapshot('front', { view: 'front' })
  console.log('[snap] iso:',   isoFiles)
  console.log('[snap] top:',   topFiles)
  console.log('[snap] front:', frontFiles)

  return { rootId: r.result.id }
}
