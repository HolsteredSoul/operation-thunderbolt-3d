"""Export the complete tagged Blender workshop, including animation pivots and baked wear.
Run through Blender MCP with the Thunderbolt Asset Workshop scene active.
"""
import bpy,json
from pathlib import Path
base=Path(r'C:\DEV\Thunderbolt_3d\assets')
pack=json.loads((base/'village-pack.json').read_text())
assets={};materials=dict(pack.get('materials',{}))
bpy.context.view_layer.update()
for obj in bpy.context.scene.objects:
 if obj.type!='MESH' or not obj.get('tb_asset'):continue
 mesh=obj.data;mesh.calc_loop_triangles();pivot=list(obj['tb_pivot']);joint=obj['tb_joint'];asset=obj['tb_asset'];mat=obj['tb_mat'];offset=obj.get('tb_display_offset',(0,0,0))
 group=assets.setdefault(asset,{}).setdefault(joint+'|'+mat,{'joint':joint,'material':mat,'pivot':pivot,'positions':[],'normals':[],'colors':[]})
 normalmat=obj.matrix_world.to_3x3().inverted().transposed();wear=mesh.color_attributes.get('tb_wear')
 for tri in mesh.loop_triangles:
  for li in tri.loops:
   vi=mesh.loops[li].vertex_index;v=obj.matrix_world@mesh.vertices[vi].co
   normal=mesh.vertices[vi].normal if mesh.polygons[tri.polygon_index].use_smooth else tri.normal
   n=(normalmat@normal).normalized()
   group['positions'].extend([round(v.x-offset[0]-pivot[0],5),round(v.z-offset[2]-pivot[1],5),round(-(v.y-offset[1])-pivot[2],5)])
   group['normals'].extend([round(n.x,5),round(n.z,5),round(-n.y,5)])
   group['colors'].extend(round(c,4) for c in (wear.data[li].color[:3] if wear else (1,1,1)))
 if mesh.materials and mesh.materials[0].get('tb_srgb'):materials[mat]=mesh.materials[0]['tb_srgb']
for asset,parts in assets.items():pack['assets'][asset]=list(parts.values())
pack['revision']='village-architecture-v8';pack['materials']=materials
(base/'village-pack.json').write_text(json.dumps(pack,separators=(',',':')))
print('Exported',pack['revision'],{k:sum(len(p['positions'])//9 for p in v.values()) for k,v in assets.items()})
