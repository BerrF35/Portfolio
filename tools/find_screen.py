import json

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

meshes = data.get('meshes', [])
materials = data.get('materials', [])
nodes = data.get('nodes', [])

for i, m in enumerate(meshes):
    for prim in m.get('primitives', []):
        mat_idx = prim.get('material')
        if mat_idx == 67: # screen
            print(f'Mesh [{i}] "{m.get("name")}" has material "screen"')
            for n_idx, n in enumerate(nodes):
                if n.get('mesh') == i:
                    print(f'   Node [{n_idx}] "{n.get("name")}" uses this mesh')
