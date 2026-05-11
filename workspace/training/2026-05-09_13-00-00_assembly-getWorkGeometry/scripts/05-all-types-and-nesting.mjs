export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Part template with all 4 work geometry types
  const tplId = (await api.v1.assembly.partTemplate({ name: 'AllTypes' })).result
  await api.v1.part.box({ id: tplId, name: 'B', length: 40, width: 30, height: 20 })

  const customWP = (await api.v1.part.workPlane({
    id: tplId, name: 'CustomPlane',
    origin: [0, 0, 10], normal: [0, 0, 1], xDirection: [1, 0, 0]
  })).result

  const customWA = (await api.v1.part.workAxis({
    id: tplId, name: 'CustomAxis',
    origin: [20, 15, 0], direction: [0, 0, 1]
  })).result

  const customWCS = (await api.v1.part.workCSys({
    id: tplId, name: 'CustomCSys',
    origin: [10, 10, 10], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result

  const customWPt = (await api.v1.part.workPoint({
    id: tplId, name: 'CustomPoint',
    position: [5, 5, 5]
  })).result

  console.log('[05] template IDs — plane:', customWP, 'axis:', customWA, 'csys:', customWCS, 'point:', customWPt)
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance it
  const inst = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Inst' })).result

  // Look up all 4 types
  const plane = await api.v1.assembly.getWorkGeometry({ id: inst, name: 'CustomPlane' })
  const axis = await api.v1.assembly.getWorkGeometry({ id: inst, name: 'CustomAxis' })
  const csys = await api.v1.assembly.getWorkGeometry({ id: inst, name: 'CustomCSys' })
  const point = await api.v1.assembly.getWorkGeometry({ id: inst, name: 'CustomPoint' })

  console.log('[05] looked up — plane:', plane.result, '(match:', plane.result === customWP, ')')
  console.log('[05] looked up — axis:', axis.result, '(match:', axis.result === customWA, ')')
  console.log('[05] looked up — csys:', csys.result, '(match:', csys.result === customWCS, ')')
  console.log('[05] looked up — point:', point.result, '(match:', point.result === customWPt, ')')

  // Also look up built-ins through instance
  const top = await api.v1.assembly.getWorkGeometry({ id: inst, name: 'Top' })
  const front = await api.v1.assembly.getWorkGeometry({ id: inst, name: 'Front' })
  const right = await api.v1.assembly.getWorkGeometry({ id: inst, name: 'Right' })
  const xAxis = await api.v1.assembly.getWorkGeometry({ id: inst, name: 'XAxis' })
  const yAxis = await api.v1.assembly.getWorkGeometry({ id: inst, name: 'YAxis' })
  const zAxis = await api.v1.assembly.getWorkGeometry({ id: inst, name: 'ZAxis' })
  const origin = await api.v1.assembly.getWorkGeometry({ id: inst, name: 'Origin' })

  console.log('[05] builtins — Top:', top.result, 'Front:', front.result, 'Right:', right.result)
  console.log('[05] builtins — XAxis:', xAxis.result, 'YAxis:', yAxis.result, 'ZAxis:', zAxis.result, 'Origin:', origin.result)

  // Test nesting: sub-assembly with a part instance, query sub-asm instance for part's work geo
  const subAsmTpl = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  const subInst = (await api.v1.assembly.instance({ productId: tplId, ownerId: subAsmTpl, name: 'Inner' })).result
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  const subAsmInst = (await api.v1.assembly.instance({ productId: subAsmTpl, ownerId: asmId, name: 'SubAsmInst' })).result

  // Try to get part's work geo through sub-assembly instance (expect fail)
  const nestedLookup = await api.v1.assembly.getWorkGeometry({ id: subAsmInst, name: 'CustomCSys' })
  console.log('[05] nested subAsmInst/CustomCSys:', nestedLookup.result, 'maxLevel:', nestedLookup.maxLevel,
    'msg:', nestedLookup.messages?.[0]?.message)

  // Try to get work geo from the inner instance (inside sub-assembly)
  // First get the ET instance ID
  const innerInstET = await api.v1.assembly.getInstance({ ownerId: subAsmInst })
  console.log('[05] innerInstET result:', innerInstET.result)

  filewrite({
    customTypes: {
      plane: { templateId: customWP, lookedUp: plane.result, match: plane.result === customWP },
      axis: { templateId: customWA, lookedUp: axis.result, match: axis.result === customWA },
      csys: { templateId: customWCS, lookedUp: csys.result, match: csys.result === customWCS },
      point: { templateId: customWPt, lookedUp: point.result, match: point.result === customWPt },
    },
    builtins: {
      Top: top.result, Front: front.result, Right: right.result,
      XAxis: xAxis.result, YAxis: yAxis.result, ZAxis: zAxis.result, Origin: origin.result,
    },
    nesting: {
      subAsmInst: subAsmInst,
      nestedLookup: { result: nestedLookup.result, maxLevel: nestedLookup.maxLevel, msg: nestedLookup.messages?.[0]?.message },
      innerInstETResult: innerInstET.result,
    },
  }, 'results')

  return { asmId }
}
