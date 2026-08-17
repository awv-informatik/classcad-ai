export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'TestPart' })).result
  const boxId = (await api.v1.part.box({ id: partId, name: 'MainBox' })).result

  // Create a mirror feature
  const mirrorId = (await api.v1.part.mirror({
    id: partId,
    name: 'MyMirror',
    operations: [boxId],
    plane: [1, 0, 0],
    origin: [50, 0, 0],
  })).result
  console.log('[17] mirrorId:', mirrorId)

  // Create a translation
  const transId = (await api.v1.part.translation({
    id: partId,
    name: 'MyTranslation',
    operations: [boxId],
    direction: [200, 0, 0],
  })).result
  console.log('[17] transId:', transId)

  // Look up both
  const rMirror = await api.v1.part.getFeature({ id: partId, name: 'MyMirror' })
  const rTrans = await api.v1.part.getFeature({ id: partId, name: 'MyTranslation' })
  console.log('[17] "MyMirror":', rMirror.result, 'match:', rMirror.result === mirrorId)
  console.log('[17] "MyTranslation":', rTrans.result, 'match:', rTrans.result === transId)

  // Also try finding the original box
  const rBox = await api.v1.part.getFeature({ id: partId, name: 'MainBox' })
  console.log('[17] "MainBox":', rBox.result, 'match:', rBox.result === boxId)

  filewrite({
    mirror: { id: mirrorId, found: rMirror.result, match: rMirror.result === mirrorId },
    translation: { id: transId, found: rTrans.result, match: rTrans.result === transId },
    box: { id: boxId, found: rBox.result, match: rBox.result === boxId },
  }, 'transform-features')

  return { partId }
}
