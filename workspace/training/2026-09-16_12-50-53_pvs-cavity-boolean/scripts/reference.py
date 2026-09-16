"""Translate the Python construction operations to a symbolic feature recipe.

FreeCAD evaluates the source only to select topology and cross-check the recipe;
no BRep, STEP, mesh or imported geometry enters the ClassCAD construction.
"""
import ast
import inspect
import json
import math
import sys
import types
from pathlib import Path
sys.path.insert(0, '/Applications/FreeCAD.app/Contents/Resources/lib')
import FreeCAD as FC
import Part as OCC
HERE = Path(__file__).resolve().parent
SRC = Path('/Users/dev/dev/eibenstock/sources/projects/pvs_monocular/cad_housing/sources')
sys.path.insert(0, str(SRC))
from housing_parameters import parameters as original_parameters

class Scalar(float):
    def __new__(cls, value, expression):
        o = super().__new__(cls,value); o.expression=expression; return o
    def __index__(self): return int(self)
    def __add__(self,b): return calc(self,b,'+',lambda a,b:a+b)
    def __radd__(self,b): return calc(b,self,'+',lambda a,b:a+b)
    def __sub__(self,b): return calc(self,b,'-',lambda a,b:a-b)
    def __rsub__(self,b): return calc(b,self,'-',lambda a,b:a-b)
    def __mul__(self,b): return calc(self,b,'*',lambda a,b:a*b)
    def __rmul__(self,b): return calc(b,self,'*',lambda a,b:a*b)
    def __truediv__(self,b): return calc(self,b,'/',lambda a,b:a/b)
    def __rtruediv__(self,b): return calc(b,self,'/',lambda a,b:a/b)
    def __neg__(self): return Scalar(-float(self),f'(-{expr(self)})')
    def __pow__(self,b): return calc(self,b,'^',lambda a,b:a**b)
    def __abs__(self): return Scalar(abs(float(self)),f'abs({expr(self)})')
def expr(v): return v.expression if isinstance(v,Scalar) else repr(float(v))
def calc(a,b,op,fn): return Scalar(fn(float(a),float(b)),f'({expr(a)}{op}{expr(b)})')
def pack(x):
    if isinstance(x,Shape): return {'ref':x.ident}
    if isinstance(x,Scalar): return {'v':float(x),'e':x.expression}
    if isinstance(x,Vec): return [pack(v) for v in x.xyz]
    if isinstance(x,(list,tuple)): return [pack(v) for v in x]
    if isinstance(x,dict): return {k:pack(v) for k,v in x.items()}
    return x
masters={}
def symbolize(v,name):
    if isinstance(v,(int,float)) and not isinstance(v,bool):
        masters[name]=v
        return Scalar(v,name)
    if isinstance(v,(list,tuple)): return [symbolize(a,f'{name}_{i}') for i,a in enumerate(v)]
    return v

def params(overrides=None): return {k:symbolize(v,k) for k,v in original_parameters(overrides).items()}
import housing_parameters
housing_parameters.parameters=params

class Vec:
    def __init__(self,*args):
        if len(args)==1: args=args[0].xyz if isinstance(args[0],Vec) else tuple(args[0])
        self.xyz=list(args or (0,0,0)); self.real=FC.Vector(*[float(v) for v in self.xyz])
    def __sub__(self,b): return Vec(*[a-b for a,b in zip(self.xyz,b.xyz)])
    def __add__(self,b): return Vec(*[a+b for a,b in zip(self.xyz,b.xyz)])
    @property
    def Length(self): return self.real.Length
    def __getattr__(self,n): return getattr(self.real,n)

def real(x):
    if isinstance(x,(Shape,Vec)): return x.real
    if isinstance(x,Scalar): return float(x)
    if isinstance(x,(list,tuple)): return [real(v) for v in x]
    return x
nodes=[]
def node(op,args,children=()):
    frames=inspect.stack(context=0)
    frame=next((f for f in frames if str(SRC) in f.filename),None)
    def refs(a):
        if isinstance(a,Shape): return [a.ident]
        if isinstance(a,(list,tuple)): return [i for v in a for i in refs(v)]
        return []
    children=list(children)+refs(args)
    ident=len(nodes)
    nodes.append(dict(id=ident,op=op,args=pack(args),children=list(children),source=f'{Path(frame.filename).name}:{frame.lineno}' if frame else 'trace'))
    return ident
