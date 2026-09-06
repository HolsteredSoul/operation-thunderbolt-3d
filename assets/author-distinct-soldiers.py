"""Run in Blender through Blender MCP, in small build passes.

Game coordinates: X sideways, Y up, Z forward. Units match the original game.
Authoring colors are native Blender materials and also exported to the browser.
"""
import bpy,bmesh, math
from mathutils import Vector

PALETTES = {
 'player':dict(uniform='#a89969',dark='#69704d',helmet='#566540',skin='#c9a079',boots='#403c30',webbing='#d0bf89',wood='#85562f',metal='#394540',accent='#e4ddba'),
 'rifleman':dict(uniform='#6f7d85',dark='#454f58',helmet='#3b4955',skin='#c29a79',boots='#262f33',webbing='#696858',wood='#614730',metal='#27333c',accent='#abae9b'),
 'officer':dict(uniform='#343a42',dark='#24282e',helmet='#242832',skin='#cba58a',boots='#242729',webbing='#775a3d',wood='#6f4d30',metal='#3b4247',accent='#c5aa62',band='#9c4035'),
 'sniper':dict(uniform='#657442',dark='#394d31',helmet='#51643b',skin='#ab9170',boots='#4b5140',webbing='#a29462',wood='#6d4d2b',metal='#36443c',accent='#9caa62'),
 'nest':dict(uniform='#656b5c',dark='#394a40',helmet='#3d4d3e',skin='#ba9979',boots='#323c33',webbing='#968460',wood='#796240',metal='#35413e',accent='#c0a458',sand='#b3a17b'),
}

def srgb(v):
 return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4

def mat(role, key):
 name=role+'_'+key
 m=bpy.data.materials.get('TB_'+name)
 if not m:m=bpy.data.materials.new('TB_'+name)
 color=PALETTES[role][key];rgb=tuple(srgb(int(color[i:i+2],16)/255) for i in (1,3,5))
 m.diffuse_color=(*rgb,1);m.use_nodes=True
 bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*rgb,1)
 bs.inputs['Roughness'].default_value=.86 if key!='metal' else .65
 m['tb_srgb']=color
 return m

def tag(o,role,name,key,joint='body',pivot=(0,0,0)):
 o.name=role+'_'+name;o.data.materials.append(mat(role,key))
 o['tb_asset']=role;o['tb_mat']=role+'_'+key;o['tb_joint']=joint;o['tb_pivot']=pivot
 return o

def point(v):return (v[0],-v[2],v[1])

def ell(role,name,pos,size,key,joint='body',pivot=(0,0,0),rough=False):
 if rough:bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1,radius=1,location=point(pos))
 else:bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,radius=1,location=point(pos))
 o=bpy.context.object;o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 for f in o.data.polygons:f.use_smooth=not rough
 return tag(o,role,name,key,joint,pivot)

def block(role,name,pos,size,key,joint='body',pivot=(0,0,0),bevel=.5):
 bpy.ops.mesh.primitive_cube_add(size=1,location=point(pos));o=bpy.context.object;o.scale=(size[0],size[2],size[1])
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  b=o.modifiers.new('Worn edges','BEVEL');b.width=min(bevel,min(size)*.2);b.segments=1;bpy.ops.object.modifier_apply(modifier=b.name)
 return tag(o,role,name,key,joint,pivot)

def limb(role,name,a,b,r1,r2,key,joint='body',pivot=(0,0,0)):
 aa,bb=Vector(point(a)),Vector(point(b));vec=bb-aa
 bpy.ops.mesh.primitive_cone_add(vertices=10,radius1=r1,radius2=r2,depth=vec.length,location=(aa+bb)/2)
 o=bpy.context.object;o.rotation_euler=vec.to_track_quat('Z','Y').to_euler()
 for f in o.data.polygons:f.use_smooth=len(f.vertices)==4
 return tag(o,role,name,key,joint,pivot)

def cloth(role,name,levels,key,joint='body',pivot=(0,0,0),ragged=False):
 # Elliptical sections form a tapered, human torso or a flowing coat, not a cuboid.
 n=12;verts=[]
 for k,(y,rx,rz,z) in enumerate(levels):
  for i in range(n):
   a=i/n*math.tau;yy=y+((i%3-1)*1.8 if ragged and k==0 else 0)
   verts.append(point((math.cos(a)*rx,yy,z+math.sin(a)*rz)))
 faces=[tuple(reversed(range(n)))]
 for k in range(len(levels)-1):
  for i in range(n):faces.append((k*n+i,k*n+(i+1)%n,(k+1)*n+(i+1)%n,(k+1)*n+i))
 faces.append(tuple((len(levels)-1)*n+i for i in range(n)))
 me=bpy.data.meshes.new(role+'_'+name);me.from_pydata(verts,[],faces);me.update()
 o=bpy.data.objects.new(role+'_'+name,me);bpy.context.scene.collection.objects.link(o)
 return tag(o,role,name,key,joint,pivot)

