import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const folder=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
export async function runFrozen(api,helpers,{label='baseline',partName='Base',mode='tapered',stopBefore=false,reverse=false,checkpoint=true,full=false,sourceName='native-builder.js',simpleOuter=false,refreshBefore=false}={}) {
 const recipe=JSON.parse(fs.readFileSync(path.join(folder,'inputs/design-recipe.json')));
 const root=recipe.nodes[600];
 if(simpleOuter)recipe.nodes[585]={id:585,op:'makeBox',args:[93.8,72.9,38.2,[-1.3,-7,-1.3]],children:[],source:'simple-control'};
 if(!full)recipe.nodes[598].children=recipe.nodes[598].children.slice(0,2);
 if(reverse)recipe.nodes[598].children.reverse();
 recipe.parts={[partName]:{...recipe.parts[partName],root:full?recipe.parts[partName].root:root.id}};
 let source=fs.readFileSync(path.join(folder,'inputs',sourceName),'utf8');
 if(mode==='native')source=source.replace("if(n.op==='chamfer' && recipe.nodes[n.children[0]].op==='extrude')", "if(false && n.op==='chamfer' && recipe.nodes[n.children[0]].op==='extrude')");
 if(mode==='square') for(const n of Object.values(recipe.nodes)) if(n.op==='chamfer'&&recipe.nodes[n.children[0]].op==='extrude') recipe.nodes[n.id]={...recipe.nodes[n.children[0]],id:n.id};
 const outputPath=path.join(folder,'files',label+'-result.ofb');
 const plan=await new AsyncFunction('recipe','partName','dryRun','preparedExpressions','outputPath',source)(recipe,partName,true,[],outputPath);
 const progress=path.join(folder,'files',label+'-calls.jsonl');fs.writeFileSync(progress,'');
 const record=x=>fs.appendFileSync(progress,JSON.stringify({at:new Date().toISOString(),...x})+'\n');
 const wrapped={...api,v1:{...api.v1,part:{...api.v1.part}}};
 for(const domain of ['part','sketch','common','assembly']) {
   wrapped.v1[domain]=new Proxy(api.v1[domain],{get(target,key){const fn=target[key];if(typeof fn!=='function')return fn;return async args=>{
     const critical=domain==='part'&&key==='boolean'&&String(args.name).includes('cut_housing_shell_py_58_tool_1');
     if(critical&&refreshBefore)await api.tree({refresh:true});
     if(critical&&checkpoint){
       const t=await api.tree({refresh:true});
       const solids=Object.values(t).filter(n=>n.class==='CC_Solid'&&n.members?.consumed?.value===0);
       const masses=[];for(const n of solids)masses.push({id:n.id,parent:n.parent,mass:await api.v1.part.calculateMassProperties({id:n.id})});
       helpers.filewrite({args,masses,tree:t},label+'-before');
       await api.v1.common.save({file:path.join(folder,'files',label+'-before.ofb'),format:'OFB'});
       await helpers.snapshot(label+'-before',{recalc:false,colors:'distinct',width:1000,height:750,layers:['solid']});
       if(stopBefore)throw new Error('PLANNED_STOP: operands saved');
     }
     const timed=domain==='part'&&['boolean','chamfer','extrusion'].includes(key);
     if(timed)record({event:'begin',api:domain+'.'+key,args});
     const start=Date.now();const r=await fn(args);
     if(timed)record({event:'end',api:domain+'.'+key,name:args.name,elapsedMs:Date.now()-start,result:r.result,maxLevel:r.maxLevel,messages:r.messages});
     return {result:r.result,maxLevel:r.maxLevel,messages:r.messages,structure:null,graphic:null};
   }}});
 }
 const result=await new AsyncFunction('api','recipe','partName','dryRun','preparedExpressions','outputPath',source)(wrapped,recipe,partName,false,plan,outputPath);
 helpers.filewrite(result,label+'-result');await api.v1.common.save({file:path.join(folder,'files',label+'-result.step'),format:'STP'});await helpers.snapshot(label+'-result',{recalc:false,width:1000,height:750,layers:['solid']});return result;
}
