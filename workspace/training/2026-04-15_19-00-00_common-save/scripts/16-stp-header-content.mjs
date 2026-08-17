// Verify STP header fields appear in the saved content
export default async function (api, { snapshot, filewrite }) {
  const partId = (await api.v1.part.create({ name: 'HeaderTest' })).result
  const eifId = (await api.v1.part.entityInjection({ id: partId, name: 'EIF' })).result
  await api.v1.solid.box({ id: eifId, length: 80, width: 60, height: 40 })

  // Without custom header
  const noHeader = await api.v1.common.save({ format: 'STP' })
  // Extract HEADER section
  const headerSection1 = noHeader.result.content.match(/HEADER;[\s\S]*?ENDSEC;/)?.[0]
  console.log('[16] Default header:\n', headerSection1)

  // With custom header
  const withHeader = await api.v1.common.save({
    format: 'STP',
    stp: {
      version: 2,
      header: {
        filename: {
          name: 'my-custom-model.stp',
          organization: 'ACME Corp'
        }
      }
    }
  })
  const headerSection2 = withHeader.result.content.match(/HEADER;[\s\S]*?ENDSEC;/)?.[0]
  console.log('[16] Custom header:\n', headerSection2)

  // Check if our custom values appear
  const hasCustomName = withHeader.result.content.includes('my-custom-model.stp')
  const hasCustomOrg = withHeader.result.content.includes('ACME Corp')
  console.log('[16] custom name present:', hasCustomName)
  console.log('[16] custom org present:', hasCustomOrg)

  filewrite({
    defaultHeader: headerSection1,
    customHeader: headerSection2,
    hasCustomName,
    hasCustomOrg,
  }, 'stp-headers')

  return { partId }
}
