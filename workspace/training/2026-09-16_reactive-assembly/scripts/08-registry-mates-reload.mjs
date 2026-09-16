import {setup,mass} from './_setup.mjs';
export default async function(api,{filewrite}){
 const s=await setup(api);
 const master=(await api.v1.assembly.partTemplate({name:'Params'})).result;
 await api.v1.part.expression({id:master,toCreate:[{name:'shoulder_height',value:2},{name:'seat_height',value:'10 + shoulder_height'}]});
 await api.v1.part.updateExpression({id:s.shell,toUpdate:[{name:'seat_height',value:'Params.ExpressionSet.seat_height'}]});
 await api.v1.part.updateExpression({id:s.plunger,toUpdate:[{name:'shoulder_height',value:'Params.ExpressionSet.shoulder_height'}]});
 const stages=[];
 async function record(label,root){const t=await api.tree();const part=n=>Object.values(t).find(x=>x.class==='CC_Part'&&x.name===n).id;const inst=n=>Object.values(t).find(x=>x.class==='CC_ProductReference'&&x.name===n).id;stages.push({label,assembly:await mass(api,root),plunger:await mass(api,part('Plunger')),button:await mass(api,inst('ButtonB')),shell:await mass(api,inst('Shell')),reference:await mass(api,inst('SwitchReference'))});}
 await record('before',s.root);
 await api.v1.part.updateExpression({id:master,toUpdate:[{name:'shoulder_height',value:3}]});await api.v1.common.recalc({});await record('one-recalc',s.root);
 await api.v1.common.recalc({});await record('two-recalcs',s.root);
 const saved=(await api.v1.common.save({format:'OFB',encoding:'base64'})).result;
 const root=(await api.v1.common.load({data:saved.content,format:'OFB',encoding:'base64',doClear:1})).result.id;
 const m=Object.values(await api.tree()).find(x=>x.class==='CC_Part'&&x.name==='Params').id;
 await api.v1.part.updateExpression({id:m,toUpdate:[{name:'shoulder_height',value:4}]});await api.v1.common.recalc({});await record('reloaded-one-recalc',root);
 filewrite(stages,'stages');console.log(JSON.stringify(stages));
}
