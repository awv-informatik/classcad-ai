export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Create a part template with work geometry
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
  const boxId = (await api.v1.part.box({ id: tplId, name: 'B', length: 40, width: 30, height: 20 })).result
  const wpId = (await api.v1.part.workPoint({ id: tplId, name: 'WPt1', position: [10, 10, 10] })).result
  console.log('[03] wpId in template:', wpId)
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create a sub-assembly template
  const subAsmTpl = (await api.v1.assembly.assemblyTemplate({ name: 'SubAsm' })).result
  console.log('[03] subAsmTpl:', subAsmTpl)

  // Instance the part template inside the sub-assembly
  const subInst = (await api.v1.assembly.instance({ productId: tplId, ownerId: subAsmTpl, name: 'SubInst' })).result
  console.log('[03] subInst (inside sub-asm):', subInst)

  // Return to root assembly
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance the sub-assembly in the root
  const subAsmInst = (await api.v1.assembly.instance({ productId: subAsmTpl, ownerId: asmId, name: 'SubAsmInst' })).result
  console.log('[03] subAsmInst:', subAsmInst)

  // Also instance the part directly
  const directInst = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'DirectInst' })).result
  console.log('[03] directInst:', directInst)

  // Test: getWorkGeometry on sub-assembly template ID
  const subAsmTop = await api.v1.assembly.getWorkGeometry({ id: subAsmTpl, name: 'Top' })
  console.log('[03] subAsmTpl/Top:', subAsmTop.result, 'maxLevel:', subAsmTop.maxLevel, 'msg:', subAsmTop.messages?.[0]?.message)

  // Test: getWorkGeometry on sub-assembly instance
  const subAsmInstTop = await api.v1.assembly.getWorkGeometry({ id: subAsmInst, name: 'Top' })
  console.log('[03] subAsmInst/Top:', subAsmInstTop.result, 'maxLevel:', subAsmInstTop.maxLevel, 'msg:', subAsmInstTop.messages?.[0]?.message)

  // Test: getWorkGeometry on direct part instance — user work point
  const directWPt = await api.v1.assembly.getWorkGeometry({ id: directInst, name: 'WPt1' })
  console.log('[03] directInst/WPt1:', directWPt.result, 'maxLevel:', directWPt.maxLevel)

  // Error cases
  // 1. Invalid name on valid instance
  const badName = await api.v1.assembly.getWorkGeometry({ id: directInst, name: 'NonExistent' })
  console.log('[03] directInst/NonExistent:', badName.result, 'maxLevel:', badName.maxLevel, 'msg:', badName.messages?.[0]?.message)

  // 2. Empty name
  const emptyName = await api.v1.assembly.getWorkGeometry({ id: directInst, name: '' })
  console.log('[03] directInst/empty:', emptyName.result, 'maxLevel:', emptyName.maxLevel, 'msg:', emptyName.messages?.[0]?.message)

  // 3. Case sensitivity
  const wrongCase = await api.v1.assembly.getWorkGeometry({ id: directInst, name: 'top' })
  console.log('[03] directInst/top (lowercase):', wrongCase.result, 'maxLevel:', wrongCase.maxLevel)

  // 4. Part template ID directly (should fail per script 01)
  const tplDirect = await api.v1.assembly.getWorkGeometry({ id: tplId, name: 'Top' })
  console.log('[03] tplId/Top (expect fail):', tplDirect.result, 'maxLevel:', tplDirect.maxLevel, 'msg:', tplDirect.messages?.[0]?.message)

  filewrite({
    subAsmTpl: { id: subAsmTpl, Top: { result: subAsmTop.result, maxLevel: subAsmTop.maxLevel, msg: subAsmTop.messages?.[0]?.message } },
    subAsmInst: { id: subAsmInst, Top: { result: subAsmInstTop.result, maxLevel: subAsmInstTop.maxLevel, msg: subAsmInstTop.messages?.[0]?.message } },
    directInst_WPt1: { result: directWPt.result, maxLevel: directWPt.maxLevel, templateWPtId: wpId, same: directWPt.result === wpId },
    errors: {
      nonExistent: { result: badName.result, maxLevel: badName.maxLevel, msg: badName.messages?.[0]?.message },
      emptyName: { result: emptyName.result, maxLevel: emptyName.maxLevel, msg: emptyName.messages?.[0]?.message },
      wrongCase: { result: wrongCase.result, maxLevel: wrongCase.maxLevel, msg: wrongCase.messages?.[0]?.message },
      tplDirect: { result: tplDirect.result, maxLevel: tplDirect.maxLevel, msg: tplDirect.messages?.[0]?.message },
    }
  }, 'results')

  return { asmId }
}
