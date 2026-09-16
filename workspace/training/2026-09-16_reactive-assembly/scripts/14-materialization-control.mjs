import {setup,mass} from './_setup.mjs';
export default async function(api,{filewrite}){
 const results=[];
 for(const mode of ['never-before-final','once-before-edits','each-edit']){
  await api.v1.common.clear({});const s=await setup(api,{registry:true});
  const result={mode,initialRoot:await mass(api,s.root),stages:[]};
  if(mode!=='never-before-final')result.initialInstances=await Promise.all(s.ids.map(id=>mass(api,id)));
  for(const height of [3,5,2]){
   await api.v1.part.updateExpression({id:s.master,toUpdate:[{name:'shoulder_height',value:height}]});
   await api.v1.part.updateExpression({id:s.shell,toUpdate:[{name:'seat_height',value:'Params.ExpressionSet.seat_height'}]});
   await api.v1.part.updateExpression({id:s.plunger,toUpdate:[{name:'shoulder_height',value:'Params.ExpressionSet.shoulder_height'}]});
   const tree=await api.tree();const stage={height,expectedRoot:2400+18*height,expectedPart:9*height,transforms:s.ids.map(id=>tree[id].coordinateSystem),rootBeforeInstanceQuery:await mass(api,s.root),template:await mass(api,s.plunger)};
   if(mode==='each-edit'){
    stage.instances=await Promise.all(s.ids.map(id=>mass(api,id)));
    stage.rootAfterInstanceQuery=await mass(api,s.root);
   }
   result.stages.push(stage);
  }
  result.finalInstances=await Promise.all(s.ids.map(id=>mass(api,id)));result.finalRoot=await mass(api,s.root);
  // A further edit after every case has now measured instances.
  await api.v1.part.updateExpression({id:s.master,toUpdate:[{name:'shoulder_height',value:4}]});
  await api.v1.part.updateExpression({id:s.shell,toUpdate:[{name:'seat_height',value:'Params.ExpressionSet.seat_height'}]});
  await api.v1.part.updateExpression({id:s.plunger,toUpdate:[{name:'shoulder_height',value:'Params.ExpressionSet.shoulder_height'}]});
  result.postMeasurementEdit={height:4,instances:await Promise.all(s.ids.map(id=>mass(api,id))),root:await mass(api,s.root)};
  results.push(result);
 }
 filewrite(results,'results');console.log(JSON.stringify(results));
}
