// 13 — Verify the solid is genuinely unchanged after section (vertex/bbox comparison)
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'SectionVerify' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result

  const boxId = (await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })).result

  // Capture graphic BEFORE section
  const beforeR = await api.v1.solid.box({ id: eifId, length: 1, width: 1, height: 1 })
  // Actually, let's get the graphic from the box creation response
  // Re-do: create box, then use a no-op to get current graphic state
  // Instead let's just get the evaluation of something to trigger graphic
  // Better: just use the section call's graphic which includes the solid container

  const sectionR = await api.v1.solid.section({
    id: eifId,
    target: boxId,
    originPos: [0, 0, 0],
    normal: [0, 0, 1],
  })

  // The graphic should contain both the solid container and the section curves container
  const containers = sectionR.graphic?.containers || []
  console.log('[13] containers after section:', containers.length)

  for (const c of containers) {
    const vertCount = c.vertices ? c.vertices.length / 3 : 0
    const edgeCount = c.edges ? c.edges.length : 0
    console.log(`[13] container id=${c.id} type=${c.type} owner=${c.owner} verts=${vertCount} edges=${edgeCount}`)
    console.log(`[13]   bbox min: ${JSON.stringify(c.properties?.min)} max: ${JSON.stringify(c.properties?.max)}`)
  }

  filewrite(sectionR.graphic, 'graphic-after-section')

  // Now create another box (without section) to compare
  const partId2 = (await api.v1.part.create({ name: 'ControlBox' })).result
  const eifId2 = (await api.v1.part.entityInjection({ id: partId2, name: 'EIF2' })).result
  const boxId2 = (await api.v1.solid.box({ id: eifId2, length: 80, width: 60, height: 40 })).result

  const controlR = await api.v1.common.getAppVersion({})
  filewrite(controlR.graphic, 'graphic-control')

  const controlContainers = controlR.graphic?.containers || []
  console.log('[13] control containers:', controlContainers.length)
  for (const c of controlContainers) {
    const vertCount = c.vertices ? c.vertices.length / 3 : 0
    console.log(`[13] control container id=${c.id} type=${c.type} verts=${vertCount}`)
    console.log(`[13]   bbox min: ${JSON.stringify(c.properties?.min)} max: ${JSON.stringify(c.properties?.max)}`)
  }

  return { partId, boxId }
}
