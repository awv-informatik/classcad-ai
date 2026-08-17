// Check the editFeatureIndex member of OperationSequence during openFeature.
// Also check if the children array changes during openFeature (ghost bar position).
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'EditIdxTest' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'Box1', length: 80, width: 60, height: 40 })).result
  const cylId = (await api.v1.part.cylinder({ id: partId, name: 'Cyl1', radius: 15, height: 60 })).result
  const sphId = (await api.v1.part.sphere({ id: partId, name: 'Sph1', radius: 20, position: [40, 0, 0] })).result

  // Baseline
  const s0 = getOpSeqData(await api.v1.part.getFeature({ id: partId, name: 'Box1' }))
  console.log('[10] BASELINE — editFeatureIndex:', s0.editFeatureIndex, 'isDirty:', s0.isDirty)
  console.log('[10] children:', JSON.stringify(s0.children))
  filewrite(s0, 'state0-baseline')

  // Open Box1 (first feature)
  await api.v1.part.openFeature({ id: boxId })
  const s1 = getOpSeqData(await api.v1.part.getFeature({ id: partId, name: 'Box1' }))
  console.log('[10] OPEN BOX — editFeatureIndex:', s1.editFeatureIndex, 'isDirty:', s1.isDirty)
  console.log('[10] children:', JSON.stringify(s1.children))
  filewrite(s1, 'state1-open-box')
  await api.v1.part.closeFeature({ id: boxId })

  // Open Cyl1 (middle feature)
  await api.v1.part.openFeature({ id: cylId })
  const s2 = getOpSeqData(await api.v1.part.getFeature({ id: partId, name: 'Box1' }))
  console.log('[10] OPEN CYL — editFeatureIndex:', s2.editFeatureIndex, 'isDirty:', s2.isDirty)
  console.log('[10] children:', JSON.stringify(s2.children))
  filewrite(s2, 'state2-open-cyl')
  await api.v1.part.closeFeature({ id: cylId })

  // Open Sph1 (last feature)
  await api.v1.part.openFeature({ id: sphId })
  const s3 = getOpSeqData(await api.v1.part.getFeature({ id: partId, name: 'Box1' }))
  console.log('[10] OPEN SPH — editFeatureIndex:', s3.editFeatureIndex, 'isDirty:', s3.isDirty)
  console.log('[10] children:', JSON.stringify(s3.children))
  filewrite(s3, 'state3-open-sph')
  await api.v1.part.closeFeature({ id: sphId })

  // After close — check final state
  const s4 = getOpSeqData(await api.v1.part.getFeature({ id: partId, name: 'Box1' }))
  console.log('[10] AFTER ALL CLOSED — editFeatureIndex:', s4.editFeatureIndex, 'isDirty:', s4.isDirty)
  console.log('[10] children:', JSON.stringify(s4.children))
  filewrite(s4, 'state4-final')

  return { partId }
}

function getOpSeqData(response) {
  const tree = response.structure.tree
  const opSeq = Object.values(tree).find(n => n.class === 'CC_OperationSequence')
  return {
    children: opSeq.children,
    editFeatureIndex: opSeq.members?.editFeatureIndex?.value,
    isDirty: opSeq.members?.isDirty?.value,
  }
}
