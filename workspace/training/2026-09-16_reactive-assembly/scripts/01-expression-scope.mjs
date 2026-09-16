export default async function(api,{filewrite,snapshot}){
 const attempt=async(label,fn)=>{try{const r=await fn();filewrite(r,label);return r;}catch(e){filewrite({error:e.message},label);return null;}};
 const root=(await api.v1.assembly.create({name:'ReactiveAssembly'})).result;
 await attempt('assembly-expression',()=>api.v1.part.expression({id:root,toCreate:[{name:'shoulder_height',value:2}]}));
 const master=(await api.v1.assembly.partTemplate({name:'MasterPart'})).result;
 await api.v1.part.expression({id:master,toCreate:[{name:'shoulder_height',value:2}]});
 await api.v1.part.box({id:master,length:10,width:10,height:'@expr.shoulder_height'});
 const child=(await api.v1.assembly.partTemplate({name:'Follower'})).result;
 await attempt('child-master-reference',()=>api.v1.part.box({id:child,length:5,width:5,height:'@expr.shoulder_height'}));
 filewrite(await api.tree(),'tree');
 await api.v1.part.expression({id:child,toCreate:[{name:'shoulder_height',value:2}]});
 await api.v1.part.box({id:child,length:5,width:5,height:'@expr.shoulder_height'});
 await api.v1.assembly.instance({ownerId:root,productId:master,name:'Master'});
 await api.v1.assembly.instance({ownerId:root,productId:child,name:'Follower',transformation:[[15,0,0],[1,0,0],[0,1,0]]});
 const before={a:(await api.v1.part.calculateMassProperties({id:master})).result,b:(await api.v1.part.calculateMassProperties({id:child})).result};
 await api.v1.part.updateExpression({id:master,toUpdate:[{name:'shoulder_height',value:3}]});
 const after={a:(await api.v1.part.calculateMassProperties({id:master})).result,b:(await api.v1.part.calculateMassProperties({id:child})).result};
 filewrite({before,after},'scope-masses');await snapshot('scope',{view:'iso'});
 console.log('Independent part scopes',JSON.stringify({before,after}));
}
