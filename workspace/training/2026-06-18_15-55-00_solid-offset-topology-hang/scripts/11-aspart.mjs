export default async function (api, { filewrite }) {
  const asPart = process.env.AS_PART === '1'
  const withTimeout=(p,ms,l)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error(`HUNG ${ms}ms ${l}`)),ms))])
  const part=(await api.v1.part.create({name:'AsPart'})).result
  const eif=(await api.v1.part.entityInjection({id:part})).result
  const box=(await api.v1.solid.box({id:eif,length:60,width:40,height:30})).result
  const c1=(await api.v1.solid.cylinder({id:eif,height:50,diameter:10,translation:[15,15,-5]})).result
  const c2=(await api.v1.solid.cylinder({id:eif,height:50,diameter:10,translation:[45,15,-5]})).result
  const c3=(await api.v1.solid.cylinder({id:eif,height:50,diameter:10,translation:[30,30,-5]})).result
  const sub=await api.v1.solid.subtraction({id:eif,target:box,tools:[c1,c2,c3]})
  console.log('sub maxLevel',sub.maxLevel)
  try{
    const r=await withTimeout(api.v1.common.save({format:'STP',encoding:'base64',stp:{version:2,asPart}}),10000,`save asPart=${asPart}`)
    console.log(`save asPart=${asPart}: maxLevel`,r.maxLevel,'ok',r.result?.success)
  }catch(e){console.error(e.message)}
}
