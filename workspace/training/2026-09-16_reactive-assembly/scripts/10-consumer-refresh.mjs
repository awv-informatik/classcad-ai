import {setup,mass} from './_setup.mjs';
export default async function(api,{filewrite,snapshot}){
 const results=[];
 for(const mode of ['direct','chained']){
  await api.v1.common.clear({});let s=await setup(api,{registry:true});
  const formula=mode==='direct'?'Params.ExpressionSet.shoulder_height':'Shell.ExpressionSet.seat_height - 10';
  await api.v1.part.updateExpression({id:s.plunger,toUpdate:[{name:'shoulder_height',value:formula}]});
  for(const height of [3,5,2]){
   await api.v1.part.updateExpression({id:s.master,toUpdate:[{name:'shoulder_height',value:height}]});
   await api.v1.part.updateExpression({id:s.shell,toUpdate:[{name:'seat_height',value:'Params.ExpressionSet.seat_height'}]});
   await api.v1.part.updateExpression({id:s.plunger,toUpdate:[{name:'shoulder_height',value:formula}]});
   const tree=await api.tree();
   const r={mode,height,transforms:s.ids.map(id=>tree[id].coordinateSystem),assembly:await mass(api,s.root),instances:await Promise.all(s.ids.map(id=>mass(api,id))),shell:await mass(api,s.si),reference:await mass(api,s.swi)};
   r.expected={volume:2400+18*height,fastenedZ:10+height+height/2,sliderBottomRange:[9+height,10+height]};
   r.pass=Math.abs(r.assembly.volume-r.expected.volume)<.001 && Math.abs(r.instances[1].cog.z-r.expected.fastenedZ)<.001 && r.instances.every(m=>Math.abs(m.volume-9*height)<.001)&&Math.abs(r.reference.cog.z-5)<.001;
   results.push(r);
  }
  // Slider must still clamp relative to the refreshed datum, without updating the joint.
  for(const offset of [-20,20]){
   await api.v1.assembly.startMovingUnderConstraints({id:s.root,instanceIds:[s.ids[0]],pivotInfo:[0,0,0],mucType:'TRANSLATION_1D'});
   await api.v1.assembly.moveUnderConstraints({id:s.root,offset:[0,0,offset]});await api.v1.assembly.finishMovingUnderConstraints({id:s.root});
   const m=await mass(api,s.ids[0]);results.push({mode,offset,sliderCOG:m.cog.z,expected:offset<0?12:13,pass:Math.abs(m.cog.z-(offset<0?12:13))<.001});
  }
  const saved=(await api.v1.common.save({format:'OFB',encoding:'base64'})).result;
  const root=(await api.v1.common.load({data:saved.content,format:'OFB',encoding:'base64',doClear:1})).result.id;
  const tree=await api.tree();const named=(cl,n)=>Object.values(tree).find(o=>o.class===cl&&o.name===n).id;
  await api.v1.part.updateExpression({id:named('CC_Part','Params'),toUpdate:[{name:'shoulder_height',value:4}]});
  await api.v1.part.updateExpression({id:named('CC_Part','Shell'),toUpdate:[{name:'seat_height',value:'Params.ExpressionSet.seat_height'}]});
  await api.v1.part.updateExpression({id:named('CC_Part','Plunger'),toUpdate:[{name:'shoulder_height',value:formula}]});
  const assembly=await mass(api,root),button=await mass(api,named('CC_ProductReference','ButtonB'));
  results.push({mode,label:'reload-refresh',assembly,button,pass:Math.abs(assembly.volume-2472)<.001&&Math.abs(button.cog.z-16)<.001});
 }
 filewrite(results,'results');console.log(JSON.stringify(results));await snapshot('final',{view:'iso'});
}
