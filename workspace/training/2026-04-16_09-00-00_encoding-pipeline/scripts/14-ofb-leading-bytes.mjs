// Investigate leading bytes of OFB content
// Script 08 showed decoded b64 starts with "classcad" but startsWith check failed
// Script 01 showed raw starts with "classcad\nVersion=11\n"
// Is there a BOM or binary prefix?
export default async function (api, { filewrite }) {
  const partId = (await api.v1.part.create({ name: 'LeadBytes' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Raw OFB
  const raw = await api.v1.common.save({ format: 'OFB' })
  const rawContent = raw.result.content

  // Inspect first 20 char codes
  const first20 = []
  for (let i = 0; i < 20; i++) {
    first20.push({
      index: i,
      char: rawContent[i],
      charCode: rawContent.charCodeAt(i),
      hex: '0x' + rawContent.charCodeAt(i).toString(16).padStart(2, '0'),
    })
  }
  console.log('[14] first 20 chars:', JSON.stringify(first20))

  // Check for BOM
  console.log('[14] first 3 charCodes:', rawContent.charCodeAt(0), rawContent.charCodeAt(1), rawContent.charCodeAt(2))
  console.log('[14] has BOM (FEFF):', rawContent.charCodeAt(0) === 0xfeff)

  // Base64 decode and inspect
  const b64 = await api.v1.common.save({ format: 'OFB', encoding: 'base64' })
  const decoded = Buffer.from(b64.result.content, 'base64')
  const first20bytes = [...decoded.subarray(0, 20)]
  console.log('[14] b64 decoded first 20 bytes:', first20bytes.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' '))
  console.log('[14] b64 decoded first 20 as ascii:', decoded.subarray(0, 20).toString('ascii'))

  // Check: does raw OFB start with "classcad" as plain text?
  console.log('[14] raw startsWith "classcad":', rawContent.startsWith('classcad'))
  console.log('[14] raw indexOf "classcad":', rawContent.indexOf('classcad'))

  filewrite({
    first20chars: first20,
    first20decodedBytes: first20bytes,
    rawStartsWithClasscad: rawContent.startsWith('classcad'),
    rawIndexOfClasscad: rawContent.indexOf('classcad'),
  }, 'leading-bytes')

  return { partId }
}
