export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'PerInstanceTest' })).result

  const tpl = (await api.v1.assembly.partTemplate({ name: 'ColorBox' })).result
  await api.v1.part.box({ id: tpl, name: 'Box1', length: 40, width: 30, height: 20 })
  const wcs = (await api.v1.part.workCSys({
    id: tpl, name: 'WCS', origin: [0, 0, 0], xDirection: [1, 0, 0], yDirection: [0, 1, 0],
  })).result

  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const inst1 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Red' })).result
  const inst2 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Green',
    transformation: [[60, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  const inst3 = (await api.v1.assembly.instance({ productId: tpl, ownerId: asmId, name: 'Blue',
    transformation: [[120, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result
  console.log('[05] instances:', inst1, inst2, inst3)

  // Try setAppearance on individual instances
  const rRed = await api.v1.common.setAppearance({ target: inst1, color: [255, 0, 0] })
  console.log('[05] setAppearance(inst1, red):', rRed.maxLevel, rRed.messages?.map(m => m.message))

  const rGreen = await api.v1.common.setAppearance({ target: inst2, color: [0, 255, 0] })
  console.log('[05] setAppearance(inst2, green):', rGreen.maxLevel, rGreen.messages?.map(m => m.message))

  const rBlue = await api.v1.common.setAppearance({ target: inst3, color: [0, 0, 255] })
  console.log('[05] setAppearance(inst3, blue):', rBlue.maxLevel, rBlue.messages?.map(m => m.message))

  await snapshot('per-instance-color')

  // Try setObjectName on an instance
  const rName = await api.v1.common.setObjectName({ id: inst1, name: 'RenamedInst1' })
  console.log('[05] setObjectName(inst1):', rName.maxLevel, rName.result)

  // Try setUserData on an instance
  const rUD = await api.v1.common.setUserData({ id: inst1, key: 'material', value: 'steel' })
  console.log('[05] setUserData(inst1):', rUD.maxLevel)
  const udRead = await api.v1.common.getUserData({ id: inst1, key: 'material' })
  console.log('[05] getUserData(inst1):', udRead.result)

  // Try setUserData on a different instance — should be independent
  const rUD2 = await api.v1.common.setUserData({ id: inst2, key: 'material', value: 'aluminum' })
  const ud2Read = await api.v1.common.getUserData({ id: inst2, key: 'material' })
  console.log('[05] getUserData(inst2):', ud2Read.result)

  // Verify the first instance still has its own value
  const ud1Again = await api.v1.common.getUserData({ id: inst1, key: 'material' })
  console.log('[05] getUserData(inst1 again):', ud1Again.result)

  return { asmId, tpl, inst1, inst2, inst3 }
}
