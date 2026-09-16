import {setup,mass} from './_setup.mjs';
export default async function(api,{filewrite}){
 const s=await setup(api);const stages=[];
 async function record(label){stages.push({label,part:await mass(api,s.plunger),assembly:await mass(api,s.root),instances:await Promise.all(s.ids.map(id=>mass(api,id)))});}
 await record('measured-instances');
 await api.v1.part.updateExpression({id:s.plunger,toUpdate:[{name:'shoulder_height',value:3}]});await record('edited');
 await api.v1.common.recalc({});await record('recalculated');filewrite(stages,'stages');console.log(JSON.stringify(stages));
}
