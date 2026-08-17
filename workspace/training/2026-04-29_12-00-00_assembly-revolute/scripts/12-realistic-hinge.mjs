export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'DoorHinge' })).result

  // Frame template (door frame)
  const frameTpl = (await api.v1.assembly.partTemplate({ name: 'Frame' })).result
  await api.v1.part.box({ id: frameTpl, name: 'Frame', length: 10, width: 80, height: 120 })
  const frameHingeTop = (await api.v1.part.workCSys({
    id: frameTpl, name: 'HingeTop', origin: [5, 0, 100],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const frameHingeBot = (await api.v1.part.workCSys({
    id: frameTpl, name: 'HingeBot', origin: [5, 0, 20],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  // Door template
  const doorTpl = (await api.v1.assembly.partTemplate({ name: 'Door' })).result
  await api.v1.part.box({ id: doorTpl, name: 'Panel', length: 5, width: 60, height: 120 })
  const doorHingeTop = (await api.v1.part.workCSys({
    id: doorTpl, name: 'HingeTop', origin: [2.5, 0, 100],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result
  const doorHingeBot = (await api.v1.part.workCSys({
    id: doorTpl, name: 'HingeBot', origin: [2.5, 0, 20],
    xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Anchor frame at origin
  const frameInst = (await api.v1.assembly.instance({
    productId: frameTpl, ownerId: asmId, name: 'FrameInst',
  })).result
  await api.v1.assembly.fastenedOrigin({
    id: asmId,
    name: 'FrameAnchor',
    mate1: { path: [frameInst], csys: frameHingeTop },
  })

  // Create door instance
  const doorInst = (await api.v1.assembly.instance({
    productId: doorTpl, ownerId: asmId, name: 'DoorInst',
  })).result

  // Hinge door to frame with two revolute constraints (top and bottom)
  // Both share the same rotation axis (Z of the WCS at hinge points)
  const hingeTop = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'HingeTop',
    mate1: { path: [frameInst], csys: frameHingeTop },
    mate2: { path: [doorInst], csys: doorHingeTop },
    zRotationLimits: { min: '0deg', max: '120deg' },
  })).result
  console.log('[12] hingeTop:', hingeTop)

  await snapshot('door-closed')

  // Get the constraint data
  const gTop = await api.v1.assembly.getRevolute({ id: asmId, name: 'HingeTop' })
  filewrite(gTop.result, 'hinge-top-data')

  // Can we add a second revolute for the bottom hinge?
  const hingeBot = (await api.v1.assembly.revolute({
    id: asmId,
    name: 'HingeBot',
    mate1: { path: [frameInst], csys: frameHingeBot },
    mate2: { path: [doorInst], csys: doorHingeBot },
  })).result
  console.log('[12] hingeBot:', hingeBot, '(second revolute on same pair)')

  if (hingeBot) {
    await snapshot('two-hinges')
    const gBot = await api.v1.assembly.getRevolute({ id: asmId, name: 'HingeBot' })
    filewrite(gBot.result, 'hinge-bot-data')
  }

  return { asmId }
}
