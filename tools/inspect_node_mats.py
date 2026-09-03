import json

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

meshes = data.get('meshes', [])
materials = data.get('materials', [])
nodes = data.get('nodes', [])

def get_node_mats(node_idx):
    n = nodes[node_idx]
    mesh_idx = n.get('mesh')
    if mesh_idx is not None:
        m = meshes[mesh_idx]
        mat_indices = [p.get('material') for p in m.get('primitives', [])]
        mat_names = [materials[mi].get('name') if mi is not None else 'None' for mi in mat_indices]
        return mat_names
    return []

print('Node 0 mats:', get_node_mats(0))
for i in [27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]:
    print(f'Node {i} ({nodes[i].get("name")}):', get_node_mats(i))

for i in [366, 367, 368]:
    print(f'Node {i} ({nodes[i].get("name")}):', get_node_mats(i))
