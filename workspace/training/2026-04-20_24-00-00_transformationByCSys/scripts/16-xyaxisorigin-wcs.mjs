export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'XYAxisOrigin' })).result

  const boxId = (await api.v1.part.box({
    id: partId, name: 'Box1',
    length: 40, width: 30, height: 20,
  })).result

  const refCyl = (await api.v1.part.cylinder({
    id: partId, name: 'RefCyl',
    radius: 5, height: 60,
    xPosition: -30, yPosition: -30, zPosition: 0,
  })).result

  await snapshot('before')

  // Create WCS using work points as references for XYAXISORIGIN type
  const wpOrigin = (await api.v1.part.workPoint({
    id: partId, name: 'WP_Origin',
    position: [0, 0, 0],
  })).result

  const wpX = (await api.v1.part.workPoint({
    id: partId, name: 'WP_X',
    position: [1, 0, 0],
  })).result

  const wpY = (await api.v1.part.workPoint({
    id: partId, name: 'WP_Y',
    position: [0, 1, 0],
  })).result

  const wpOrigin2 = (await api.v1.part.workPoint({
    id: partId, name: 'WP_Origin2',
    position: [50, 30, 0],
  })).result

  const wpX2 = (await api.v1.part.workPoint({
    id: partId, name: 'WP_X2',
    position: [51, 30, 0],
  })).result

  const wpY2 = (await api.v1.part.workPoint({
    id: partId, name: 'WP_Y2',
    position: [50, 31, 0],
  })).result

  // XYAXISORIGIN WCS — uses references for origin, X-axis, Y-axis
  const wcsFrom = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_XY_From',
    type: 'XYAXISORIGIN',
    references: [wpOrigin, wpX, wpY],
  })).result
  console.log('[16] wcsFrom (XYAXISORIGIN):', wcsFrom)

  const wcsTo = (await api.v1.part.workCSys({
    id: partId, name: 'WCS_XY_To',
    type: 'XYAXISORIGIN',
    references: [wpOrigin2, wpX2, wpY2],
  })).result
  console.log('[16] wcsTo (XYAXISORIGIN):', wcsTo)

  const r = await api.v1.part.transformationByCSys({
    id: partId,
    name: 'XYAxisTransform',
    targets: [boxId],
    references: [wcsTo, wcsFrom],
  })

  console.log('[16] transform result:', r.result, 'maxLevel:', r.maxLevel)
  filewrite({ result: r.result, messages: r.messages, maxLevel: r.maxLevel }, 'xyaxis-response')

  await snapshot('after')
  return { partId }
}
