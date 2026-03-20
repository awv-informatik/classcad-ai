// 14: Fillet + sketchRegion — fillet all corners, then make region, then extrude
export default async function ({ execute }, { snapshot }) {
  const partId = (await execute({ 'v1.part.create': [{ name: 'FilletExtrude' }] })).result
  const skId = (await execute({ 'v1.sketch.create': [{ id: partId }] })).result

  const lines = (await execute({ 'v1.sketch.rectangle': [{ id: skId, startPos: [0, 0, 0], endPos: [100, 80, 0] }] })).result

  // Fillet all 4 corners
  const f1 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[0], lines[1]], offset: 10 }] })
  const f2 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[1], lines[2]], offset: 10 }] })
  const f3 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[2], lines[3]], offset: 10 }] })
  const f4 = await execute({ 'v1.sketch.fillet': [{ id: skId, lineIds: [lines[3], lines[0]], offset: 10 }] })

  // Collect all geometry IDs for sketchRegion: 4 shortened lines + 4 arcs
  const arcs = [f1.result[0], f2.result[0], f3.result[0], f4.result[0]]
  const allGeom = [...lines, ...arcs]
  console.log('All geom for region:', allGeom)

  const region = await execute({ 'v1.sketch.sketchRegion': [{ id: skId, geomIds: allGeom }] })
  console.log('sketchRegion:', JSON.stringify({ result: region.result, messages: region.messages, maxLevel: region.maxLevel }))

  if (region.result) {
    await snapshot('rounded-rect-region')

    // Extrude
    const ext = await execute({ 'v1.part.extrusion': [{ id: partId, references: [region.result], limit2: 30 }] })
    console.log('Extrusion:', JSON.stringify({ result: ext.result, messages: ext.messages, maxLevel: ext.maxLevel }))
    await snapshot('rounded-rect-extruded')
  }

  return { arcs, regionId: region.result }
}
