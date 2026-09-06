"""Blender MCP authoring pass. Run functions in small batches; no rendering required."""
import bpy, math, random, hashlib
from mathutils import Vector

OFFSETS={'crate':(0,120,0),'sandbag':(100,120,0),'rubble':(200,120,0),'wall':(300,120,0)}
COLORS={'wood':'#806044','webbing':'#9a8969','sand':'#ac9874','brick':'#96684d','stone':'#85867a','metal':'#464841'}

def seed(text):return int(hashlib.sha256(text.encode()).hexdigest()[:8],16)
def linear(x):return x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4
def color(hex):return tuple(linear(int(hex[i:i+2],16)/255) for i in (1,3,5))
def ref_mat(key):
 m=bpy.data.materials.get('TB_refined_'+key) or bpy.data.materials.new('TB_refined_'+key)
 rgb=color(COLORS[key]);m.diffuse_color=(*rgb,1);m['tb_srgb']=COLORS[key];m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*rgb,1);bs.inputs['Roughness'].default_value=.95
 return m

def ref_tag(o,asset,name,key,offset=None):
 o.name=asset+'_'+name;o['tb_asset']=asset;o['tb_mat']=key;o['tb_joint']='body';o['tb_pivot']=(0,0,0);o['tb_display_offset']=offset or OFFSETS[asset]
 o.data.materials.append(ref_mat(key));off=Vector(o['tb_display_offset']);o.location+=off
 return o

def ref_block(asset,name,p,size,key,rng,chipped=.6):
 # Chamfered corners with uneven cut faces, avoiding pill-shaped masonry.
 bpy.ops.mesh.primitive_cube_add(size=1,location=(p[0],-p[2],p[1]));o=bpy.context.object;o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if chipped:
  b=o.modifiers.new('Fractured edges','BEVEL');b.width=min(chipped,min(size)*.18);b.segments=1;bpy.ops.object.modifier_apply(modifier=b.name)
  for v in o.data.vertices:v.co+=Vector((rng.uniform(-.35,.35),rng.uniform(-.25,.25),rng.uniform(-.3,.3)))
 for f in o.data.polygons:f.use_smooth=False
 return ref_tag(o,asset,name,key)

def ref_chip(asset,name,p,size,key,rng):
 bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2 if name=='Ragged_canopy' else 1,radius=1,location=(p[0],-p[2],p[1]));o=bpy.context.object
 for v in o.data.vertices:v.co*=rng.uniform(.65,1.15)
 o.scale=(size[0],size[2],size[1]);o.rotation_euler=(rng.uniform(-.4,.4),rng.uniform(-.4,.4),rng.uniform(0,math.tau))
 return ref_tag(o,asset,name,key)

def ref_sack(asset,p,size,rng,index):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=10,ring_count=6,radius=1,location=(p[0],-p[2],p[1]));o=bpy.context.object
 # Flatten the packed surfaces, pinch the tied ends, and wrinkle the cloth.
 for v in o.data.vertices:
  x,y,z=v.co;v.co.x=x*(1-.07*abs(z));v.co.y=y*(1-.12*abs(x));v.co.z=z*(.86+.07*math.sin(x*8+y*4))
 o.scale=(size[0],size[2],size[1]);o.rotation_euler.z=rng.uniform(-.08,.08)
 for f in o.data.polygons:f.use_smooth=True
 ref_tag(o,asset,'Compressed_sack_'+str(index),'sand')
 # A stitched side seam and small folded/tied ends, inside the original footprint.
 ref_block(asset,'Sack_fold_'+str(index),(p[0],p[1],p[2]+size[2]*.82),(size[0]*1.45,.55,.55),'webbing',rng,.1)
 for side in [-1,1]:ref_chip(asset,'Tied_end_'+str(index),(p[0]+side*size[0]*.85,p[1],p[2]),(1.3,1.2,2),'sand',rng)

