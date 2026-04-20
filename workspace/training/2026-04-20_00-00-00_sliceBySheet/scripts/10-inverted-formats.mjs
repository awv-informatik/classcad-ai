export default async function (api, { snapshot, filewrite }) {
  // Test different inverted formats: 1, true, 'TRUE'
  const formats = [
    { label: 'int-1', value: 1 },
    { label: 'bool-true', value: true },
    { label: 'str-TRUE', value: 'TRUE' },
  ]

  for (const fmt of formats) {
    const partId = (await api.v1.part.create({ name: `Inv_${fmt.label}` })).result
    const boxId = (await api.v1.part.box({
      id: partId, name: 'Box', length: 80, width: 60, height: 50,
    })).result

    const frontId = (await api.v1.part.getWorkGeometry({ id: partId, name: 'Front' })).result
    const skId = (await api.v1.sketch.create({ id: partId, planeId: frontId })).result
    const rectIds = (await api.v1.sketch.rectangle({
      id: skId, startPos: [-20, 25, 0], endPos: [100, 200, 0],
    })).result
    const regionId = (await api.v1.sketch.sketchRegion({ id: skId, geomIds: rectIds })).result
    const sheetId = (await api.v1.part.extrusion({
      id: partId, name: 'Sheet', references: [regionId],
      type: 'UP', limit2: 80, capEnds: 0,
    })).result

    const r = await api.v1.part.sliceBySheet({
      id: partId, target: boxId, tool: sheetId, inverted: fmt.value,
    })
    console.log(`[10] ${fmt.label}: result=${r.result} maxLevel=${r.maxLevel}`)
    if (r.messages?.length) console.log(`[10] ${fmt.label} msgs:`, JSON.stringify(r.messages?.map(m => m.message)))

    if (r.result) {
      for (const [nid, node] of Object.entries(r.structure?.tree || {})) {
        if (node.class === 'CC_SliceBySheet') {
          for (const cid of (node.children || [])) {
            const cn = r.structure.tree[String(cid)]
            console.log(`[10] ${fmt.label} body:`, cn?.class)
          }
        }
      }
      await snapshot(fmt.label)
    }
  }

  return {}
}
