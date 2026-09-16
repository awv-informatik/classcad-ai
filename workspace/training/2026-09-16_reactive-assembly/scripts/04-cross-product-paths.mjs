import {mass} from './_setup.mjs';
export default async function(api,{filewrite,snapshot}){
 let root=(await api.v1.assembly.create({name:'SharedRegistryProbe'})).result;
 let master=(await api.v1.assembly.partTemplate({name:'Dimensions'})).result;
 await api.v1.part.expression({id:master,toCreate:[{name:'shoulder_height',value:2}]});
 let shell=(await api.v1.assembly.partTemplate({name:'Shell'})).result;
 await api.v1.part.expression({id:shell,toCreate:[{name:'seat_height',value:'Dimensions.ExpressionSet.shoulder_height + 10'}]});
 await api.v1.part.box({id:shell,length:10,width:10,height:'@expr.seat_height'});
 let plunger=(await api.v1.assembly.partTemplate({name:'Plunger'})).result;
 await api.v1.part.expression({id:plunger,toCreate:[{name:'shoulder_height',value:'Shell.ExpressionSet.seat_height - 10'}]});
 await api.v1.part.box({id:plunger,length:3,width:3,height:'@expr.shoulder_height'});
 await api.v1.assembly.instance({ownerId:root,productId:shell,name:'Shell'});
 for(let x of [15,25])await api.v1.assembly.instance({ownerId:root,productId:plunger,name:'Plunger'+x,transformation:[[x,0,0],[1,0,0],[0,1,0]]});
 const stages=[];
 async function record(label){stages.push({label,source:(await api.v1.part.getExpression({id:master,name:'shoulder_height'})).result,derived:(await api.v1.part.getExpression({id:plunger,name:'shoulder_height'})).result,shell:await mass(api,shell),plunger:await mass(api,plunger),assembly:await mass(api,root)});}
 await record('before');await snapshot('before',{view:'iso'});
 await api.v1.part.updateExpression({id:master,toUpdate:[{name:'shoulder_height',value:3}]});await record('update-only');
 await api.v1.common.recalc({});await record('one-recalc');
 await api.v1.common.recalc({});await record('two-recalcs');await snapshot('after',{view:'iso'});
 const saved=(await api.v1.common.save({format:'OFB',encoding:'base64'})).result;
 root=(await api.v1.common.load({format:'OFB',encoding:'base64',data:saved.content,doClear:1})).result.id;
 const nodes=Object.values(await api.tree());const id=n=>nodes.find(x=>x.class==='CC_Part'&&x.name===n).id;
 master=id('Dimensions');shell=id('Shell');plunger=id('Plunger');await record('reload');
 await api.v1.part.updateExpression({id:master,toUpdate:[{name:'shoulder_height',value:4}]});await api.v1.common.recalc({});await record('reload-edit-recalc');
 filewrite(stages,'stages');filewrite(await api.tree(),'tree');console.log('Cross-product chain',JSON.stringify(stages));
}
