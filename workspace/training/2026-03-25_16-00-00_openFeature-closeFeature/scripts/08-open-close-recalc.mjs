// Does closeFeature trigger automatic recalc? Or do you need explicit recalc()?
// Test: open → update box → close → check if geometry is recalculated
// Then compare with explicit recalc() after close
export default async function (api, { snapshot }) {
  const partId = (await api.v1.part.create({ name: 'RecalcTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, radius: 10, height: 20 })).result

  await snapshot('before')

  // open → update → close (no explicit recalc)
  await api.v1.part.openFeature({ id: boxId })
  await api.v1.part.updateBox({ id: boxId, height: 120 })
  await api.v1.part.closeFeature({ id: boxId })

  await snapshot('after-close-no-recalc')

  // Now also call recalc
  const recalcRes = await api.v1.common.recalc()
  console.log('[08] recalc result:', recalcRes.result, 'maxLevel:', recalcRes.maxLevel)

  await snapshot('after-recalc')

  return { partId, boxId }
}