def refine_scenery(assets):
 for asset in assets:
  for o in list(bpy.context.scene.objects):
   if o.get('tb_asset')==asset:bpy.data.objects.remove(o,do_unlink=True)
  r=random.Random(seed(asset))
  if asset=='wall':
   ref_block(asset,'Exposed_mortar',(0,10,0),(95,19,12),'stone',r,1)
   for row in range(3):
    lengths=[19,24,17,21,17] if row%2==0 else [12,22,25,18,21]
    x=-49
    for i,w in enumerate(lengths):
     h=(8.5 if row<2 else [9,6,4,8,10][i]);o=ref_block(asset,'Fractured_course_'+str(row)+'_'+str(i),(x+w/2,row*9+h/2+.8,0),(w-.8,h,15.4),'brick',r,1.1);o.rotation_euler.y=r.uniform(-.025,.025);x+=w
   for x,h in [(-40,33),(-19,30),(31,34),(43,33)]:ref_chip(asset,'Jagged_crown',(x,h,0),(6,r.uniform(3,6),6),'brick',r)
   for i in range(6):ref_chip(asset,'Chipped_face',(-43+i*16,2.2,r.uniform(-5,5)),(r.uniform(2,5),2,2),'stone' if i%3==0 else 'brick',r)
  elif asset=='crate':
   # Individual side boards, inset lid and a real gap in one broken board.
   for side in [-1,1]:
    for j in range(4):
     y=4+j*7.2
     if side==1 and j==3:
      ref_block(asset,'Broken_board_left',(-10,y,side*16),(12,6.7,2.2),'wood',r,.45);ref_block(asset,'Broken_board_right',(10,y,side*16),(11,6.7,2.2),'wood',r,.7)
     else:ref_block(asset,'Side_board',(0,y,side*16),(33,6.7,2.2),'wood',r,.4)
     ref_block(asset,'End_board',(side*16,y,0),(2.2,6.7,30),'wood',r,.4)
    for x in [-12,12]:ref_block(asset,'Corner_batten',(x,15.5,side*17),(3,30,2),'webbing',r,.35)
   for j in range(4):ref_block(asset,'Inset_lid',(-12+j*8,30,0),(7.3,2,30),'wood',r,.45)
   brace=ref_block(asset,'Diagonal_brace',(0,16,17.6),(2.5,31,1.2),'webbing',r,.2);brace.rotation_euler.y=-.7
   for x in [-12,12]:
    for z in [-17.9,17.9]:
     for y in [4,27]:ref_block(asset,'Recessed_nail',(x,y,z),(1.2,1.2,.3),'metal',r,0)
  elif asset=='sandbag':
   for row in range(3):
    for j in range(3 if row==1 else 4):ref_sack(asset,((-20 if row==1 else -30)+j*20,4.2+row*7+r.uniform(-.4,.4),r.uniform(-.8,.8)),(r.uniform(9.1,10.2),r.uniform(4.6,5.2),r.uniform(7.6,8.8)),r,row*4+j)
  elif asset=='rubble':
   for i in range(16):
    x,z=r.uniform(-12,12),r.uniform(-12,12);h=r.uniform(6,14)
    o=ref_block(asset,'Broken_brick',(x,h*.55+max(0,1-math.hypot(x,z)/20)*6,z),(r.uniform(5,12),h,r.uniform(4,8)),'brick' if i%3 else 'stone',r,.8);o.rotation_euler=(r.uniform(-.5,.5),r.uniform(-.5,.5),r.uniform(0,math.tau))
   for i in range(4):ref_chip(asset,'Mortar_fragment',(r.uniform(-12,12),4,r.uniform(-12,12)),(5,3,5),'stone',r)
   for i in range(2):
    o=ref_block(asset,'Splintered_timber',(r.uniform(-7,7),9,r.uniform(-7,7)),(3,2,23),'wood',r,.35);o.rotation_euler.z=r.uniform(-1,1)
  bpy.context.view_layer.update()
 print('Refined scenery:',assets)