_shapes={}
class Shape:
    def __init__(self,shape,ident): self.real=shape;self.ident=ident;_shapes[ident]=shape.copy()
    def __getattr__(self,n): return getattr(self.real,n)
    def cut(self,b): return Shape(self.real.cut(b.real),node('cut',{},[self.ident,b.ident]))
    def common(self,b): return Shape(self.real.common(b.real),node('common',{},[self.ident,b.ident]))
    def fuse(self,b): return self.multiFuse([b])
    def multiFuse(self,bs): return Shape(self.real.multiFuse([b.real for b in bs]),node('union',{},[self.ident]+[b.ident for b in bs]))
    def removeSplitter(self): return Shape(self.real.removeSplitter(),self.ident)
    def copy(self): return Shape(self.real.copy(),self.ident)
    def translate(self,v):
        self.real.translate(real(v));self.ident=node('translate',{'vector':v},[self.ident])
    def rotate(self,p,d,a):
        self.real.rotate(real(p),real(d),float(a));self.ident=node('rotate',{'point':p,'axis':d,'angle':a},[self.ident])
    def extrude(self,v): return Shape(self.real.extrude(real(v)),node('extrude',{'vector':v},[self.ident]))
    def makeChamfer(self,d,edges):
        probes=[]
        for edge in edges:
            for fraction in (.1,.25,.5,.75,.9):
                p=edge.valueAt(edge.FirstParameter+(edge.LastParameter-edge.FirstParameter)*fraction)
                probes.append([p.x,p.y,p.z])
        # Owner-authorized local reduction for the ClassCAD kernel.
        # The other outer rims retain outer_chamfer = 1.67 mm.
        if len(edges)==3 and all(abs(e.BoundBox.ZMin-27.9)<1e-6 for e in edges):
            masters['camera_roof_chamfer']=0.0
            return self.copy()  # Local rim left square: native kernel rejects even 0.5 mm.
        finished=self.real.makeChamfer(float(d),edges)
        return Shape(finished,node('chamfer',{'distance':d,'probes':probes},[self.ident]))

    def isInside(self,p,*args): return self.real.isInside(real(p),*args)

def primitive(name,args,kw):
    shape=getattr(OCC,name)(*[real(a) for a in args],**{k:real(v) for k,v in kw.items()})
    return Shape(shape,node(name,list(args)))
part=types.ModuleType('Part')
for method in ['makeBox','makeCylinder','makeCone','makeSphere','makePolygon','Face','Wire']:
    setattr(part,method,lambda *a,_m=method,**kw:primitive(_m,a,kw))
class Curve:
    def __init__(self,kind,*args): self.kind=kind;self.args=args;self.real=getattr(OCC,kind)(*[real(a) for a in args])
    def toShape(self): return Shape(self.real.toShape(),node(self.kind,self.args))
part.Arc=lambda *a:Curve('Arc',*a)
part.LineSegment=lambda *a:Curve('LineSegment',*a)
app=types.ModuleType('FreeCAD')
app.__dict__.update(FC.__dict__)
app.Vector=Vec
sys.modules['FreeCAD']=app
sys.modules['Part']=part

source=ast.parse((SRC/'housing.py').read_text())
build=next(n for n in source.body if isinstance(n,ast.FunctionDef) and n.name=='build')
new=[]
for n in build.body:
    if isinstance(n,ast.FunctionDef) and n.name=='record':
        n=ast.parse('''def record(name, shape, category, color):
    {'Print':printed,'Component':components,'Reserve':reserves}[category][name]=shape
    colors[name]=color
    return shape
''').body[0]
    if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='doc' for t in n.targets): continue
    if isinstance(n,ast.Expr) and isinstance(n.value,ast.Call) and isinstance(n.value.func,ast.Name) and n.value.func.id=='ensure_output_dirs': continue
    if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=='envelope_obj' for t in n.targets): break
    new.append(n)
new.extend(ast.parse('return printed, colors').body)
build.body=new
source.body=[n for n in source.body if not isinstance(n,ast.If)]
namespace={'__name__':'translated_housing'}
exec(compile(ast.fix_missing_locations(source),str(SRC/'housing.py'),'exec'),namespace)
printed,colors=namespace['build']()
roots={name:s.ident for name,s in printed.items()}
needed=set()
def visit(i):
    if i in needed:return
    needed.add(i)
    for j in nodes[i]['children']:visit(j)
for i in roots.values():visit(i)
instances={}
first=next(n for n in roots if n.startswith('Plunger_'))
first_center=printed[first].BoundBox.Center
for name in roots:
    if name.startswith('Plunger_'):
        c=printed[name].BoundBox.Center
        instances[name]=dict(product='Plunger',offset=[c.x-first_center.x,c.y-first_center.y,0],color=colors[name])
    else: instances[name]=dict(product=name,offset=[0,0,0],color=colors[name])
parts={n:dict(root=i,color=colors[n],volume=printed[n].Volume) for n,i in roots.items() if not n.startswith('Plunger_')}
parts['Plunger']=dict(root=roots[first],color=colors[first],volume=printed[first].Volume)
recipe=dict(instances=instances,masters=masters,nodes={str(i):nodes[i] for i in sorted(needed)},parts=parts)
(HERE/'../files/reference-recipe.json').write_text(json.dumps(recipe,indent=2)+'\n')
print(f'{len(roots)} printed parts, {len(needed)} construction operations, {len(masters)} master parameters')

raw=nodes[598]['children']
A=_shapes[585]
B=_shapes[raw[0]]
C=_shapes[raw[1]]
def measure(s):
 b=s.BoundBox;c=sum((v.CenterOfMass*v.Volume for v in s.Solids),FC.Vector())/s.Volume
 return dict(volume=s.Volume,valid=s.isValid(),solids=len(s.Solids),faces=len(s.Faces),bounds=[[b.XMin,b.YMin,b.ZMin],[b.XMax,b.YMax,b.ZMax]],cog=[c.x,c.y,c.z])
items={'outer':A,'camera_cavity':B,'electronics_cavity':C,'after_first':A.cut(B),'after_second':A.cut(B).cut(C),'cavity_union':B.fuse(C)}
(HERE/'../files/occ-reference.json').write_text(json.dumps({k:measure(s) for k,s in items.items()},indent=2))
for k,s in items.items():s.exportBrep(str(HERE/'../files'/('reference-'+k+'.brep')))
print('Reference volumes', {k:round(s.Volume,5) for k,s in items.items()})
