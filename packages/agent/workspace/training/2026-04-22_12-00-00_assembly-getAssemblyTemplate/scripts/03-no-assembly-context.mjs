export default async function (api, { filewrite }) {
  // No assembly.create — try listing assembly templates
  const listNoAsm = await api.v1.assembly.getAssemblyTemplate()
  console.log('[03] listNoAsm result:', JSON.stringify(listNoAsm.result))
  console.log('[03] listNoAsm maxLevel:', listNoAsm.maxLevel)
  console.log('[03] listNoAsm messages:', JSON.stringify(listNoAsm.messages))

  // Try name lookup without assembly
  const findNoAsm = await api.v1.assembly.getAssemblyTemplate({ name: 'Foo' })
  console.log('[03] findNoAsm result:', findNoAsm.result)
  console.log('[03] findNoAsm maxLevel:', findNoAsm.maxLevel)
  console.log('[03] findNoAsm messages:', JSON.stringify(findNoAsm.messages))

  filewrite({
    listNoAsm: { result: listNoAsm.result, maxLevel: listNoAsm.maxLevel, messages: listNoAsm.messages },
    findNoAsm: { result: findNoAsm.result, maxLevel: findNoAsm.maxLevel, messages: findNoAsm.messages },
  }, 'no-assembly')

  return {}
}