def refine_soldiers():
 for o in list(bpy.context.scene.objects):
  role=o.get('tb_asset');name=o.name.lower()
  if role not in ['player','rifleman','officer','sniper','nest'] or o.type!='MESH' or o.get('tb_shape_refined'):continue
  r=random.Random(seed(o.name));cloth=any(k in name for k in ['jacket','coat','cape','thigh','shin','sleeve','forearm','pack','pouch','blanket','sandbag'])
  if cloth:
   for v in o.data.vertices:
    x,y,z=v.co;strength=.22 if 'sandbag' not in name else .42
    f=1+strength*.1*math.sin(z*1.6+x*.7);v.co.x*=f;v.co.y*=1+strength*.13*math.cos(z*1.4+y*.6)
    if 'cape' in name or 'coat' in name:v.co.z+=.35*math.sin(x*1.8+y)
  if 'helmet' in name or 'brim' in name:
   for v in o.data.vertices:
    v.co.z+=.16*math.sin(v.co.x*1.3+v.co.y*.7);v.co.x*=.98
  if any(k in name for k in ['head','ear','nose']):
   for v in o.data.vertices:v.co*=.94
  o.data.update();o['tb_shape_refined']=True
 # Thin slings follow the existing rifles and remain on their weapon joint.
 for role in ['player','rifleman','sniper']:
  name=role+'_Worn_rifle_sling'
  if bpy.data.objects.get(name):continue
  ref=next(o for o in bpy.context.scene.objects if o.get('tb_asset')==role and 'stock' in o.name.lower())
  ref.data.update();bpy.context.view_layer.update();corners=[ref.matrix_world@Vector(v) for v in ref.bound_box];x=sum(v.x for v in corners)/8;z=min(v.z for v in corners)-1
  lo=min(v.y for v in corners);hi=max(v.y for v in corners)
  verts=[(x-.5,lo,z),(x+.5,lo,z),(x+.5,(lo+hi)/2,z-3),(x-.5,(lo+hi)/2,z-3),(x-.5,hi,z),(x+.5,hi,z)]
  mesh=bpy.data.meshes.new(name);mesh.from_pydata(verts,[],[(0,1,2,3),(3,2,5,4)]);mesh.update();obj=bpy.data.objects.new(name,mesh);bpy.context.scene.collection.objects.link(obj)
  for key in ['tb_asset','tb_joint','tb_pivot','tb_display_offset']:obj[key]=ref[key]
  obj['tb_mat']=ref['tb_mat'];obj.data.materials.append(ref.data.materials[0]);obj['tb_shape_refined']=True
 print('Refined soldier fabric, helmets, proportions, and rifle slings')

def apply_wear():
 for o in bpy.context.scene.objects:
  if o.type!='MESH' or not o.get('tb_asset'):continue
  mesh=o.data;r=random.Random(seed(o.name+':wear'));attr=mesh.color_attributes.get('tb_wear') or mesh.color_attributes.new(name='tb_wear',type='FLOAT_COLOR',domain='CORNER')
  offset=o.get('tb_display_offset',(0,0,0));name=o.name.lower();key=o['tb_mat'];base=r.uniform(.8,1.08)
  for face in mesh.polygons:
   factor=base*r.uniform(.88,1.08)
   for li in face.loop_indices:
    v=mesh.vertices[mesh.loops[li].vertex_index];world=o.matrix_world@v.co;height=world.z-offset[2]
    shade=factor*(.66 if height<7 else .82 if height<12 else 1)
    if any(w in name for w in ['stock','plank','board','timber','batten']):shade*=.84+.16*math.sin(v.co.x*2+v.co.z*3)
    if 'metal' in key or 'helmet' in key:shade*=.9 if r.random()<.1 else 1
    if o.get('tb_soot'):shade*=.2
    attr.data[li].color=(shade,shade*.99,shade*.95,1)
  if o.data.materials:
   m=o.data.materials[0];m.use_nodes=True;nodes=m.node_tree.nodes;links=m.node_tree.links;bs=nodes.get('Principled BSDF')
   if not nodes.get('TB_Wear'):
    a=nodes.new('ShaderNodeVertexColor');a.name='TB_Wear';a.layer_name='tb_wear';mix=nodes.new('ShaderNodeMixRGB');mix.blend_type='MULTIPLY';mix.inputs[0].default_value=1;mix.inputs[1].default_value=m.diffuse_color;links.new(a.outputs['Color'],mix.inputs[2]);links.new(mix.outputs[0],bs.inputs['Base Color'])
   bs.inputs['Roughness'].default_value=.9
 print('Baked corner wear for export')


