export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'RealisticWorkflow' })).result

  // Create a bracket shape (box with a hole)
  const baseId = (await api.v1.part.box({
    id: partId, name: 'Base',
    length: 60, width: 40, height: 10,
  })).result

  const postId = (await api.v1.part.box({
    id: partId, name: 'Post',
    length: 10, width: 40, height: 50,
    xPosition: 50, yPosition: 0, zPosition: 10,
  })).result

  // Reference marker at origin
  const markerCyl = (await api.v1.part.cylinder({
    id: partId, name: 'Marker',
    radius: 3, height: 80,
    xPosition: -15, yPosition: -15, zPosition: 0,
  })).result

  await snapshot('step1-initial')

  // Define "from" WCS at corner of bracket and "to" WCS at desired mounting position
  const wcsFrom = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_Local',
    offset: [0, 0, 0],
  })).result

  const wcsTo = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_Mount',
    offset: [30, 50, 20],
    rotation: [0, 0, Math.PI / 6],
  })).result

  // Transform both bracket parts to mounting position
  const tId = (await api.v1.part.transformationByCSys({
    id: partId,
    name: 'MountBracket',
    targets: [baseId, postId],
    references: [wcsTo, wcsFrom],
  })).result

  console.log('[17] mount transform:', tId)
  await snapshot('step2-mounted')

  // Update: adjust mounting angle
  await api.v1.part.openFeature({ id: tId })

  const wcsTo2 = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_Mount2',
    offset: [30, 50, 20],
    rotation: [0, 0, Math.PI / 3],
  })).result

  const r = await api.v1.part.updateTransformationByCSys({
    id: tId,
    references: [wcsTo2, wcsFrom],
  })

  console.log('[17] updated mount:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'workflow-response')

  await api.v1.part.closeFeature({ id: tId })
  await snapshot('step3-adjusted')

  return { partId }
}
