export default async function (api, { filewrite }) {
  const asmId = (await api.v1.assembly.create({ name: 'Root' })).result

  // Create in NON-alphabetical order to verify ordering is by creation, not name
  const tCharlie = (await api.v1.assembly.assemblyTemplate({ name: 'Charlie' })).result
  const tAlpha = (await api.v1.assembly.assemblyTemplate({ name: 'Alpha' })).result
  const tBravo = (await api.v1.assembly.assemblyTemplate({ name: 'Bravo' })).result
  console.log('[08] Charlie:', tCharlie, 'Alpha:', tAlpha, 'Bravo:', tBravo)

  const r = await api.v1.assembly.getAssemblyTemplate()
  console.log('[08] list:', r.result)
  console.log('[08] is creation order:', r.result[0] === tCharlie && r.result[1] === tAlpha && r.result[2] === tBravo)

  // Call twice to verify stable
  const r2 = await api.v1.assembly.getAssemblyTemplate()
  console.log('[08] stable:', JSON.stringify(r.result) === JSON.stringify(r2.result))

  filewrite({
    creationOrder: { Charlie: tCharlie, Alpha: tAlpha, Bravo: tBravo },
    listing: r.result,
    isCreationOrder: r.result[0] === tCharlie && r.result[1] === tAlpha && r.result[2] === tBravo,
    isStable: JSON.stringify(r.result) === JSON.stringify(r2.result),
  }, 'ordering')

  return { asmId }
}
