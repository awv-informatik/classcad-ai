import {setup,mass} from './_setup.mjs';
export default async function(api,{filewrite}){
 const s=await setup(api,{registry:true});const stages=[];
 await api.v1.part.updateExpression({id:s.master,toUpdate:[{name:'shoulder_height',value:3}]});
 for(let i=1;i<=3;i++){await api.v1.common.recalc({});stages.push({recalc:i,assembly:await mass(api,s.root),button:await mass(api,s.ids[1]),shell:await mass(api,s.si)});}
 const joint=(await api.v1.assembly.getFastened({id:s.root,name:'ButtonRest'})).result;
 filewrite(joint,'joint-before');
 await api.v1.assembly.updateFastened({id:joint.id,zOffset:0});
 stages.push({label:'refresh-offset0',button:await mass(api,s.ids[1]),shell:await mass(api,s.si)});
 filewrite(stages,'stages');console.log(JSON.stringify(stages));
}
