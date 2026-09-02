import json, struct
import numpy as np

def quaternion_matrix(q):
    x, y, z, w = q
    return np.array([
        [1 - 2*y*y - 2*z*z,     2*x*y - 2*z*w,     2*x*z + 2*y*w, 0],
        [    2*x*y + 2*z*w, 1 - 2*x*x - 2*z*z,     2*y*z - 2*x*w, 0],
        [    2*x*z - 2*y*w,     2*y*z + 2*x*w, 1 - 2*x*x - 2*y*y, 0],
        [                0,                 0,                 0, 1]
    ], dtype=np.float64)

def translation_matrix(t):
    return np.array([[1,0,0,t[0]],[0,1,0,t[1]],[0,0,1,t[2]],[0,0,0,1]], dtype=np.float64)

def scale_matrix(s):
    return np.array([[s[0],0,0,0],[0,s[1],0,0],[0,0,s[2],0],[0,0,0,1]], dtype=np.float64)

with open('assets/futuristic_room.glb', 'rb') as f:
    f.read(12)
    chunk_length, chunk_type = struct.unpack('<II', f.read(8))
    data = json.loads(f.read(chunk_length).decode('utf-8'))

materials = data.get('materials', [])
nodes = data.get('nodes', [])
meshes = data.get('meshes', [])
accessors = data.get('accessors', [])

parent_map = {}
for i, n in enumerate(nodes):
    for c in n.get('children', []):
        parent_map[c] = i

def get_node_local_matrix(n):
    if 'matrix' in n:
        return np.array(n['matrix']).reshape((4, 4)).T
    M = np.identity(4)
    if 'translation' in n:
        M = M @ translation_matrix(n['translation'])
    if 'rotation' in n:
        M = M @ quaternion_matrix(n['rotation'])
    if 'scale' in n:
        M = M @ scale_matrix(n['scale'])
    return M

world_matrices = {}
def compute_world_matrix(idx):
    if idx in world_matrices:
        return world_matrices[idx]
    local_M = get_node_local_matrix(nodes[idx])
    parent_idx = parent_map.get(idx)
    if parent_idx is not None:
        parent_M = compute_world_matrix(parent_idx)
        world_M = parent_M @ local_M
    else:
        world_M = local_M
    world_matrices[idx] = world_M
    return world_M

print("=== ALL MESHES AND THEIR WALL / COLOR / TEXTURE ===")
for n_idx, n in enumerate(nodes):
    mesh_idx = n.get('mesh')
    if mesh_idx is not None:
        mesh = meshes[mesh_idx]
        for prim in mesh.get('primitives', []):
            mat_idx = prim.get('material')
            mat_name = materials[mat_idx].get('name') if mat_idx is not None else 'None'
            
            M = compute_world_matrix(n_idx)
            pos_acc = accessors[prim['attributes']['POSITION']]
            corners = []
            for x in [pos_acc['min'][0], pos_acc['max'][0]]:
                for y in [pos_acc['min'][1], pos_acc['max'][1]]:
                    for z in [pos_acc['min'][2], pos_acc['max'][2]]:
                        corners.append((M @ [x, y, z, 1.0])[:3])
            corners = np.array(corners)
            min_w = corners.min(axis=0)
            max_w = corners.max(axis=0)
            print(f"[{n_idx:3d}] {n.get('name'):30} | Mat: {mat_name:18} | X=[{min_w[0]:.2f}, {max_w[0]:.2f}] Y=[{min_w[1]:.2f}, {max_w[1]:.2f}] Z=[{min_w[2]:.2f}, {max_w[2]:.2f}]")
