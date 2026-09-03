import json
import numpy as np

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

nodes = data.get('nodes', [])
meshes = data.get('meshes', [])
accessors = data.get('accessors', [])
materials = data.get('materials', [])

# Let's inspect all nodes and find any switches or buttons
for i, n in enumerate(nodes):
    mesh_idx = n.get('mesh')
    if mesh_idx is not None:
        m = meshes[mesh_idx]
        prim = m['primitives'][0]
        pos_acc = accessors[prim['attributes']['POSITION']]
        min_p = np.array(pos_acc['min'])
        max_p = np.array(pos_acc['max'])
        size = max_p - min_p
        name = n.get('name', '')
        mat_name = materials[prim.get('material')].get('name') if prim.get('material') is not None else 'None'
        # check if switch or button or plane or box
        if any(w in name.lower() for w in ['switch', 'button', 'box', 'plane', 'cub', 'light']):
            print(f'[{i:3d}] "{name:25}" mat={mat_name:20} size={size.round(3)} trans={n.get("translation")}')
