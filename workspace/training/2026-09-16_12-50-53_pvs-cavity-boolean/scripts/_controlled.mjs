import {connectSession,buildScriptApi} from '@classcad/script/node';
import {SUPPRESS_EMISSION} from '../../../../packages/script/dist/emission.js';
import registry from '@classcad/skill/method-registry.json' with {type:'json'};
import {renderSession} from '@classcad/renderer/node';
import {folder,runFrozen} from './_frozen.mjs';
export async function controlled(helpers,{label,config={},...options}) {
 const session=await connectSession('ws://127.0.0.1:19094/',{debug:true});
 const old=await session.getEmissionConfig();
 await session.setEmissionConfig({...SUPPRESS_EMISSION,...config});
 helpers.filewrite({old,effective:await session.getEmissionConfig()},label+'-emission');
 try {
  return await runFrozen(buildScriptApi(session,{registry}),{...helpers,snapshot:async(name,opts)=>renderSession(session,name,folder+'/files',opts)}, {label,checkpoint:false,...options});
 } finally {await session.setEmissionConfig(old);session.close();}
}
