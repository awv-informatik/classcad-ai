export default async function (api, { snapshot, filewrite }) {
  // Realistic workflow: build a simple shelf assembly with brackets and shelves
  const asmId = (await api.v1.assembly.create({ name: 'Shelf' })).result

  // Create bracket template
  const bracketTpl = (await api.v1.assembly.partTemplate({ name: 'Bracket' })).result
  await api.v1.part.box({ id: bracketTpl, name: 'Upright', length: 5, width: 20, height: 100 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Create shelf template
  const shelfTpl = (await api.v1.assembly.partTemplate({ name: 'ShelfBoard' })).result
  await api.v1.part.box({ id: shelfTpl, name: 'Board', length: 80, width: 20, height: 3 })
  await api.v1.assembly.setCurrentProduct({ id: asmId })

  // Place two brackets
  const leftBracket = (await api.v1.assembly.instance({
    productId: bracketTpl, ownerId: asmId, name: 'LeftBracket',
    transformation: [[0, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  const rightBracket = (await api.v1.assembly.instance({
    productId: bracketTpl, ownerId: asmId, name: 'RightBracket',
    transformation: [[75, 0, 0], [1, 0, 0], [0, 1, 0]],
  })).result

  // Place three shelves at different heights
  const shelves = await api.v1.assembly.instance([
    { productId: shelfTpl, ownerId: asmId, name: 'Bottom', transformation: [[0, 0, 5], [1, 0, 0], [0, 1, 0]] },
    { productId: shelfTpl, ownerId: asmId, name: 'Middle', transformation: [[0, 0, 45], [1, 0, 0], [0, 1, 0]] },
    { productId: shelfTpl, ownerId: asmId, name: 'Top', transformation: [[0, 0, 85], [1, 0, 0], [0, 1, 0]] },
  ])
  console.log('[14] brackets:', leftBracket, rightBracket)
  console.log('[14] shelves (batch):', shelves.result)

  // Verify full assembly
  const all = (await api.v1.assembly.getInstance({ ownerId: asmId })).result
  console.log('[14] total instances:', all.length)

  // Mass properties of full assembly
  const mass = (await api.v1.assembly.calculateMassProperties({ id: asmId })).result
  console.log('[14] assembly volume:', mass.volume)
  console.log('[14] assembly cog:', mass.cog)

  await snapshot('shelf-assembly')

  filewrite({
    instances: all,
    totalVolume: mass.volume,
    cog: mass.cog,
  }, 'workflow-result')

  return { asmId }
}
