import {mass,attempt} from './_setup.mjs';
export default async function(api,{filewrite}){
 const root=(await api.v1.assembly.create({name:'Root'})).result;
 const params=(await api.v1.assembly.partTemplate({name:'Params'})).result;
 await api.v1.part.expression({id:params,toCreate:[{name:'H',value:4}]});
 const sub=(await api.v1.assembly.assemblyTemplate({name:'Module'})).result;
 const parts=[];
 for(const name of ['Shell','Plunger']){
  const id=(await api.v1.assembly.partTemplate({name})).result;parts.push(id);
  await api.v1.part.expression({id,toCreate:[{name:'H',value:'Params.ExpressionSet.H'}]});
  await api.v1.part.box({id,length:name==='Shell'?10:2,width:name==='Shell'?10:2,height:'@expr.H'});
 }
 const origin=(await api.v1.part.workCSys({id:parts[0],name:'Origin'})).result;
 const top=(await api.v1.part.workCSys({id:parts[0],name:'TopDatum',offset:'[0,0,@expr.H]'})).result;
 const pd=(await api.v1.part.workCSys({id:parts[1],name:'Foot'})).result;
 const si=(await api.v1.assembly.instance({ownerId:sub,productId:parts[0]})).result;
 const pi=(await api.v1.assembly.instance({ownerId:sub,productId:parts[1]})).result;
 await api.v1.assembly.fastenedOrigin({id:sub,mate1:{path:[si],csys:origin}});
 await api.v1.assembly.fastened({id:sub,mate1:{path:[si],csys:top},mate2:{path:[pi],csys:pd}});
 const outer=[];for(const x of [0,100])outer.push((await api.v1.assembly.instance({ownerId:root,productId:sub,transformation:[[x,0,0],[1,0,0],[0,1,0]]})).result);
 const results=[];
 for(const height of [5,7,3]){
  await api.v1.part.updateExpression({id:params,toUpdate:[{name:'H',value:height}]});
  for(const id of parts)await api.v1.part.updateExpression({id,toUpdate:[{name:'H',value:'Params.ExpressionSet.H'}]});
  const tree=await api.tree();const leaves=await Promise.all(parts.map(id=>mass(api,id)));const modules=await Promise.all(outer.map(id=>attempt(()=>mass(api,id))));const assembly=await attempt(()=>mass(api,root));
  results.push({height,plungerTransform:tree[pi].coordinateSystem,leaves,modules,assembly,pass:Math.abs(tree[pi].coordinateSystem[0][2]-height)<.001&&Math.abs(leaves[0].volume-100*height)<.001&&Math.abs(leaves[1].volume-4*height)<.001});
 }
 filewrite(results,'results');console.log(JSON.stringify(results));
}
