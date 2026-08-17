export default async function (api, { filewrite }) {
  // Create assembly with a part template
  const asmId = (await api.v1.assembly.create({})).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result

  // Add a box and a user-created WCS inside the template
  const boxId = (await api.v1.part.box({ id: tplId, name: 'Box1', length: 40, width: 30, height: 20 })).result
  const wcsId = (await api.v1.part.workCSys({
    id: tplId, name: 'MateCSys',
    origin: [20, 15, 20], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result
  console.log('[02] wcsId in template:', wcsId)

  // Return to assembly context
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create two instances
  const inst1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst1' })).result
  const inst2 = (await api.v1.assembly.instance({
    productId: tplId, ownerId: asmId, name: 'Inst2',
    transformation: [[80, 0, 0], [1, 0, 0], [0, 1, 0]]
  })).result
  console.log('[02] inst1:', inst1, 'inst2:', inst2)

  // Test on assembly root
  const asmTop = await api.v1.assembly.getWorkGeometry({ id: asmId, name: 'Top' })
  console.log('[02] asmId/Top:', asmTop.result, 'maxLevel:', asmTop.maxLevel)

  const asmOrigin = await api.v1.assembly.getWorkGeometry({ id: asmId, name: 'Origin' })
  console.log('[02] asmId/Origin:', asmOrigin.result, 'maxLevel:', asmOrigin.maxLevel)

  const asmMate = await api.v1.assembly.getWorkGeometry({ id: asmId, name: 'MateCSys' })
  console.log('[02] asmId/MateCSys:', asmMate.result, 'maxLevel:', asmMate.maxLevel)

  // Test on instance 1
  const inst1Top = await api.v1.assembly.getWorkGeometry({ id: inst1, name: 'Top' })
  console.log('[02] inst1/Top:', inst1Top.result, 'maxLevel:', inst1Top.maxLevel)

  const inst1Origin = await api.v1.assembly.getWorkGeometry({ id: inst1, name: 'Origin' })
  console.log('[02] inst1/Origin:', inst1Origin.result, 'maxLevel:', inst1Origin.maxLevel)

  const inst1Mate = await api.v1.assembly.getWorkGeometry({ id: inst1, name: 'MateCSys' })
  console.log('[02] inst1/MateCSys:', inst1Mate.result, 'maxLevel:', inst1Mate.maxLevel)

  const inst1XAxis = await api.v1.assembly.getWorkGeometry({ id: inst1, name: 'XAxis' })
  console.log('[02] inst1/XAxis:', inst1XAxis.result, 'maxLevel:', inst1XAxis.maxLevel)

  // Test on instance 2
  const inst2Mate = await api.v1.assembly.getWorkGeometry({ id: inst2, name: 'MateCSys' })
  console.log('[02] inst2/MateCSys:', inst2Mate.result, 'maxLevel:', inst2Mate.maxLevel)

  filewrite({
    asmId,
    onAssembly: {
      Top: { id: asmTop.result, maxLevel: asmTop.maxLevel, msg: asmTop.messages?.[0]?.message },
      Origin: { id: asmOrigin.result, maxLevel: asmOrigin.maxLevel, msg: asmOrigin.messages?.[0]?.message },
      MateCSys: { id: asmMate.result, maxLevel: asmMate.maxLevel, msg: asmMate.messages?.[0]?.message },
    },
    onInstance1: {
      Top: { id: inst1Top.result, maxLevel: inst1Top.maxLevel },
      Origin: { id: inst1Origin.result, maxLevel: inst1Origin.maxLevel },
      MateCSys: { id: inst1Mate.result, maxLevel: inst1Mate.maxLevel },
      XAxis: { id: inst1XAxis.result, maxLevel: inst1XAxis.maxLevel },
    },
    onInstance2: {
      MateCSys: { id: inst2Mate.result, maxLevel: inst2Mate.maxLevel },
    },
    templateWcsId: wcsId,
    inst1MateId: inst1Mate.result,
    inst2MateId: inst2Mate.result,
    sameIdAcrossInstances: inst1Mate.result === inst2Mate.result,
  }, 'results')

  return { asmId, tplId, inst1, inst2 }
}
