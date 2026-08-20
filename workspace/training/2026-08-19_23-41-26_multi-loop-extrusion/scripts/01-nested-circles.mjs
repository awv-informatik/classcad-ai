// 01 — nested concentric circles: regions in the tree, and what each references
// variant extrudes. Signatures (h=10): disk 28274.33, annulus 25132.74,
// disk+plug as two bodies 31415.93 (sum).
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'NestedCircles' })).result
  const rc0 = await api.v1.common.recalc()
  const top = Object.values(rc0.structure.tree).find((n) => n.class === 'CC_WorkPlane' && n.name === 'Top')
  const skId = (await api.v1.sketch.create({ id: partId, planeId: top.id })).result

  const outer = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 30, genFixation: false })).result
  const inner = (await api.v1.sketch.circle({ id: skId, centerPos: [0, 0, 0], radius: 10, genFixation: false })).result
  const rc = await api.v1.common.recalc()

  // what region-ish nodes exist?
  const regionNodes = Object.values(rc.structure.tree).filter((n) => /region/i.test(n.class) || /region/i.test(n.name || ''))
  console.log(
    '[01] regions in tree:',
    JSON.stringify(regionNodes.map((n) => ({ id: n.id, class: n.class, name: n.name, parent: n.parent }))),
  )
  filewrite(regionNodes, 'region-nodes')

  const bodies = async () => {
    const g = await api.graphic()
    return Object.values(g.containers || g).filter((c) => (c.meshes || c.faces || []).length > 0).length
  }
  const measure = async (label, refs) => {
    const r = await api.v1.part.extrusion({ id: partId, name: 'E_' + label, references: refs, type: 'UP', limit2: 10 })
    const ext = r.result
    let vol = null,
      nb = null,
      cog = null
    if (ext) {
      const mp = (await api.v1.part.calculateMassProperties({ id: partId })).result
      vol = mp?.volume
      cog = mp?.cog
      nb = await bodies()
    }
    console.log(
      `[01] refs=${label}: ext ${ext} maxLevel ${r.maxLevel} vol ${vol?.toFixed(2)} bodies ${nb}${r.messages?.length ? ' msgs ' + JSON.stringify(r.messages).slice(0, 150) : ''}`,
    )
    if (ext) await api.v1.part.deleteFeature({ ids: [ext] })
    await api.v1.common.recalc()
    return { label, ext, maxLevel: r.maxLevel, vol, bodies: nb }
  }

  const out = []
  out.push(await measure('outer-only', [outer]))
  out.push(await measure('outer+inner', [outer, inner]))
  // region ids as references, if regions exist
  for (const rn of regionNodes) {
    out.push(await measure('region-' + rn.name, [rn.id]))
  }
  filewrite(out, 'results')
  return out
}
