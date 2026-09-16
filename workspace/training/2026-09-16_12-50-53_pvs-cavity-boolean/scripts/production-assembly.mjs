import fs from 'node:fs';
const folder='/Users/dev/dev/eibenstock/sources/projects/pvs_monocular/cad_housing/classcad';
export default async function(api,helpers){
 function check(r){if(r.maxLevel>=51)throw new Error(JSON.stringify(r.messages));return r.result;}
 for(const name of ['Base','Upper_shell']) {
  check(await api.v1.common.load({file:folder+'/native-parts/'+name+'.ofb',format:'OFB',doClear:1}));
  check(await api.v1.common.save({file:folder+'/native-parts/'+name+'.step',format:'STP'}));
 }
 check(await api.v1.common.clear({}));
 const A=Object.getPrototypeOf(async function(){}).constructor;
 const result=await new A('api',fs.readFileSync(folder+'/assembly.classcad.js','utf8'))(api);
 fs.writeFileSync(folder+'/assembly-check.json',JSON.stringify(result,null,2));
 await helpers.snapshot('printed-housing',{recalc:false,width:1200,height:900,layers:['solid']});
}
