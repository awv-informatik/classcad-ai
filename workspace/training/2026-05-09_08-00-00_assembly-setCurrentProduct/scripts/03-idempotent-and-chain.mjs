export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result
  const tpl1 = (await api.v1.assembly.partTemplate({ name: 'Part1' })).result
  await api.v1.part.box({ id: tpl1, length: 40, width: 30, height: 20 })
  const tpl2 = (await api.v1.assembly.partTemplate({ name: 'Part2' })).result
  await api.v1.part.box({ id: tpl2, length: 60, width: 20, height: 50 })
  const tpl3 = (await api.v1.assembly.partTemplate({ name: 'Part3' })).result
  await api.v1.part.cylinder({ id: tpl3, radius: 15, height: 40 })
  console.log('[03] asmId:', asmId, 'tpl1:', tpl1, 'tpl2:', tpl2, 'tpl3:', tpl3)

  // Test idempotency: switch to same product twice
  await api.v1.assembly.setCurrentProduct({ id: asmId })
  const r1 = await api.v1.assembly.setCurrentProduct({ id: tpl1 })
  console.log('[03] first switch to tpl1:', r1.result) // should be asmId
  const r2 = await api.v1.assembly.setCurrentProduct({ id: tpl1 })
  console.log('[03] second switch to tpl1 (idempotent):', r2.result) // should be tpl1 itself
  const r3 = await api.v1.assembly.setCurrentProduct({ id: tpl1 })
  console.log('[03] third switch to tpl1:', r3.result) // should still be tpl1
  filewrite({
    idempotent: { first: r1.result, second: r2.result, third: r3.result }
  }, 'idempotent')

  // Chain switches through multiple products and track the return chain
  await api.v1.assembly.setCurrentProduct({ id: asmId }) // start from assembly
  const c1 = await api.v1.assembly.setCurrentProduct({ id: tpl1 })
  const c2 = await api.v1.assembly.setCurrentProduct({ id: tpl2 })
  const c3 = await api.v1.assembly.setCurrentProduct({ id: tpl3 })
  const c4 = await api.v1.assembly.setCurrentProduct({ id: asmId })
  console.log('[03] chain: asm->tpl1:', c1.result, 'tpl1->tpl2:', c2.result, 'tpl2->tpl3:', c3.result, 'tpl3->asm:', c4.result)
  filewrite({
    chain: {
      'asm->tpl1': c1.result,
      'tpl1->tpl2': c2.result,
      'tpl2->tpl3': c3.result,
      'tpl3->asm': c4.result
    },
    expected: {
      'asm->tpl1': asmId,
      'tpl1->tpl2': tpl1,
      'tpl2->tpl3': tpl2,
      'tpl3->asm': tpl3
    }
  }, 'chain')

  return { asmId, tpl1, tpl2, tpl3 }
}
