import {mass} from './_setup.mjs';
export default async function(api,{filewrite,snapshot}){
 const root=(await api.v1.assembly.create({name:'SketchSharedMaster'})).result;
 const master=(await api.v1.assembly.partTemplate({name:'Dimensions'})).result;
 await api.v1.part.expression({id:master,toCreate:[{name:'shoulder_height',value:2},{name:'shoulder_radius',value:2}]});
 const part=(await api.v1.assembly.partTemplate({name:'Plunger'})).result;
 await api.v1.part.expression({id:part,toCreate:[{name:'height',value:'Dimensions.ExpressionSet.shoulder_height'},{name:'radius',value:'Dimensions.ExpressionSet.shoulder_radius'}]});
 const plane=(await api.v1.part.getWorkGeometry({id:part,name:'Top'})).result;
 const sk=(await api.v1.sketch.create({id:part,planeId:plane})).result;
 const circle=(await api.v1.sketch.circle({id:sk,centerPos:[0,0,0],radius:2,genFixation:false,genIncidence:false,genTangency:false})).result;
 const center=(await api.v1.sketch.getPoints({id:circle})).result.centerId;
 await api.v1.sketch.constraint({id:sk,type:'FIXATION',geomIds:[center]});
 await api.v1.sketch.dimension({id:sk,type:'RADIUS',geomIds:[circle],value:'@expr.radius'});
 await api.v1.part.extrusion({id:part,name:'Shoulder',references:[circle],limit2:'@expr.height'});
 for(let x of [0,10])await api.v1.assembly.instance({ownerId:root,productId:part,transformation:[[x,0,0],[1,0,0],[0,1,0]]});
 const stages=[];async function record(label){stages.push({label,state:(await api.v1.sketch.getGlobalState({id:sk})).result,part:await mass(api,part),assembly:await mass(api,root)});}
 await record('before');await snapshot('before',{view:'iso'});
 await api.v1.part.updateExpression({id:master,toUpdate:[{name:'shoulder_height',value:3},{name:'shoulder_radius',value:2.5}]});await record('update');
 await api.v1.common.recalc({});await record('one-recalc');await api.v1.common.recalc({});await record('two-recalcs');
 filewrite(stages,'stages');await snapshot('after',{view:'iso'});console.log(JSON.stringify(stages));
}