def face(role,y,z=1):
 ell(role,'Head',(0,y,z),(3.6,4.5,3.5),'skin')
 block(role,'Nose',(0,y-.2,z+3.6),(1.6,2.2,1.7),'skin',bevel=.2)
 for side in [-1,1]:
  ell(role,'Ear',(side*3.5,y-.5,z),(1,1.6,.8),'skin')
  block(role,'Brow',(side*1.7,y+1,z+3),(2,.65,.8),'dark',bevel=0)

def helmet(role,y,z=0,german=False):
 ell(role,'Helmet_dome',(0,y+3,z),(6.3,3.8,6.8),'helmet')
 if german:
  # Deep flared rear skirt and projecting brow distinguish the Stahlhelm.
  cloth(role,'Helmet_neck_skirt',[(y-1,7.3,7.6,z-1.3),(y+1,6.1,6.3,z)],'helmet')
  block(role,'Helmet_brow',(0,y+1,z+5.4),(12,1.6,5),'helmet')
 else:ell(role,'M1_shallow_brim',(0,y+1,z),(7.2,.6,7.5),'helmet')

def legs(role,hip_y=25,stance=4,heavy=False):
 for side,s in [('L',-1),('R',1)]:
  pivot=(s*stance,hip_y,0);joint='leg'+side
  limb(role,'Thigh_'+side,pivot,(s*(stance+.8),14,1),3.4 if heavy else 2.8,3.1,'uniform',joint,pivot)
  limb(role,'Shin_'+side,(s*(stance+.8),14,1),(s*(stance+1),4,1),2.9,2.3,'dark' if heavy else 'uniform',joint,pivot)
  ell(role,'Boot_'+side,(s*(stance+1),3,3),(3.2,3,5.5),'boots',joint,pivot)

def rifle(role,long=False):
 pivot=(3,29,10)
 block(role,'Rifle_stock',(3,29,10),(2.8,3.4,17),'wood','gun',pivot)
 limb(role,'Rifle_barrel',(3,30,15),(3,30,40 if long else 30),1,1,'metal','gun',pivot)
 block(role,'Front_sight',(3,31.6,37 if long else 28),(1.7,3,1.3),'metal','gun',pivot)
 if long:
  limb(role,'Long_scope',(3,34,12),(3,34,25),1.9,1.9,'metal','gun',pivot)
  for z in [14,22]:block(role,'Scope_mount',(3,32,z),(2,4,2),'metal','gun',pivot)
  for side in [-1,1]:limb(role,'Bipod',(3,29,29),(3+side*7,1,30),.8,.7,'metal','gun',pivot)

def build_player():
 r='player';legs(r,25,4.5)
 cloth(r,'Broad_field_jacket',[(24,7.2,4.5,0),(32,9.2,5.7,0),(40,10.8,4.7,0),(42,5,3.5,0)],'uniform')
 face(r,48);helmet(r,49)
 block(r,'Belt',(0,26,0),(17,2.4,11),'webbing')
 for s in [-1,1]:
  limb(r,'Rolled_sleeve',(s*10,38,0),(s*11,33,6),3.2,3.4,'uniform')
  limb(r,'Forearm',(s*11,33,6),(s*5,29,13),2.3,1.8,'skin')
  ell(r,'Hand',(s*5,29,13),(2,2,2),'skin')
  limb(r,'Harness',(s*5,41,4),(s*5,26,6),1,1,'webbing')
  block(r,'Pouch',(s*6,28,6),(5,6,3.5),'webbing')
 block(r,'Large_field_pack',(0,33,-9),(15,17,8),'dark',bevel=1.4)
 limb(r,'Rolled_blanket',(-10,42,-9),(10,42,-9),3.7,3.7,'webbing')
 for x in [-6,6]:block(r,'Pack_strap',(x,33,-13.2),(1.5,17,1),'webbing')
 ell(r,'Canteen',(10,24,-2),(3.2,4.5,3),'dark');rifle(r)

