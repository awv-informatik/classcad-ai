// When does isDirty change? Check before/after update and close.
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'DirtyTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', radius: 15, height: 60 })).result

  const getState = async (label) => {
    const r = await api.v1.part.getFeature({ id: partId, name: 'Box1' })
    const tree = r.structure.tree
    const opSeq = Object.values(tree).find(n => n.class === 'CC_OperationSequence')
    const state = {
      editFeatureIndex: opSeq.members?.editFeatureIndex?.value,
      isDirty: opSeq.members?.isDirty?.value,
    }
    console.log(`[11] ${label}: editFeatureIndex=${state.editFeatureIndex} isDirty=${state.isDirty}`)
    return state
  }

  await getState('1-baseline')

  // Open box
  await api.v1.part.openFeature({ id: boxId })
  await getState('2-after-open')

  // Update box
  await api.v1.part.updateBox({ id: boxId, height: 120 })
  await getState('3-after-update')

  // Second update
  await api.v1.part.updateBox({ id: boxId, width: 100 })
  await getState('4-after-second-update')

  // Close
  await api.v1.part.closeFeature({ id: boxId })
  await getState('5-after-close')

  // Open and close WITHOUT updating — does isDirty stay 0?
  await api.v1.part.openFeature({ id: cylId })
  await getState('6-open-cyl-no-update')
  await api.v1.part.closeFeature({ id: cylId })
  await getState('7-close-cyl-no-update')

  return { partId }
}
