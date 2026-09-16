import fs from 'node:fs';
import {connectSession,buildScriptApi} from '@classcad/script/node';
import {SUPPRESS_EMISSION} from '../../../../packages/script/dist/emission.js';
import registry from '@classcad/skill/method-registry.json' with {type:'json'};
const folder='/Users/dev/dev/eibenstock/sources/projects/pvs_monocular/cad_housing/classcad';
export default async function(unused,helpers){
 const session=await connectSession('ws://127.0.0.1:19094/',{debug:true});
 await session.setEmissionConfig(SUPPRESS_EMISSION);
 const api=buildScriptApi(session,{registry});
 try {
 const recipe=JSON.parse(fs.readFileSync(folder+'/design-recipe.json'));
 const source=fs.readFileSync(folder+'/native-builder.js','utf8');
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 const partName='Base';
 const outputPath=folder+'/native-parts/'+partName+'.ofb';
 const plan=await new AsyncFunction('recipe','partName','dryRun','preparedExpressions','outputPath',source)(recipe,partName,true,[],outputPath);
 const result=await new AsyncFunction('api','recipe','partName','dryRun','preparedExpressions','outputPath',source)(api,recipe,partName,false,plan,outputPath);
 fs.writeFileSync(folder+'/native-parts/'+partName+'.json',JSON.stringify(result,null,2));
 helpers.filewrite(result,partName+'-production');
 } finally {session.close();}
}
