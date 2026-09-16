import {setup,mass} from './_setup.mjs';
export default async function(api,{filewrite}){
 const results=[];
 for(const mode of ['instance-first','instance-recalc-root']){
  await api.v1.common.clear({});const s=await setup(api,{registry:true});
  for(const height of [3,5,2]){
   await api.v1.part.updateExpression({id:s.master,toUpdate:[{name:'shoulder_height',value:height}]});
   await api.v1.part.updateExpression({id:s.shell,toUpdate:[{name:'seat_height',value:'Params.ExpressionSet.seat_height'}]});
   await api.v1.part.updateExpression({id:s.plunger,toUpdate:[{name:'shoulder_height',value:'Params.ExpressionSet.shoulder_height'}]});
   const instances=await Promise.all([...s.ids,s.si,s.swi].map(id=>mass(api,id)));
   if(mode==='instance-recalc-root')await api.v1.common.recalc({});
   const assembly=await mass(api,s.root);
   const sum=instances.reduce((a,m)=>a+m.volume,0);
   results.push({mode,height,volume:assembly.volume,sum,fastenedZ:instances[1].cog.z,pass:Math.abs(assembly.volume-(2400+18*height))<.001&&Math.abs(sum-assembly.volume)<.001&&Math.abs(instances[1].cog.z-(10+1.5*height))<.001});
  }
 }
 filewrite(results,'results');console.log(JSON.stringify(results));
}
