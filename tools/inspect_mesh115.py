import json
import numpy as np

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

meshes = data.get('meshes', [])
accessors = data.get('accessors', [])
materials = data.get('materials', [])

m = meshes[115]
print('Mesh 115 name:', m.get('name'))
print('Primitives count:', len(m.get('primitives', [])))
for i, p in enumerate(m['primitives']):
    mat_idx = p.get('material')
    mat_name = materials[mat_idx].get('name') if mat_idx is not None else 'None'
    pos_acc = accessors[p['attributes']['POSITION']]
    print(f'Prim {i}: mat={mat_name} min={pos_acc["min"]} max={pos_acc["max"]}')
