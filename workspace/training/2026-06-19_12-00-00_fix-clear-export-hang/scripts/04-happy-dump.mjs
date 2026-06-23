// Minimal happy-path STP export, dump the full return shape.
export default async function (api) {
  const part = (await api.v1.part.create({ name: 'Happy' })).result
  const eif = (await api.v1.part.entityInjection({ id: part })).result
  const b = await api.v1.solid.box({ id: eif, length: 60, width: 40, height: 30 })
  console.log('box:', b.maxLevel, b.result)
  const r = await api.v1.common.save({ format: 'STP', encoding: 'base64', stp: { version: 2 } })
  console.log('save keys:', Object.keys(r))
  console.log('save maxLevel:', r.maxLevel, 'messages:', JSON.stringify(r.messages)?.slice(0,200))
  const res = r.result
  console.log('result type:', typeof res, 'len:', (typeof res === 'string' ? res.length : JSON.stringify(res||'').length))
}
