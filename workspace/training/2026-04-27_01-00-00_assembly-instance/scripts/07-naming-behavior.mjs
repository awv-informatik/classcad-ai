export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'NameAsm' })).result
  const tplId = (await api.v1.assembly.partTemplate({ name: 'Gadget' })).result
  await api.v1.part.box({ id: tplId, name: 'B1', length: 20, width: 20, height: 20 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Auto-naming — no name param
  const r1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })).result
  const r2 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })).result
  const r3 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId })).result

  // Check assigned names via getInstance
  const all = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[07] all instances:', all)

  // Try to find by auto-generated names
  const byName0 = (await api.v1.assembly.getInstance({ ownerId: asmId, name: 'Gadget' })).result
  const byName1 = (await api.v1.assembly.getInstance({ ownerId: asmId, name: 'Gadget0' })).result
  const byName2 = (await api.v1.assembly.getInstance({ ownerId: asmId, name: 'Gadget1' })).result
  const byName3 = (await api.v1.assembly.getInstance({ ownerId: asmId, name: 'Gadget2' })).result
  console.log('[07] "Gadget":', byName0)
  console.log('[07] "Gadget0":', byName1)
  console.log('[07] "Gadget1":', byName2)
  console.log('[07] "Gadget2":', byName3)

  // Duplicate names — explicitly setting same name
  const d1 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'DupName' })).result
  const d2 = (await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'DupName' })).result
  console.log('[07] dup1:', d1, 'dup2:', d2)
  const dupLookup = (await api.v1.assembly.getInstance({ ownerId: asmId, name: 'DupName' })).result
  console.log('[07] getInstance("DupName"):', dupLookup, '(which one?)')

  // Name with special characters
  const rSpecial = await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: 'Part-001 (Rev.A)' })
  console.log('[07] special chars name:', rSpecial.result, 'maxLevel:', rSpecial.maxLevel)

  // Empty string name
  const rEmpty = await api.v1.assembly.instance({ productId: tplId, ownerId: asmId, name: '' })
  console.log('[07] empty string name:', rEmpty.result, 'maxLevel:', rEmpty.maxLevel)

  filewrite({
    autoNames: { gadget: byName0, gadget0: byName1, gadget1: byName2, gadget2: byName3 },
    duplicates: { d1, d2, lookup: dupLookup },
    specialChars: { id: rSpecial.result, maxLevel: rSpecial.maxLevel },
    emptyName: { id: rEmpty.result, maxLevel: rEmpty.maxLevel },
  }, 'naming')

  return { asmId }
}
