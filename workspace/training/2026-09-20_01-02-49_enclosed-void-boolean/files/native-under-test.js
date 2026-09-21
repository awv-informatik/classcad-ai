// v2 housing: one root drawing, one pass. Sketch construction shared with v1; features are generic steps.
const ok=r=>{if((r.maxLevel??0)>=51)throw Error(JSON.stringify(r.messages));return r.result;};
const values=MODEL.parameters;
const number=v=>typeof v==='number'?v:Function(...Object.keys(values),'sqrt','return ('+v+')')(...Object.values(values),Math.sqrt);
const vector=v=>v.map(number);
const formula=v=>typeof v==='number'?v:v.replace(/\b[A-Za-z_]\w*\b/g,k=>Object.hasOwn(values,k)?'@expr.'+k:k);
const vectorFormula=v=>'['+v.map(formula).join(',')+']';
const dimension=(v,offset=0)=>typeof v==='number'?v+offset:'('+formula(v)+')'+(offset?'+'+offset:'');
function belongs(tree,node,part){let n=node;while(n){if(n.id===part)return true;n=tree[n.parent];}return false;}
async function auditPart(part){
 const tree=await api.tree(),nodes=Object.values(tree).filter(n=>belongs(tree,n,part));const sketches=[];
 for(const n of nodes.filter(n=>n.class==='CC_Sketch')){
  const state=ok(await api.v1.sketch.getGlobalState({id:n.id}));
  const diagnostics=ok(await api.v1.sketch.getDiagnosticsInfo({id:n.id}));
  if(state.status!=='FULLY_CONSTRAINED'||!diagnostics||!Array.isArray(diagnostics.conflictingSets)||!Array.isArray(diagnostics.redundantConstraints)||diagnostics.conflictingSets.length||diagnostics.redundantConstraints.length)throw Error(n.name+': '+JSON.stringify({state,diagnostics}));
  sketches.push({name:n.name,status:state.status,diagnostics});
 }
 if(!sketches.length)throw Error('No native sketches for '+part);
 if(nodes.some(n=>n.members?.lgsState?.value===0||['CC_Import','CC_EntityInjection'].includes(n.class)))throw Error('Invalid native feature tree '+part);
 const mass=ok(await api.v1.part.calculateMassProperties({id:part}));
 if(!(mass.volume>0))throw Error('Empty part '+part);
 return {part,mass,sketches};
}
async function buildPart(name,root){
 const design=MODEL.parts[name];const part=ok(await api.v1.assembly.partTemplate({name}));
 const instance=ok(await api.v1.assembly.instance({productId:part,ownerId:root,name:(name==='Plunger'?'Plunger_Back':name)+'_instance'}));
 if(design.parameters.length)ok(await api.v1.part.expression({id:part,toCreate:design.parameters.map(name=>({name,value:'Parameters.ExpressionSet.'+name}))}));
 const planes={};for(const [axis,name]of [[0,'Right'],[1,'Front'],[2,'Top']])planes[axis]=ok(await api.v1.part.getWorkGeometry({id:part,name}));
 const profiles={},features={};
 for(const p of design.profiles){
  const sk=ok(await api.v1.sketch.create({id:part,name:p.name,planeId:planes[p.axis]}));
  // Offset datum permits positive signed coordinate dimensions on every plane.
  const anchor=ok(await api.v1.sketch.point({id:sk,pos:[-200,-200,0]}));
  ok(await api.v1.sketch.constraint({id:sk,name:'Local_dimension_datum',type:'FIXATION',geomIds:[anchor]}));
  const refs=[];
  for(const [li,loop]of p.loops.entries()){
   const pts=[],curves=[];
   const rectangle=loop.length===4&&loop.every(e=>e.kind==='line'&&(e.start[0]===e.end[0]||e.start[1]===e.end[1]));
   for(const [ei,e]of loop.entries()){
    const common={id:sk,genFixation:false,genIncidence:false,genTangency:false,genVertAndHoriz:false};
    const id=e.kind==='circle'?ok(await api.v1.sketch.circle({...common,centerPos:[...vector(e.center),0],radius:number(e.radius)})):ok(await api.v1.sketch[e.kind==='arc'?'arcBy3Points':'line']({...common,startPos:[...vector(e.start),0],endPos:[...vector(e.end),0],...(e.kind==='arc'?{midPos:[...vector(e.mid),0]}:{})}));
    refs.push(id);curves.push(id);const points=ok(await api.v1.sketch.getPoints({id}));pts.push(points);
    const xy=e.kind==='circle'?e.center:e.start,point=e.kind==='circle'?points.centerId:points.startId;
    if(!rectangle||ei===0)ok(await api.v1.sketch.dimension([0,1].map(axis=>({id:sk,name:p.name+'_'+li+'_'+ei+(axis?'_v':'_u'),type:axis?'VERTICAL_DISTANCE':'HORIZONTAL_DISTANCE',geomIds:[anchor,point],value:dimension(xy[axis],200)}))));
    // A semicircle's fixed endpoints plus radius are a singular constraint set.
    // Put its centre on the diameter line instead; the endpoints derive its radius.
    if(e.semicircleAxis!==undefined){const axis=e.semicircleAxis;ok(await api.v1.sketch.dimension({id:sk,name:p.name+'_'+li+'_'+ei+'_diameter_center',type:axis?'VERTICAL_DISTANCE':'HORIZONTAL_DISTANCE',geomIds:[anchor,points.centerId],value:dimension(e.start[axis],200)}));}
    if(e.radius)ok(await api.v1.sketch.dimension({id:sk,name:p.name+'_'+li+'_'+ei+'_radius',type:'RADIUS',geomIds:[id],value:formula(e.radius)}));
   }
   if(loop[0].kind!=='circle')ok(await api.v1.sketch.constraint(pts.map((p,i)=>({id:sk,type:'COINCIDENT',geomIds:[p.endId,pts[(i+1)%pts.length].startId]}))));
   if(rectangle){
    ok(await api.v1.sketch.constraint(curves.map((id,i)=>({id:sk,type:loop[i].start[1]===loop[i].end[1]?'HORIZONTAL':'VERTICAL',geomIds:[id]}))));
    for(const axis of [0,1]){
     const i=loop.findIndex(e=>e.start[axis]!==e.end[axis]),j=(i+1)%4;
     const low=number(loop[i].start[axis])<number(loop[j].start[axis])?i:j,high=low===i?j:i;
     const a=loop[high].start[axis],b=loop[low].start[axis];
     ok(await api.v1.sketch.dimension({id:sk,name:p.name+'_'+li+(axis?'_height':'_width'),type:axis?'VERTICAL_DISTANCE':'HORIZONTAL_DISTANCE',geomIds:[pts[low].startId,pts[high].startId],value:typeof a==='number'&&typeof b==='number'?a-b:'('+formula(a)+')-('+formula(b)+')'}));
    }
   }
  }
  profiles[p.name]=refs;
 }

 const made={};
 async function feature(n){
  if(made[n])throw Error('Profile used twice: '+n);const p=design.profiles.find(p=>p.name===n);if(!p)throw Error('Missing profile '+n);
  return made[n]=ok(await api.v1.part.extrusion({id:part,name:n,references:profiles[n],type:'CUSTOM',direction:[0,0,1],limit1:formula(p.start),limit2:formula(p.end)}));
 }
 // Facets are slices by expression-driven work planes: outer at the point, cavity moved in by the wall, grown cutters moved out.
 async function slice(target,planeName,side,label,grow){
  const pl=design.planes[planeName];if(!pl)throw Error('Missing plane '+planeName);
  const shift=side==='outer'?null:side==='inner'?'-(wall)':'+('+grow[planeName]+')';
  const pos=pl.point.map((c,i)=>shift?'('+c+')'+shift+'*('+pl.normal[i]+')/('+pl.length+')':c);
  const wp=ok(await api.v1.part.workPlane({id:part,name:label+'_'+planeName+'_plane',position:vectorFormula(pos),normal:vectorFormula(pl.normal)}));
  return ok(await api.v1.part.slice({id:part,name:label+'_'+planeName,targets:[target],reference:wp,inverted:1}));
 }
 const bool=async(name,target,tools,type)=>ok(await api.v1.part.boolean({id:part,name,target,tools,type}));
 const solids={};let body;
 const tool=async n=>solids[n]??await feature(n);
 for(const step of design.steps){
  if(step.op==='body'){body=await feature(step.profile);continue;}
  if(step.op==='slice'){for(const p of step.planes)body=await slice(body,p,step.side,'Body',step.grow);continue;}
  if(step.op==='solid'){
   let s=await feature(step.profile);for(const p of step.planes)s=await slice(s,p,step.side,step.name,step.grow);
   if(step.minus){const t=[];for(const n of step.minus){t.push(await tool(n));delete solids[n];}s=await bool(step.name+'_less_'+step.minus.join('_'),s,t,'SUBTRACTION');}
   solids[step.name]=s;continue;
  }
  const tools=[];for(const n of step.tools){tools.push(await tool(n));delete solids[n];}
  body=await bool(step.name,body,tools,step.op==='cut'?'SUBTRACTION':'UNION');
  {const m=ok(await api.v1.part.calculateMassProperties({id:part}));console.log(name+' '+step.name+' volume '+m.volume.toFixed(1));}
 }
 ok(await api.v1.common.setAppearance({target:body,color:design.color||[71,82,94]}));
 return {id:part,body,instance,origin:ok(await api.v1.part.workCSys({id:part,name:'Mount'}))};
}
async function construct(){
 ok(await api.v1.common.setDatabaseSettings({isGraphicEnabled:true,isCCGraphicEnabled:true,isSketchGraphicEnabled:true,doCurveTessellation:true}));
 const root=ok(await api.v1.assembly.create({name:'PVS v2 housing'}));
 const params=ok(await api.v1.assembly.partTemplate({name:'Parameters'}));
 ok(await api.v1.part.expression({id:params,toCreate:Object.entries(values).map(([name,value])=>({name,value}))}));
 const parameterInstance=ok(await api.v1.assembly.instance({productId:params,ownerId:root,name:'Parameters'}));
 const parameterOrigin=ok(await api.v1.part.workCSys({id:params,name:'Mount'}));
 ok(await api.v1.assembly.fastenedOrigin({id:root,name:'Ground_parameters',mate1:{path:[parameterInstance],csys:parameterOrigin}}));
 const parts={},audits={},instances={};
 for(const name of Object.keys(MODEL.parts)){console.log('Building template '+name);parts[name]=await buildPart(name,root);audits[name]=await auditPart(parts[name].id);}
 const tub=parts.Tub,mounts={};
 for(const [name,m]of Object.entries(MODEL.mounts))mounts[name]=ok(await api.v1.part.workCSys({id:tub.id,name:name+'_mount',offset:vectorFormula(m.offset)}));
 ok(await api.v1.assembly.setCurrentProduct({id:root}));
 instances.Tub=tub.instance;
 ok(await api.v1.assembly.fastenedOrigin({id:root,name:'Ground_tub',mate1:{path:[instances.Tub],csys:tub.origin}}));
 let first={};
 for(const [name,m]of Object.entries(MODEL.mounts)){
  instances[name]=first[m.product]?ok(await api.v1.assembly.instance({productId:parts[m.product].id,ownerId:root,name:name+'_instance'})):parts[m.product].instance;first[m.product]=true;
  ok(await api.v1.assembly.fastened({id:root,name:name+'_mounting',mate1:{path:[instances.Tub],csys:mounts[name]},mate2:{path:[instances[name]],csys:parts[m.product].origin}}));
 }
 ok(await api.v1.common.setUserData({id:root,key:'parameterIndex',value:JSON.stringify(MODEL.index)}));
 const tree=await api.tree({refresh:true});const placements={};
 for(const [name,id]of Object.entries(instances)){
  const cs=tree[id].coordinateSystem;if(!cs||cs.length<3)throw Error('Missing solved placement '+name);
  placements[name]={product:name==='Tub'?'Tub':MODEL.mounts[name].product,offset:cs[0],xDir:cs[1],yDir:cs[2]};
  const wanted=MODEL.instances[name];
  if(cs[0].some((v,i)=>Math.abs(v-wanted.offset[i])>1e-6))throw Error('Incorrect assembly placement '+name+': '+JSON.stringify(cs));
 }
 const nodes=Object.values(tree),references=nodes.filter(n=>['CC_ProductReference','CC_ProductReferenceET'].includes(n.class));
 if(references.length!==1+Object.keys(instances).length||references[0].id!==parameterInstance)throw Error('Expected Parameters first, then the printed instances');
 if(nodes.some(n=>belongs(tree,n,params)&&n.class==='CC_Sketch'))throw Error('Parameters must remain geometry-free');
 if(nodes.some(n=>n.members?.lgsState?.value===0))throw Error('Unsatisfied assembly constraints');
 const mass=ok(await api.v1.assembly.calculateMassProperties({id:root}));
 for(const [format,ext]of [['OFB','ofb'],['STP','step']])if(ok(await api.v1.common.save({file:OUT+'/PVS-v2-assembly.'+ext,format})).success!==1)throw Error('Assembly export failed');
 for(const [name,part]of Object.entries(parts))if(ok(await api.v1.assembly.exportNode({id:part.id,file:OUT+'/parts/'+name+'.step',format:'STP'})).success!==1)throw Error('Part export failed '+name);
 return {root,params,parameterInstance,parts,instances,placements,audits,mass};
}
const built=await construct();
return built;
