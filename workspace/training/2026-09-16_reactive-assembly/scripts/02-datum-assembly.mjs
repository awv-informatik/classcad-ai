import {setup,mass,attempt} from './_setup.mjs';
export default async function(api,{filewrite,snapshot}){
 const s=await setup(api);const slider=(await api.v1.assembly.getSlider({id:s.root,name:'ButtonTravel'})).result.id;await snapshot('rest',{view:'iso'});
 filewrite(await attempt(()=>api.v1.assembly.updateSlider({id:slider,xOffset:'@expr.shoulder_height'})),'offset-expression');
 filewrite(await attempt(()=>api.v1.assembly.updateSlider({id:slider,zOffsetLimits:{min:2,max:1}})),'inverted-limits');
 await api.v1.assembly.updateSlider({id:slider,zOffsetLimits:{min:-1,max:0}});
 await api.v1.assembly.startMovingUnderConstraints({id:s.root,instanceIds:[s.ids[0]],pivotInfo:[0,0,0],mucType:'TRANSLATION_1D'});
 await api.v1.assembly.moveUnderConstraints({id:s.root,offset:[0,0,-10]});
 await api.v1.assembly.finishMovingUnderConstraints({id:s.root});
 filewrite({a:await mass(api,s.ids[0]),b:await mass(api,s.ids[1]),shell:await mass(api,s.si),switch:await mass(api,s.swi)},'clamped-masses');
 filewrite(await api.v1.assembly.getSlider({id:s.root,name:'ButtonTravel'}),'slider');
 await snapshot('pressed',{view:'iso'});
}
