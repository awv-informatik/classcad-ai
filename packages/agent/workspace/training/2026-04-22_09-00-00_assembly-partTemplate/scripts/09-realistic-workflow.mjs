export default async function (api, { snapshot, filewrite }) {
  // Realistic assembly workflow: create assembly, two part templates, build, instantiate
  const asmId = (await api.v1.assembly.create({ name: 'Bracket_Assembly' })).result
  console.log('[09] asmId:', asmId)

  // Template 1: L-bracket
  const bracketId = (await api.v1.assembly.partTemplate({ name: 'L_Bracket' })).result
  console.log('[09] bracketId:', bracketId)

  const bBase = (await api.v1.part.box({ id: bracketId, name: 'Base', length: 80, width: 40, height: 10 })).result
  const bWall = (await api.v1.part.box({ id: bracketId, name: 'Wall', length: 10, width: 40, height: 60 })).result
  const wcs1 = (await api.v1.part.workCSys({
    id: bracketId,
    name: 'MountCSys',
    origin: [0, 0, 0],
    xDirection: [1, 0, 0],
    yDirection: [0, 1, 0],
  })).result
  console.log('[09] bracket built: base=', bBase, 'wall=', bWall, 'wcs=', wcs1)

  // Template 2: Pin
  const pinId = (await api.v1.assembly.partTemplate({ name: 'Pin' })).result
  console.log('[09] pinId:', pinId)

  const cylinder = (await api.v1.part.cylinder({ id: pinId, name: 'Shaft', diameter: 8, height: 50 })).result
  const wcs2 = (await api.v1.part.workCSys({
    id: pinId,
    name: 'PinCSys',
    origin: [0, 0, 0],
    xDirection: [1, 0, 0],
    yDirection: [0, 1, 0],
  })).result
  console.log('[09] pin built: cyl=', cylinder, 'wcs=', wcs2)

  // Switch back to assembly
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Verify templates via getPartTemplate
  const allTemplates = (await api.v1.assembly.getPartTemplate()).result
  console.log('[09] all templates:', JSON.stringify(allTemplates))

  // Create instances
  const b1 = (await api.v1.assembly.instance({ productId: bracketId, ownerId: asmId, name: 'Bracket_Left' })).result
  const b2 = (await api.v1.assembly.instance({
    productId: bracketId,
    ownerId: asmId,
    name: 'Bracket_Right',
    transformation: [[200, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const p1 = (await api.v1.assembly.instance({
    productId: pinId,
    ownerId: asmId,
    name: 'Pin_1',
    transformation: [[40, 20, 30], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[09] instances: b1=', b1, 'b2=', b2, 'p1=', p1)

  await snapshot('assembly-result')

  // Dump final structure overview
  const finalR = await api.v1.common.getAppVersion({})
  const tree = finalR.structure?.tree
  const asmNode = tree?.['12']
  console.log('[09] assembly children:', JSON.stringify(asmNode?.children))

  return { asmId, bracketId, pinId, b1, b2, p1 }
}
