import sys,json
from pathlib import Path
sys.path.insert(0,'/Applications/FreeCAD.app/Contents/Resources/lib')
import FreeCAD
import Part
folder=Path(__file__).resolve().parent.parent
reference=Part.Shape();reference.read(str(folder/'files/reference-after_second.brep'))
results={}
for name in ['01-reproduce-01-baseline-result','02-uninstrumented-02-uninstrumented-result']:
 shape=Part.Shape();shape.read(str(folder/'files'/(name+'.stp')))
 missing=reference.cut(shape).Volume;extra=shape.cut(reference).Volume
 results[name]=dict(valid=shape.isValid(),solids=len(shape.Solids),volume=shape.Volume,referenceVolume=reference.Volume,missing=missing,extra=extra,symmetricDifference=missing+extra)
(folder/'files/export-comparison.json').write_text(json.dumps(results,indent=2))
print(json.dumps(results))
