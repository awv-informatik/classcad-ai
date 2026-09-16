import sys,json
from pathlib import Path
sys.path.insert(0,'/Applications/FreeCAD.app/Contents/Resources/lib')
import FreeCAD as FC
import Part as OCC
folder=Path('/Users/dev/dev/eibenstock/sources/projects/pvs_monocular/cad_housing/classcad')
trial=Path('/Users/dev/dev/awv/classcad-ai/workspace/training/2026-09-16_12-50-53_pvs-cavity-boolean/files')
native={}
for name in ['Base','Upper_shell']:
 shape=OCC.Shape();shape.read(str(trial/('26-current9-'+name+'-result.step')));native[name]=shape
source=(folder/'trace_design.py').read_text();source=source.replace("(HERE/'design-recipe.json').write_text(json.dumps(recipe,indent=2)+'\\n')",'pass')
ns={'__file__':str(folder/'trace_design.py'),'__name__':'validation_trace'}
exec(compile(source,str(folder/'trace_design.py'),'exec'),ns)
def bounds(s):
 ps,_=s.tessellate(.05);return [min(p[i] for p in ps) for i in range(3)]+[max(p[i] for p in ps) for i in range(3)]
results={}
for name,s in native.items():
 ref=ns['printed'][name].real
 exported=s
 assert len(s.Solids)==1, (name,len(s.Solids))
 s=s.Solids[0]
 results[name]={'valid':s.isValid(),'solids':len(s.Solids),'volume':s.Volume,'referenceVolume':ref.Volume,'relativeVolumeError':(s.Volume-ref.Volume)/ref.Volume,'bounds':bounds(s),'referenceBounds':bounds(ref),'boundsMethod':'trimmed tessellation, 0.05 mm deflection (conservative spline BoundBox is unsuitable)', 'maxBoundsError':max(abs(a-b) for a,b in zip(bounds(s),bounds(ref)))}
(trial/'smlib9-geometry-check.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results,indent=2))
