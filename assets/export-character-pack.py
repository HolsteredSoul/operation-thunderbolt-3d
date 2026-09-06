import bpy,json
from pathlib import Path
base=Path(r'C:\DEV\Thunderbolt_3d\assets')
roles=['player','rifleman','officer','sniper','nest']
pack=json.loads((base/'village-pack.json').read_text())
assets={}
bpy.context.view_layer.update()
for obj in bpy.context.scene.objects:
 if obj.type!='MESH' or obj.get('tb_asset') not in roles:continue
 mesh=obj.data;mesh.calc_loop_triangles();pivot=list(obj['tb_pivot']);joint=obj['tb_joint'];asset=obj['tb_asset'];mat=obj['tb_mat'];offset=obj.get('tb_display_offset',(0,0,0))
 group=assets.setdefault(asset,{}).setdefault(joint+'|'+mat,{'joint':joint,'material':mat,'pivot':pivot,'positions':[],'normals':[]})
 normalmat=obj.matrix_world.to_3x3().inverted().transposed()
 for tri in mesh.loop_triangles:
  for vi in tri.vertices:
   v=obj.matrix_world@mesh.vertices[vi].co;n=(normalmat@mesh.vertices[vi].normal).normalized()
   group['positions'].extend([round(v.x-offset[0]-pivot[0],5),round(v.z-offset[2]-pivot[1],5),round(-(v.y-offset[1])-pivot[2],5)])
   group['normals'].extend([round(n.x,5),round(n.z,5),round(-n.y,5)])
for role,parts in assets.items():pack['assets'][role]=list(parts.values())
pack['revision']='kneeling-sniper-v4'
pack['materials']={o['tb_mat']:o.data.materials[0]['tb_srgb'] for o in bpy.context.scene.objects if o.type=='MESH' and o.get('tb_asset') in roles and o.data.materials and o.data.materials[0].get('tb_srgb')}
(base/'village-pack.json').write_text(json.dumps(pack,separators=(',',':')))
print('Exported role revision:',pack['revision'])
