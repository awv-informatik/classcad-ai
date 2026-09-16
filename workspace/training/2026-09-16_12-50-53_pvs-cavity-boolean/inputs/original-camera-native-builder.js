// Executed inside ClassCAD run_script. Only public sketch/part/assembly APIs.
// The host supplies recipe, partName and outputPath. No geometry import occurs.
const val = x => typeof x==='object' && x!==null && 'v' in x ? x.v : x;
const ex = x => typeof x==='object' && x!==null && 'e' in x ? x.e : (Number(x)<0?'('+String(x)+')':String(x));
const sym = (v,e) => ({v,e});
const add=(a,b)=>sym(val(a)+val(b),`(${ex(a)}+${ex(b)})`);
const sub=(a,b)=>sym(val(a)-val(b),`(${ex(a)}-${ex(b)})`);
const mul=(a,b)=>sym(val(a)*val(b),`(${ex(a)}*${ex(b)})`);
function ok(r,label) {
  if(r.maxLevel>=51 || r.result===undefined) throw new Error(label+': '+JSON.stringify(r));
  return r.result;
}
const part=dryRun?4:ok(await api.v1.part.create({name:partName}),'create');
if(!dryRun)ok(await api.v1.part.expression({id:part,toCreate:[...Object.entries(recipe.masters).filter(([name])=>preparedExpressions.some(e=>new RegExp('\\b'+name+'\\b').test(String(e.value)))).map(([name,value])=>({name,value})),...preparedExpressions]}),'expression graph');
const expressionPlan=[];let fakeId=100;
let serial=0,featureCount=0,sketchCount=0;
const names=[]; const circleProfiles=new Map(); const profileData=new Map();
async function expression(x,label) {
  const name=`d${serial++}_${label}`;
  expressionPlan.push({name,value:ex(x).replaceAll('+-','-').replaceAll('--','+').replace(/([*/])(-[0-9.]+(?:e[-+]?\d+)?)/gi,'$1($2)')});
  return '@expr.'+name;
}
async function call(domain,method,p) {if(dryRun){fakeId+=10;if(method==='rectangle')return [fakeId,fakeId+1,fakeId+2,fakeId+3];if(method==='getPoints')return {startId:fakeId,endId:fakeId+1,centerId:fakeId+2};return fakeId;}try {return ok(await api.v1[domain][method](p),method+' '+(p.name||''));} catch(e) {throw new Error(method+' '+(p.name||'')+': '+e.message);}}
const axes={}; const planes={};
for(const a of ['X','Y','Z']) axes[a]=await call('part','getWorkGeometry',{id:part,name:a+'Axis'});
for(const a of ['Top','Front','Right']) planes[a]=await call('part','getWorkGeometry',{id:part,name:a});
async function dimension(sk,geom,type,x,label) {
  return call('sketch','dimension',{id:sk,name:label,type,geomIds:geom,value:await expression(x,label)});
}
async function sketch(plane,name) {sketchCount++;if(!dryRun)console.log('Sketch '+name);return call('sketch','create',{id:part,planeId:plane,name});}
async function translate(feature,vector,name) {
  for(let i=0;i<3;i++) if(Math.abs(val(vector[i]))>1e-12 || typeof vector[i]==='object') {
    feature=await call('part','translation',{id:part,name:name+'_'+i,targets:[feature],references:[axes['XYZ'[i]]],distance:await expression(vector[i],'position')});
  }
  return feature;
}
async function orient(feature,direction,name) {
  const d=direction.map(val),len=Math.hypot(...d),z=d[2]/len;
  if(z>1-1e-12)return feature;
  const axis=z< -1+1e-12?[1,0,0]:[-d[1],d[0],0];
  const ref=await call('part','workAxis',{id:part,name:name+'_axis',position:[0,0,0],direction:axis});
  return call('part','rotation',{id:part,name:name+'_orientation',targets:[feature],references:[ref],angle:Math.acos(z)});
}
async function anchorPoint(sk,pt,q) {
  const anchor=await call('sketch','point',{id:sk,pos:[-1000,-1000,0]});
  await call('sketch','constraint',{id:sk,type:'FIXATION',geomIds:[anchor]});
  await dimension(sk,[anchor,pt],'HORIZONTAL_DISTANCE',add(q[0],1000),'position_x');
  await dimension(sk,[anchor,pt],'VERTICAL_DISTANCE',add(q[1],1000),'position_y');
}
async function primitive(n,name) {
  const a=n.args;
  if(n.op==='makeSphere') {
    const cs=await call('part','workCSys',{id:part,name:name+'_datum',offset:(a[1]||[0,0,0]).map(val)});
    return call('part','sphere',{id:part,name,radius:await expression(a[0],'radius'),references:[cs]});
  }
  let h,origin,dir=[0,0,1],taper=0;
  if(n.op==='makeBox') {h=a[2];origin=a[3]||[0,0,0];}
  else if(n.op==='makeCone') {
    h=a[2];origin=a[3]||[0,0,0];dir=a[4]||dir;
    taper=await expression(sym(Math.atan((val(a[0])-val(a[1]))/val(h)),`atan((${ex(a[0])}-${ex(a[1])})/${ex(h)})`),'taper');
  } else {h=a[1];origin=a[2]||[0,0,0];dir=a[3]||dir;}
  const dn=dir.map(val),len=Math.hypot(...dn),unit=dn.map(x=>x/len);
  const axis=unit.findIndex(x=>Math.abs(x)>1-1e-9);
  if(axis<0) {
    // Oblique harness tools: one local profile followed by an explicit orientation.
    const local={...n,args:[...a]};local.args[n.op==='makeCone'?3:2]=[0,0,0];local.args[n.op==='makeCone'?4:3]=[0,0,1];
    let f=await primitive(local,name+'_local');f=await orient(f,dir,name);return translate(f,origin,name);
  }
  const q=axis===2?[origin[0],origin[1]]:axis===1?[origin[0],mul(origin[2],-1)]:[origin[2],mul(origin[1],-1)];
  const plane=await call('part','workPlane',{id:part,name:name+'_plane',type:'PLANE',references:[planes[['Right','Front','Top'][axis]]],offset:await expression(origin[axis],'plane_offset')});
  const sk=await sketch(plane,name+'_profile');let refs;
  if(n.op==='makeBox') {
    refs=await call('sketch','rectangle',{id:sk,startPos:[val(q[0]),val(q[1]),0],endPos:[val(q[0])+val(a[0]),val(q[1])+val(a[1]),0],genFixation:false});
    const pts=await call('sketch','getPoints',{id:refs[0]});
    await anchorPoint(sk,pts.startId,q);
    await dimension(sk,[refs[0]],'OFFSET',a[0],'width');
    await dimension(sk,[refs[1]],'OFFSET',a[1],'depth');
  } else {
    const c=await call('sketch','circle',{id:sk,centerPos:[val(q[0]),val(q[1]),0],radius:val(a[0]),genFixation:false});
    const pts=await call('sketch','getPoints',{id:c});
    await anchorPoint(sk,pts.centerId,q);
    await dimension(sk,[c],'RADIUS',a[0],'radius');refs=[c];
  }
  const result=await call('part','extrusion',{id:part,name,references:refs,limit2:await expression(mul(h,unit[axis]),'height'),taperAngle:taper});
  if(n.op!=='makeBox')circleProfiles.set(result,refs[0]);
  return result;
}
function profileSegments(i) {
  const n=recipe.nodes[i];
  if(n.op==='Face'||n.op==='Wire') return n.children.flatMap(profileSegments);
  if(n.op==='makePolygon') return n.args[0].slice(0,-1).map((p,j)=>({type:'line',p:[p,n.args[0][j+1]]}));
  if(n.op==='LineSegment') return [{type:'line',p:n.args}];
  if(n.op==='Arc') return [{type:'arc',p:n.args}];
  throw new Error('Unknown profile '+n.op);
}
async function profileExtrude(n,name,options={}) {
  const segments=profileSegments(n.children[0]);
  const v=n.args.vector; const d=v.map(val);
  let plane,project,normalIndex;
  if(Math.abs(d[2])>1e-9) {plane=planes.Top;project=p=>[p[0],p[1]];normalIndex=2;}
  else if(Math.abs(d[1])>1e-9) {plane=planes.Front;project=p=>[p[0],mul(p[2],-1)];normalIndex=1;}
  else {plane=planes.Right;project=p=>[p[2],mul(p[1],-1)];normalIndex=0;}
  const sk=await sketch(plane,name+'_profile');
  const anchor=await call('sketch','point',{id:sk,pos:[-1000,-1000,0]});
  await call('sketch','constraint',{id:sk,type:'FIXATION',geomIds:[anchor]});
  const refs=[];
  for(const seg of segments) {
    const p=seg.p.map(project),xyz=q=>[val(q[0]),val(q[1]),0];
    const id=await call('sketch',seg.type==='line'?'line':'arcBy3Points',{
      id:sk,startPos:xyz(p[0]),endPos:xyz(p.at(-1)),...(seg.type==='arc'?{midPos:xyz(p[1])}:{}),
      genFixation:false,genIncidence:false,genTangency:false,genVertAndHoriz:false});
    refs.push(id);
    const pts=await call('sketch','getPoints',{id});
    for(const [pt,q] of [[pts.startId,p[0]],[pts.endId,p.at(-1)]]) {
      await dimension(sk,[anchor,pt],'HORIZONTAL_DISTANCE',add(q[0],1000),'x');
      await dimension(sk,[anchor,pt],'VERTICAL_DISTANCE',add(q[1],1000),'y');
    }
    if(seg.type==='arc') {
      const [A,B,C]=p.map(q=>q.map(val));
      const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
      const cross=Math.abs((B[0]-A[0])*(C[1]-A[1])-(B[1]-A[1])*(C[0]-A[0]));
      await dimension(sk,[id],'RADIUS',dist(A,B)*dist(B,C)*dist(C,A)/(2*cross),'arc_radius');
    }
  }
  let f=await call('part','extrusion',{id:part,name,references:refs,limit2:await expression(options.height??v[normalIndex],'height'),taperAngle:options.taper??0});
  const offset=[0,0,0];offset[normalIndex]=add(segments[0].p[0][normalIndex],options.offset??0);
  const result=await translate(f,offset,name);
  profileData.set(result,{refs,origin:segments[0].p[0][normalIndex]});
  return result;
}
function segDist(p,a,b) {
  const v=b.map((x,i)=>x-a[i]),w=p.map((x,i)=>x-a[i]);
  const t=Math.max(0,Math.min(1,w.reduce((s,x,i)=>s+x*v[i],0)/v.reduce((s,x)=>s+x*x,0)));
  return Math.hypot(...p.map((x,i)=>x-a[i]-t*v[i]));
}
async function build(i) {
  const n=recipe.nodes[i],name=`F${serial++}_${n.op}_${n.source.replace(/[^a-zA-Z0-9]/g,'_')}`;
  featureCount++;
  if(n.op.startsWith('make') && n.op!=='makePolygon')return primitive(n,name);
  if(n.op==='extrude')return profileExtrude(n,name);
  // Planar cavity bevels: exact tapered end extrusions avoid unstable native
  // chamfer BReps where adjacent cavity tools overlap.
  if(n.op==='chamfer' && recipe.nodes[n.children[0]].op==='extrude') {
    const source=recipe.nodes[n.children[0]],d=n.args.distance,h=source.args.vector[2];
    const mid=await profileExtrude(source,name+'_middle',{offset:d,height:sub(h,mul(d,2))});
    const data=dryRun?{refs:[],origin:profileSegments(source.children[0])[0].p[0][2]}:profileData.get(mid);
    const end=async(label,height,offset)=> {
      const f=await call('part','extrusion',{id:part,name:name+label,references:data.refs,limit2:await expression(height,'bevel_height'),taperAngle:Math.PI/4});
      return translate(f,[0,0,add(data.origin,offset)],name+label);
    };
    const bottom=await end('_bottom',mul(d,-1),d);
    const top=await end('_top',d,sub(h,d));
    return call('part','boolean',{id:part,name,target:mid,tools:[bottom,top],type:'UNION'});
  }
  // Rebuild shared subgraphs: ClassCAD boolean features consume their inputs.
  const preserveUnion=i=>{
    const node=recipe.nodes[i];
    if(node.op!=='union'||node.children.length!==2)return false;
    const [a,b]=node.children.map(j=>recipe.nodes[j]);
    return (a.op==='cut'&&b.op==='common'&&b.children[1]===a.children[0]) ||
      (a.op==='common'&&b.op==='common'&&a.children[0]===b.children[0]);
  };
  const flatten=i=>recipe.nodes[i].op==='union' && recipe.nodes[i].children.length!==41 && !preserveUnion(i)?recipe.nodes[i].children.flatMap(flatten):[i];
  // (outer - cavity) union (stock intersect outer) = outer - (cavity - stock).
  // Preserve the bevelled mounting stock without a coincident-envelope intersection.
  if(n.op==='union' && n.children.length===2) {
    const cut=recipe.nodes[n.children[0]],common=recipe.nodes[n.children[1]];
    // (shape intersect first) union (shape intersect second): unite clipping
    // regions first, avoiding a separate non-manifold sliver at the camera seam.
    if(false && cut.op==='common' && common.op==='common' && cut.children[0]===common.children[0]) {
      const target=await build(cut.children[0]);
      const first=await build(cut.children[1]),second=await build(common.children[1]);
      const region=await call('part','boolean',{id:part,name:name+'_clip_regions',target:first,tools:[second],type:'UNION'});
      return call('part','boolean',{id:part,name:name+'_clipped',target,tools:[region],type:'INTERSECTION'});
    }
    if(cut.op==='cut' && common.op==='common' && common.children[1]===cut.children[0]) {
      let target=await build(cut.children[0]);
      for(const [j,cavity] of flatten(cut.children[1]).entries()) {
        let cutter=await build(cavity);
        for(const [k,stock] of flatten(common.children[0]).entries()) {
          const block=await build(stock);
          cutter=await call('part','boolean',{id:part,name:name+'_cavity_'+j+'_stock_'+k,target:cutter,tools:[block],type:'SUBTRACTION'});
        }
        target=await call('part','boolean',{id:part,name:name+'_cavity_'+j,target,tools:[cutter],type:'SUBTRACTION'});
      }
      return target;
    }
  }
  const inputs=n.op==='union'?n.children.flatMap(flatten):n.children;
  // Subtract unioned cutters individually: the same set difference, without
  // forcing the kernel to fuse touching/coplanar cavity tools first.
  if(n.op==='cut' && recipe.nodes[n.children[1]].op==='union') {
    let target=await build(n.children[0]);
    for(const [j,toolNode] of flatten(n.children[1]).entries()) {
      let tool=await build(toolNode);
      target=await call('part','boolean',{id:part,name:name+'_tool_'+j,target,tools:[tool],type:'SUBTRACTION'});
    }
    return target;
  }
  // Repeated knurls are one seed sketch and a native circular pattern.
  if(n.op==='union' && inputs.length===25 && inputs.every(i=>recipe.nodes[i].op==='makeCylinder') && val(recipe.nodes[inputs[0]].args[0])===5) {
    const core=await build(inputs[0]),seed=await build(inputs[1]);
    const axis=await call('part','workAxis',{id:part,name:'Knob_pattern_axis',type:'CURVE',references:[circleProfiles.get(core)]});
    const pattern=await call('part','circularPattern',{id:part,name:'Knob_24_knurls',targets:[seed],references:[axis],count:await expression(24,'knurls'),angle:await expression(2*Math.PI/24,'spacing'),merged:1});
    return call('part','boolean',{id:part,name:'Knob_grip',target:core,tools:[pattern],type:'UNION'});
  }
  if(n.op==='union' && inputs.length===41 && inputs.slice(1).every(i=>recipe.nodes[i].op==='extrude')) {
    const core=await build(inputs[0]),seed=await build(inputs[1]);
    const pattern=await call('part','circularPattern',{id:part,name:'Focus_ring_knurls',targets:[seed],references:[axes.Z],count:'@expr.focus_ridges',angle:await expression(sym(2*Math.PI/recipe.masters.focus_ridges,'2*C:PI/focus_ridges'),'knurl_spacing'),merged:1});
    return call('part','boolean',{id:part,name:'Focus_ring_grip',target:core,tools:[pattern],type:'UNION'});
  }
  const children=[];for(const c of inputs)children.push(await build(c));
  if(['cut','union','common'].includes(n.op))return call('part','boolean',{
    id:part,name,type:{cut:'SUBTRACTION',union:'UNION',common:'INTERSECTION'}[n.op],target:children[0],tools:children.slice(1)});
  if(n.op==='translate')return translate(children[0],n.args.vector,name);
  if(n.op==='rotate') {
    const axis=await call('part','workAxis',{id:part,name:name+'_axis',position:n.args.point.map(val),direction:n.args.axis.map(val)});
    return call('part','rotation',{id:part,name,targets:children,references:[axis],angle:await expression(mul(n.args.angle,Math.PI/180),'angle')});
  }
  if(n.op==='chamfer') {
    if(dryRun){await expression(n.args.distance,'chamfer');return fakeId++;}
    console.log('Selecting chamfer edges '+name);
    let graphic=await api.graphic({recalc:false});
    if(!graphic)graphic=await api.graphic({recalc:false});
    if(!graphic)throw new Error(name+' returned no edge graphics');
    const tree=await api.tree();
    const edges=graphic.containers.filter(c=>c.type===1 && tree[c.owner]?.parent===children[0] && tree[c.owner]?.members?.consumed?.value===0).flatMap(c=>c.edges||[]);const ids=new Set();
    for(const p of n.args.probes) {
      let best=null,md=Infinity;
      for(const e of edges) for(let j=0;j<e.points.length-3;j+=3) {
        const distance=segDist(p,e.points.slice(j,j+3),e.points.slice(j+3,j+6));
        if(distance<md){md=distance;best=e.id;}
      }
      if(md>0.08)throw new Error(name+' missing edge at '+p+' nearest '+md);
      ids.add(best);
    }
    return call('part','chamfer',{id:part,name,references:[...ids],distance1:await expression(n.args.distance,'chamfer')});
  }
  throw new Error('Unimplemented '+n.op);
}
if(!dryRun)console.log('Constructing '+partName);
const finalFeature=await build(recipe.parts[partName].root);
if(dryRun)return expressionPlan;
console.log('Built '+partName+' feature '+finalFeature);
await api.v1.common.setAppearance({target:finalFeature,color:recipe.parts[partName].color.map(v=>255*v)});
console.log('Measuring '+partName);
const mass=await api.v1.assembly.calculateMassProperties({id:part});
console.log('Saving '+partName);
const saved=await api.v1.common.save({file:outputPath,format:'OFB'});
if(saved.result?.success!==1)throw new Error('Native save failed '+JSON.stringify(saved));
return {partName,part,finalFeature,sketchCount,featureCount,mass,expectedVolume:recipe.parts[partName].volume};
