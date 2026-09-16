import {setup,mass} from './_setup.mjs';
export default async function(api,{filewrite}){
 const results=[];
 for(const mode of ['extra-shell-refresh','final-recalc']){
  await api.v1.common.clear({});const s=await setup(api,{registry:true});
  const refresh=async(id,name,value)=>api.v1.part.updateExpression({id,toUpdate:[{name,value}]});
  for(const height of [3,5,2]){
   await refresh(s.master,'shoulder_height',height);
   await refresh(s.shell,'seat_height','Params.ExpressionSet.seat_height');
   await refresh(s.plunger,'shoulder_height','Params.ExpressionSet.shoulder_height');
   if(mode==='extra-shell-refresh')await refresh(s.shell,'seat_height','Params.ExpressionSet.seat_height');
   else await api.v1.common.recalc({});
   const assembly=await mass(api,s.root);const instances=await Promise.all(s.ids.map(id=>mass(api,id)));
   const bottom=instances[0].cog.z-height/2;
   results.push({mode,height,assembly,instances,pass:Math.abs(assembly.volume-(2400+18*height))<.001&&Math.abs(instances[1].cog.z-(10+1.5*height))<.001&&bottom>=9+height-.002&&bottom<=10+height+.002});
  }
 }
 filewrite(results,'results');console.log(JSON.stringify(results));
}
