import {setup,mass} from './_setup.mjs';
export default async function(api,{filewrite,snapshot}){
 let s=await setup(api);const stages=[];
 async function record(label){stages.push({label,assembly:await mass(api,s.root),shell:await mass(api,s.shell),plunger:await mass(api,s.plunger)});}
 await record('initial');await snapshot('before',{view:'iso'});
 await api.v1.part.updateExpression({id:s.shell,toUpdate:[{name:'seat_height',value:14}]});await record('seat14');
 await api.v1.part.updateExpression({id:s.plunger,toUpdate:[{name:'shoulder_height',value:3}]});await record('shoulder3');
 const saved=(await api.v1.common.save({format:'OFB',encoding:'base64'})).result;
 filewrite({success:saved.success},'save');
 const loaded=(await api.v1.common.load({data:saved.content,format:'OFB',encoding:'base64',doClear:1})).result;
 const tree=await api.tree();s.root=loaded.id;
 s.shell=Object.values(tree).find(n=>n.class==='CC_Part'&&n.name==='Shell').id;
 s.plunger=Object.values(tree).find(n=>n.class==='CC_Part'&&n.name==='Plunger').id;
 await record('reloaded');
 await api.v1.part.updateExpression({id:s.plunger,toUpdate:[{name:'shoulder_height',value:4}]});await record('shoulder4-after-load');
 filewrite(stages,'stages');filewrite(await api.tree(),'tree');await snapshot('after',{view:'iso'});
 const instances=(await api.v1.assembly.getInstance({ownerId:s.root})).result;
 filewrite(await Promise.all(instances.map(async id=>({id,mass:await mass(api,id)}))),'instance-masses-at-end');
 console.log('Stages',JSON.stringify(stages));
}
