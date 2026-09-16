export async function setup(api,{registry=false}={}){
 const root=(await api.v1.assembly.create({name:'ButtonAssembly'})).result;
 const master=registry?(await api.v1.assembly.partTemplate({name:'Params'})).result:null;
 if(registry)await api.v1.part.expression({id:master,toCreate:[{name:'shoulder_height',value:2},{name:'seat_height',value:'10 + shoulder_height'}]});
 const shell=(await api.v1.assembly.partTemplate({name:'Shell'})).result;
 await api.v1.part.expression({id:shell,toCreate:[{name:'seat_height',value:registry?'Params.ExpressionSet.seat_height':12}]});
 const shellOrigin=(await api.v1.part.workCSys({id:shell,name:'MountingDatum'})).result;
 const shellDatum=(await api.v1.part.workCSys({id:shell,name:'ButtonSeat',offset:'[0,0,@expr.seat_height]'})).result;
 await api.v1.part.box({id:shell,name:'Roof',references:[shellDatum],length:20,width:10,height:2});
 const plunger=(await api.v1.assembly.partTemplate({name:'Plunger'})).result;
 await api.v1.part.expression({id:plunger,toCreate:[{name:'shoulder_height',value:registry?'Params.ExpressionSet.shoulder_height':2}]});
 await api.v1.part.box({id:plunger,name:'ShoulderProbe',length:3,width:3,height:'@expr.shoulder_height'});
 const pd=(await api.v1.part.workCSys({id:plunger,name:'ShoulderDatum'})).result;
 const sw=(await api.v1.assembly.partTemplate({name:'SwitchReference'})).result;
 await api.v1.part.box({id:sw,length:20,width:10,height:10});
 const sd=(await api.v1.part.workCSys({id:sw,name:'HubDatum'})).result;
 const si=(await api.v1.assembly.instance({ownerId:root,productId:shell,name:'Shell'})).result;
 const swi=(await api.v1.assembly.instance({ownerId:root,productId:sw,name:'SwitchReference'})).result;
 await api.v1.assembly.fastenedOrigin({id:root,mate1:{path:[swi],csys:sd}});
 await api.v1.assembly.fastened({id:root,name:'ShellSeatHeight',mate1:{path:[swi],csys:sd},mate2:{path:[si],csys:shellOrigin},zOffset:0});
 const ids=[];
 for(const [name,x] of [['ButtonA',3],['ButtonB',13]]){
  ids.push((await api.v1.assembly.instance({ownerId:root,productId:plunger,name,transformation:[[x,3,12],[1,0,0],[0,1,0]]})).result);
 }
 await api.v1.assembly.slider({id:root,name:'ButtonTravel',mate1:{path:[si],csys:shellDatum},mate2:{path:[ids[0]],csys:pd},xOffset:3,yOffset:3,zOffsetLimits:{min:-1,max:0}});
 await api.v1.assembly.fastened({id:root,name:'ButtonRest',mate1:{path:[si],csys:shellDatum},mate2:{path:[ids[1]],csys:pd},xOffset:13,yOffset:3});
 return {master,root,shell,plunger,sw,si,swi,ids,pd,shellDatum};
}
export async function mass(api,id){return (await api.v1.part.calculateMassProperties({id})).result;}
export async function attempt(fn){try{return await fn();}catch(e){return {error:e.message};}}
