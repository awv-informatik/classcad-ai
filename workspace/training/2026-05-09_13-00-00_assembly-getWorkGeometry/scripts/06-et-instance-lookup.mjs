export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Part template with a named WCS
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
  await api.v1.part.box({ id: tplId, name: 'B', length: 40, width: 30, height: 20 })
  const wcsId = (await api.v1.part.workCSys({
    id: tplId, name: 'Mate',
    origin: [20, 15, 20], xDirection: [1, 0, 0], yDirection: [0, 1, 0]
  })).result
  console.log('[06] template wcsId:', wcsId)
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Sub-assembly template containing a part instance
  const subTpl = (await api.v1.assembly.assemblyTemplate({ name: 'Sub' })).result
  const innerInst = (await api.v1.assembly.instance({ productId: tplId, ownerId: subTpl, name: 'Inner' })).result
  console.log('[06] innerInst (template-scope):', innerInst)
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Instance the sub-assembly in root
  const subInst = (await api.v1.assembly.instance({ productId: subTpl, ownerId: asmId, name: 'SubInst' })).result
  console.log('[06] subInst:', subInst)

  // Get the ET instance ID from the sub-assembly instance
  const etResult = (await api.v1.assembly.getInstance({ ownerId: subInst })).result
  const etInstId = etResult[0]
  console.log('[06] ET instance ID:', etInstId)

  // Try getWorkGeometry on the ET instance
  const etLookup = await api.v1.assembly.getWorkGeometry({ id: etInstId, name: 'Mate' })
  console.log('[06] ET inst/Mate:', etLookup.result, 'maxLevel:', etLookup.maxLevel)

  // Also try built-in
  const etTop = await api.v1.assembly.getWorkGeometry({ id: etInstId, name: 'Top' })
  console.log('[06] ET inst/Top:', etTop.result, 'maxLevel:', etTop.maxLevel)

  // For comparison, directly instance the part in root
  const directInst = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Direct' })).result
  const directLookup = await api.v1.assembly.getWorkGeometry({ id: directInst, name: 'Mate' })
  console.log('[06] directInst/Mate:', directLookup.result, 'maxLevel:', directLookup.maxLevel)

  // Compare IDs
  console.log('[06] ET lookup ID === direct lookup ID:', etLookup.result === directLookup.result)
  console.log('[06] ET lookup ID === template WCS:', etLookup.result === wcsId)

  filewrite({
    templateWcsId: wcsId,
    innerInst, subInst, etInstId, directInst,
    etLookup: { result: etLookup.result, maxLevel: etLookup.maxLevel, msg: etLookup.messages?.[0]?.message },
    etTop: { result: etTop.result, maxLevel: etTop.maxLevel },
    directLookup: { result: directLookup.result, maxLevel: directLookup.maxLevel },
    allSameId: etLookup.result === directLookup.result && directLookup.result === wcsId,
  }, 'results')

  return { asmId }
}
