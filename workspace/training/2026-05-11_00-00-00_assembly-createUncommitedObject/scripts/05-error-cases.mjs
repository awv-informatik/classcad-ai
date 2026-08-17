export default async function (api, { snapshot, filewrite }) {
  const asmId = (await api.v1.assembly.create({})).result

  // Test missing params
  const errors = {}

  // Missing id
  const r1 = await api.v1.assembly.createUncommitedObject({
    type: 'CC_FastenedConstraint',
    name: 'Test',
  })
  errors['missing_id'] = { result: r1.result, maxLevel: r1.maxLevel, messages: r1.messages }
  console.log('[05] missing id: result=', r1.result, 'maxLevel=', r1.maxLevel)

  // Missing type
  const r2 = await api.v1.assembly.createUncommitedObject({
    id: asmId,
    name: 'Test',
  })
  errors['missing_type'] = { result: r2.result, maxLevel: r2.maxLevel, messages: r2.messages }
  console.log('[05] missing type: result=', r2.result, 'maxLevel=', r2.maxLevel)

  // Missing name
  const r3 = await api.v1.assembly.createUncommitedObject({
    id: asmId,
    type: 'CC_FastenedConstraint',
  })
  errors['missing_name'] = { result: r3.result, maxLevel: r3.maxLevel, messages: r3.messages }
  console.log('[05] missing name: result=', r3.result, 'maxLevel=', r3.maxLevel)
  // Decline it if it succeeded
  if (r3.result && r3.maxLevel < 51) {
    await api.v1.part.openFeature({ id: r3.result })
    await api.v1.part.closeFeature({ id: r3.result })
  }

  // Invalid type string
  const r4 = await api.v1.assembly.createUncommitedObject({
    id: asmId,
    type: 'InvalidType',
    name: 'Test',
  })
  errors['invalid_type'] = { result: r4.result, maxLevel: r4.maxLevel, messages: r4.messages }
  console.log('[05] invalid type: result=', r4.result, 'maxLevel=', r4.maxLevel)

  // Case sensitivity — lowercase
  const r5 = await api.v1.assembly.createUncommitedObject({
    id: asmId,
    type: 'cc_fastenedconstraint',
    name: 'Test',
  })
  errors['lowercase_type'] = { result: r5.result, maxLevel: r5.maxLevel, messages: r5.messages }
  console.log('[05] lowercase type: result=', r5.result, 'maxLevel=', r5.maxLevel)

  // Invalid id (not an assembly)
  const r6 = await api.v1.assembly.createUncommitedObject({
    id: 9999,
    type: 'CC_FastenedConstraint',
    name: 'Test',
  })
  errors['invalid_id'] = { result: r6.result, maxLevel: r6.maxLevel, messages: r6.messages }
  console.log('[05] invalid id: result=', r6.result, 'maxLevel=', r6.maxLevel)

  // Empty type string
  const r7 = await api.v1.assembly.createUncommitedObject({
    id: asmId,
    type: '',
    name: 'Test',
  })
  errors['empty_type'] = { result: r7.result, maxLevel: r7.maxLevel, messages: r7.messages }
  console.log('[05] empty type: result=', r7.result, 'maxLevel=', r7.maxLevel)

  filewrite(errors, 'error-cases')
  return {}
}