def build_rifleman():
 r='rifleman';legs(r,25,3.5,True)
 cloth(r,'Narrow_coat',[(19,8,5,-1),(29,7.3,4.8,0),(38,8.5,4.5,2),(41,4,3,3)],'uniform')
 face(r,46,4);helmet(r,47,4,True)
 # Head forward, shoulders hunched, long boot gaiters and a diagonal ammunition belt.
 for s in [-1,1]:
  limb(r,'Upper_arm',(s*8,36,2),(s*10,28,5),2.7,2.4,'uniform')
  limb(r,'Forearm',(s*10,28,5),(s*5,29,13),2.5,1.6,'uniform')
  ell(r,'Hand',(s*5,29,13),(1.9,1.9,1.9),'skin')
 limb(r,'Diagonal_bandolier',(-6,39,6),(6,23,6),1.2,1.2,'webbing')
 for i in range(5):block(r,'Cartridge_pouch',(-5+i*2.3,37-i*2.8,7),(4,3,2.5),'webbing')
 block(r,'Small_haversack',(-2,30,-7),(10,11,5),'dark')
 limb(r,'Bedroll_side',(-10,25,-6),(-10,36,-6),2.7,2.7,'webbing')
 rifle(r)

def build_officer():
 r='officer';legs(r,29,3)
 for s in [-1,1]:
  ell(r,'Riding_breeches',(s*4,25,0),(4.1,5,3.5),'uniform','legL' if s<0 else 'legR',(s*3,29,0))
  limb(r,'Tall_polished_boot',(s*4,4,1),(s*4,18,1),2.5,2.7,'boots','legL' if s<0 else 'legR',(s*3,29,0))
 cloth(r,'Fitted_officer_tunic',[(25,6.4,4,0),(34,6,3.8,0),(45,8.1,4.1,0),(46,3.6,2.7,0)],'uniform')
 # Split coat tails, slender waist and a high peaked cap form a tall silhouette.
 for s in [-1,1]:
  tail=block(r,'Split_coat_tail',(s*3.3,21,-4),(6,14,3),'dark');tail.rotation_euler.y=s*.13
  block(r,'Epaulette',(s*8,44,0),(4,1.7,8),'accent')
 face(r,51.5)
 ell(r,'Peaked_cap_crown',(0,57,0),(6.7,2,5.9),'helmet')
 cloth(r,'Crimson_cap_band',[(54.5,5.8,5.3,0),(55.8,6.4,5.7,0)],'band')
 block(r,'Broad_cap_peak',(0,54,6),(12,1.3,7),'metal')
 for y in [33,37,41]:ell(r,'Brass_button',(0,y,4.1),(.8,.8,.5),'accent')
 limb(r,'Pistol_upper_arm',(8,41,0),(12,37,9),2.4,2.1,'uniform')
 limb(r,'Pistol_forearm',(12,37,9),(11,36,22),2.1,1.5,'uniform')
 ell(r,'Pistol_hand',(11,36,23),(1.8,1.8,2),'skin')
 pivot=(11,36,23)
 block(r,'Pistol_grip',(11,35,25),(2.6,6,3),'wood','gun',pivot)
 block(r,'Pistol_slide',(11,38,28),(2.8,2.8,9),'metal','gun',pivot)
 limb(r,'Free_upper_arm',(-8,41,0),(-10,30,0),2.3,2,'uniform')
 limb(r,'Free_forearm',(-10,30,0),(-6,26,5),2,1.6,'uniform')
 ell(r,'Free_hand',(-6,26,5),(1.8,1.8,1.8),'skin')
 for x in [-8,-4]:limb(r,'Binocular_barrel',(x,23,7),(x,28,7),1.5,1.5,'metal')

