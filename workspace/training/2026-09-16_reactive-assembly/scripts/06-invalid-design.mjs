import {setup,mass,attempt} from './_setup.mjs';
export default async function(api,{filewrite,snapshot}){
 const s=await setup(api);
 filewrite(await attempt(()=>api.v1.part.updateExpression({id:s.plunger,toUpdate:[{name:'shoulder_height',value:-1}]})),'negative-height');
 filewrite(await api.tree(),'invalid-tree');filewrite(await api.v1.part.getExpression({id:s.plunger,name:'shoulder_height'}),'invalid-expression');
 await api.v1.part.updateExpression({id:s.plunger,toUpdate:[{name:'shoulder_height',value:2}]});
 filewrite(await attempt(()=>api.v1.assembly.fastenedOrigin({id:s.root,name:'ContradictRest',mate1:{path:[s.ids[1]],csys:s.pd},zOffset:50})),'conflicting-assembly');
 filewrite(await api.tree(),'conflict-tree');
 await snapshot('conflict',{view:'iso'});
}
