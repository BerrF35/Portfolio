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

parent_map = {}
for i, n in enumerate(nodes):
    for c in n.get('children', []):
        parent_map[c] = i

def get_node_matrix(idx):
    n = nodes[idx]
    M = np.identity(4)
    t = n.get('translation')
    if t:
        M[0,3] = t[0]; M[1,3] = t[1]; M[2,3] = t[2]
    r = n.get('rotation')
    if r:
        x,y,z,w = r
        R = np.array([
            [1 - 2*y*y - 2*z*z, 2*x*y - 2*z*w, 2*x*z + 2*y*w, 0],
            [2*x*y + 2*z*w, 1 - 2*x*x - 2*z*z, 2*y*z - 2*x*w, 0],
            [2*x*z - 2*y*w, 2*y*z + 2*x*w, 1 - 2*x*x - 2*y*y, 0],
            [0, 0, 0, 1]
        ])
        M = M @ R
    s = n.get('scale')
    if s:
        S = np.diag([s[0], s[1], s[2], 1])
        M = M @ S
    p = parent_map.get(idx)
    if p is not None:
        return get_node_matrix(p) @ M
    return M

# Switch is node 193
M = get_node_matrix(193)
prim = meshes[115]['primitives'][0]
pos_acc = accessors[prim['attributes']['POSITION']]
pmin = np.array(pos_acc['min'] + [1])
pmax = np.array(pos_acc['max'] + [1])

wmin = (M @ pmin)[:3]
wmax = (M @ pmax)[:3]
print('Node 193 Matrix:\n', M.round(3))
print('World bounding box:', np.minimum(wmin, wmax).round(3), np.maximum(wmin, wmax).round(3))
