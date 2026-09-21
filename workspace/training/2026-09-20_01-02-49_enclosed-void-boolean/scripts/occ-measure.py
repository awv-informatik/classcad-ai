"""Independent OCC measurement of the exported states (run with FreeCAD's Python)."""
import sys
sys.path.insert(0,'/Applications/FreeCAD.app/Contents/Resources/lib')
import FreeCAD,Part
for f in sys.argv[1:]:
    s=Part.Shape();s.read(f)
    print(f.split('/')[-1],'valid',s.isValid(),'solids',len(s.Solids),'shells',[len(x.Shells) for x in s.Solids],'volume',round(s.Volume,3),
          'shell volumes',[round(Part.Solid(sh).Volume,1) for x in s.Solids for sh in x.Shells],'shell orientation',[sh.Orientation for x in s.Solids for sh in x.Shells])