def fracture_details():
 for o in bpy.context.scene.objects:
  if o.type!='MESH' or o.get('tb_fractured'):continue
  r=random.Random(seed(o.name+':fracture'))
  if o.get('tb_asset')=='wall' and 'Fractured_course_2' in o.name:
   for v in o.data.vertices:
    if v.co.z>0:v.co.z=max(-.3,v.co.z-r.uniform(.4,2.5)-max(0,v.co.x)*.22)
   o.rotation_euler.y+=r.uniform(-.055,.055);o.data.update()
  if o.get('tb_asset')=='crate' and ('board' in o.name or 'lid' in o.name):
   for v in o.data.vertices:
    v.co.z+=math.sin(v.co.x*.8+v.co.y*.3)*.25
   o.data.update()
  o['tb_fractured']=True
 r=random.Random(733)
 for i in range(7):
  name='wall_Impact_scar_'+str(i)
  if bpy.data.objects.get(name):continue
  x,y=r.uniform(-42,42),r.uniform(7,24);radius=r.uniform(.6,1.4)
  verts=[(x,-8.03,y)]+[(x+math.cos(j/7*math.tau)*radius*r.uniform(.8,1.2),-8.03,y+math.sin(j/7*math.tau)*radius) for j in range(7)]
  me=bpy.data.meshes.new(name);me.from_pydata(verts,[],[(0,j+1,(j+1)%7+1) for j in range(7)]);me.update();o=bpy.data.objects.new(name,me);bpy.context.scene.collection.objects.link(o);ref_tag(o,'wall','Impact_scar_'+str(i),'brick');o['tb_soot']=True
 for i in range(3):
  name='wall_Split_face_'+str(i)
  if bpy.data.objects.get(name):continue
  x=-32+i*29;verts=[]
  for j in range(5):
   xx=x+(j%2)*1.8;z=8+j*3.4;verts.extend([(xx-.28,-8.02,z),(xx+.28,-8.02,z)])
  me=bpy.data.meshes.new(name);me.from_pydata(verts,[],[(j*2,j*2+1,j*2+3,j*2+2) for j in range(4)]);me.update();o=bpy.data.objects.new(name,me);bpy.context.scene.collection.objects.link(o);ref_tag(o,'wall','Split_face_'+str(i),'brick');o['tb_soot']=True
 print('Added broken crowns, split faces, impact scars and warped boards')


# Modular architecture and landscape additions share the existing export contract.
COLORS.update(plaster='#c0b297',charred='#38372f',rust='#815841',slate='#626c6d',leaves='#58634b',drygrass='#817751')
OFFSETS.update(wall_plaster=(0,240,0),wall_window=(130,240,0),wall_chimney=(260,240,0),wall_timbers=(390,240,0),collapsed_roof=(520,240,0),supply_barrel=(600,240,0),dead_tree=(0,400,0),tree_oak=(150,400,0),broken_fence=(300,400,0),grass_clump=(430,400,0))

def ref_clear(asset):
 for o in list(bpy.context.scene.objects):
  if o.get('tb_asset')==asset:bpy.data.objects.remove(o,do_unlink=True)