def build_sniper():
 r='sniper'
 # A compact one-knee firing stance, with the support elbow resting on the raised knee.
 limb(r,'Raised_thigh',(-4,18,-3),(-7,14,11),3.1,2.8,'uniform')
 limb(r,'Forward_shin',(-7,14,11),(-7,3,12),2.7,2.2,'uniform')
 ell(r,'Forward_boot',(-7,2.8,15),(3,2.8,5),'boots')
 limb(r,'Rear_thigh',(4,18,-3),(7,4,-9),3.1,2.8,'uniform')
 limb(r,'Folded_shin',(7,4,-9),(7,3,-21),2.6,2.1,'dark')
 ell(r,'Rear_boot',(7,3,-23),(3,2.8,4.5),'boots')
 cloth(r,'Leaning_jacket',[(16,6,4,-3),(26,7,4,0),(31,7,4,3)],'uniform')
 cloth(r,'Short_camouflage_cape',[(13,8,6,-4),(24,9,5,-2),(31,7,4,1)],'dark',ragged=True)
 for x,y,z in [(-5,21,-8),(4,25,-6),(-6,28,-3)]:ell(r,'Cloth_camouflage_patch',(x,y,z),(2.4,2.8,.6),'uniform',rough=True)
 face(r,35,6)
 ell(r,'Fitted_cloth_hood',(0,36,4),(5.4,5.5,5.7),'helmet')
 block(r,'Face_opening',(0,35,9),(5.4,5.2,1.2),'skin')
 # Trigger hand near the stock; support forearm rises from the knee to the forestock.
 limb(r,'Trigger_upper_arm',(7,29,3),(10,23,6),2.6,2.1,'uniform')
 limb(r,'Trigger_forearm',(10,23,6),(3,31,10),2.1,1.6,'uniform')
 ell(r,'Trigger_hand',(3,31,10),(1.7,1.7,2),'skin')
 limb(r,'Support_upper_arm',(-7,29,3),(-7,17,11),2.6,2.1,'uniform')
 limb(r,'Support_forearm',(-7,17,11),(3,31,23),2.1,1.6,'uniform')
 ell(r,'Support_hand',(3,31,23),(1.7,1.7,2),'skin')
 pivot=(3,32,10)
 block(r,'Shouldered_rifle_stock',(3,32,10),(2.5,3,18),'wood','gun',pivot)
 limb(r,'Scoped_rifle_barrel',(3,33,16),(3,33,41),.9,.9,'metal','gun',pivot)
 limb(r,'Compact_scope',(3,36.5,10),(3,36.5,23),1.3,1.3,'metal','gun',pivot)
 for z in [13,20]:block(r,'Scope_mount',(3,34.5,z),(1.5,3,1.5),'metal','gun',pivot)
 block(r,'Rifle_front_sight',(3,34,39),(1.5,2.3,1.2),'metal','gun',pivot)
 block(r,'Belt_pouch',(-7,18,1),(4,5,3),'webbing')

def build_nest():
 r='nest'
 # Weapon first: a broad angular shield, exposed heavy barrel and ammunition feed.
 for s in [-1,1]:
  limb(r,'Seated_thigh',(s*5,16,-9),(s*11,10,2),3,3,'uniform')
  limb(r,'Seated_shin',(s*11,10,2),(s*11,3,8),3,2.5,'dark')
  ell(r,'Boot',(s*11,3,10),(3,2.7,5),'boots')
 cloth(r,'Gunner_jacket',[(13,7,5,-11),(25,8,5,-8),(30,5,4,-5)],'uniform')
 face(r,35,-5);helmet(r,36,-5,True)
 for s in [-1,1]:
  limb(r,'Gunner_arm',(s*7,26,-5),(s*6,27,10),2.7,2,'uniform')
  ell(r,'Gunner_hand',(s*6,27,10),(2,2,2),'skin')
 block(r,'Receiver',(3,29,17),(9,8,22),'metal')
 limb(r,'Heavy_barrel',(3,30,24),(3,30,56),2.7,2,'metal')
 for z in [29,34,39,44]:limb(r,'Barrel_cooling_ring',(3,30,z),(3,30,z+1.2),3.1,3.1,'dark')
 limb(r,'Tripod', (3,28,18),(3,2,22),2,2,'metal')
 for s in [-1,1]:limb(r,'Tripod_leg',(3,14,21),(s*17,1,30),1.5,1.2,'metal')
 shield=block(r,'Angled_gun_shield',(3,26,20),(40,20,3),'metal');shield.rotation_euler.x=.15
 block(r,'Sight_slot',(3,35,18.5),(14,2,1),'dark')
 block(r,'Ammo_chest',(-23,11,5),(17,21,24),'wood',bevel=1)
 block(r,'Ammo_chest_lid',(-23,22,5),(19,2,26),'webbing')
 for i in range(7):limb(r,'Brass_feed_round',(-17+i*2.4,27,11),(-17+i*2.4,27,17),.9,.9,'accent')
 for row in range(2):
  for i in range(9):
   a=(-.82+i/8*1.64)*math.pi
   o=ell(r,'Horseshoe_sandbag',(math.sin(a)*34,5+row*7,math.cos(a)*34),(10,4.6,7.5),'sand');o.rotation_euler.z=a

BUILDERS={'player':build_player,'rifleman':build_rifleman,'officer':build_officer,'sniper':build_sniper,'nest':build_nest}

def build_roles(roles):
 for role in roles:
  for o in list(bpy.context.scene.objects):
   if o.get('tb_asset')==role:bpy.data.objects.remove(o,do_unlink=True)
  BUILDERS[role]()
  for o in bpy.context.scene.objects:
   if o.type=='MESH' and o.get('tb_asset')==role:
    bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(o.data);bm.free();o.data.update()
 bpy.context.view_layer.update()
 print('Authored independent meshes:',', '.join(roles))