def copy_wall(asset):
 for source in list(bpy.context.scene.objects):
  if source.get('tb_asset')!='wall':continue
  o=source.copy();o.data=source.data.copy();bpy.context.scene.collection.objects.link(o);o.name=asset+'_'+source.name[5:]
  o.location+=Vector(OFFSETS[asset])-Vector(source.get('tb_display_offset',OFFSETS['wall']));o['tb_asset']=asset;o['tb_display_offset']=OFFSETS[asset]

def ref_poly(asset,name,verts,faces,key):
 me=bpy.data.meshes.new(name);me.from_pydata([(x,-z,y) for x,y,z in verts],[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.scene.collection.objects.link(o);return ref_tag(o,asset,name,key)

def ref_branch(asset,name,a,b,r1,r2,key):
 aa=Vector((a[0],-a[2],a[1]));bb=Vector((b[0],-b[2],b[1]));v=bb-aa
 bpy.ops.mesh.primitive_cone_add(vertices=7,radius1=r1,radius2=r2,depth=v.length,location=(aa+bb)/2);o=bpy.context.object;o.rotation_euler=v.to_track_quat('Z','Y').to_euler();return ref_tag(o,asset,name,key)

def build_architecture(assets):
 for asset in assets:
  ref_clear(asset);r=random.Random(seed(asset))
  if asset.startswith('wall_'):copy_wall(asset)
  if asset in ['wall_plaster','wall_window']:
   for side in [-1,1]:
    for j in range(2):
     x=-47 if j==0 else 13;w=53 if j==0 else 33;z=side*8.18
     vertices=[(x,3,z),(x+w,3,z),(x+w-2,11,z),(x+w-7,14,z),(x+w-4,24,z),(x+w*.62,25+r.uniform(-2,2),z),(x+w*.46,20,z),(x+w*.3,26,z),(x+3,27,z),(x+1,18,z),(x+5,14,z)]
     order=tuple(range(len(vertices)));faces=[order if side==1 else tuple(reversed(order))]
     ref_poly(asset,'Broken_lime_plaster',vertices,faces,'plaster')
   if asset=='wall_plaster':
    for i in range(3):ref_block(asset,'Exposed_header',(-28+i*28,33,0),(24,5,15),'stone',r,.7)
  if asset=='wall_window':
   # A partial window surround rises from a solid masonry sill.
   for side in [-1,1]:
    ref_block(asset,'Window_jamb',(side*31,40,0),(11,33 if side==-1 else 21,15),'brick',r,1)
    ref_block(asset,'Weathered_frame',(side*23,42,2),(3,27,3),'wood',r,.4)
   ref_block(asset,'Chipped_window_sill',(0,30,1),(65,5,17),'stone',r,.8)
   ref_branch(asset,'Broken_lintel',(-29,58,0),(3,53,0),3.8,2.6,'charred')
   # Broken shutter hangs on one side of the surround.
   for i in range(3):
    o=ref_block(asset,'Shutter_slat',(-36+i*4,42,8),(3.5,22-i*3,1.6),'wood',r,.3);o.rotation_euler.y=-.12
  if asset=='wall_chimney':
   for row in range(7):
    for j in range(2):ref_block(asset,'Chimney_course',(24+j*10.5,24+row*8.3,0),(10,7.9,15),'brick',r,.7)
   ref_block(asset,'Sooty_flue',(29,81,0),(13,1,9),'charred',r,.1)
   for x in [20,37]:ref_block(asset,'Broken_flue_rim',(x,82,0),(4,4,16),'stone',r,.7)
  if asset=='wall_timbers':
   for x,h in [(-34,57),(22,47)]:ref_branch(asset,'Charred_upright',(x,24,0),(x+2,h,0),3,2.3,'charred')
   ref_branch(asset,'Collapsed_crossbeam',(-39,53,0),(36,35,0),3.5,2,'charred')
   ref_branch(asset,'Exposed_brace',(-26,29,2),(-6,45,2),1.7,1.2,'wood')
  if asset=='collapsed_roof':
   for x in [-11,8]:ref_branch(asset,'Roof_joist',(x,3,-17),(x+5,24,15),2.6,1.5,'charred')
   for row in range(3):
    for col in range(3):
     x=-12+col*9;z=-10+row*9;y=6+row*5
     o=ref_block(asset,'Broken_slate',(x,y,z),(8.5,1.7,10),'slate',r,.35);o.rotation_euler.x=-.5+r.uniform(-.15,.15)
   for i in range(4):ref_chip(asset,'Roof_mortar',(r.uniform(-11,11),4,r.uniform(-12,12)),(5,4,4),'stone',r)
  if asset=='supply_barrel':
   for i in range(12):
    a=i/12*math.tau;ref_branch(asset,'Barrel_stave',(math.sin(a)*12,2,math.cos(a)*12),(math.sin(a)*12.7,33,math.cos(a)*12.7),3.3,3.3,'wood')
   for y in [7,27]:
    bpy.ops.mesh.primitive_torus_add(major_radius=13,minor_radius=.85,major_segments=12,minor_segments=4,location=(0,0,y));o=bpy.context.object;ref_tag(o,asset,'Rusty_hoop','rust')
   for j in range(4):ref_block(asset,'Barrel_lid',(-9+j*6,34,0),(5.5,1.5,19 if j in [0,3] else 24),'wood',r,.25)
  bpy.context.view_layer.update()
 print('Built architecture:',assets)

def build_landscape(assets):
 for asset in assets:
  ref_clear(asset);r=random.Random(seed(asset))
  if asset in ['dead_tree','tree_oak']:
   ref_branch(asset,'Gnarled_trunk',(0,0,0),(5,68,-3),9,4,'charred' if asset=='dead_tree' else 'wood')
   for i in range(5):
    a=i/5*math.tau;x,z=math.sin(a),math.cos(a)
    ref_branch(asset,'Exposed_root',(x*17,0,z*17),(0,13,0),2.8,4,'charred' if asset=='dead_tree' else 'wood')
    tip=(x*(28 if i%2 else 35),85+i*5,z*28)
    ref_branch(asset,'Forked_limb',(3,42+i*5,-2),tip,4-i*.4,1.4,'charred' if asset=='dead_tree' else 'wood')
    ref_branch(asset,'Snapped_branch',tip,(tip[0]+x*9,tip[1]+12,tip[2]-z*6),1.5,.3,'charred' if asset=='dead_tree' else 'wood')
    if asset=='tree_oak':
     for j in range(2):ref_chip(asset,'Ragged_canopy',(tip[0]+r.uniform(-8,8),tip[1]+j*13,tip[2]+r.uniform(-7,7)),(r.uniform(18,26),r.uniform(15,23),r.uniform(19,27)),'leaves',r)
   if asset=='dead_tree':ref_branch(asset,'Pale_split',(5,56,-3),(6,76,-3),3.8,.2,'wood')
  if asset=='broken_fence':
   for x,h in [(-34,38),(34,28)]:ref_branch(asset,'Fence_post',(x,0,0),(x+2,h,0),3,2.5,'charred')
   for y in [12,25]:ref_branch(asset,'Broken_rail',(-35,y,0),(16,y-5,0),1.7,1.2,'wood')
   ref_branch(asset,'Fallen_rail',(10,2,-4),(40,17,0),1.8,1.2,'wood')
  if asset=='grass_clump':
   for i in range(11):
    x,z=r.uniform(-7,7),r.uniform(-7,7);h=r.uniform(5,12);dx,dz=r.uniform(-3,3),r.uniform(-3,3)
    ref_poly(asset,'Dry_blade',[(x-.5,0,z),(x+.5,0,z),(x+dx,h,z+dz)],[(0,1,2),(2,1,0)],'drygrass')
  bpy.context.view_layer.update()
 print('Built landscape:',assets)
