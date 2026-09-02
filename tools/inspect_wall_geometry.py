import json, struct, sys, os
sys.path.append(os.path.dirname(__file__))
from find_white_wall import nodes, meshes, materials

# Let's inspect the wall sub-meshes and where they are located
# In GLTF, Walls_0 has vertices. Let's see which walls exist in Walls_0!
with open('assets/futuristic_room.glb', 'rb') as f:
    f.read(12)
    chunk_length, chunk_type = struct.unpack('<II', f.read(8))
    data = json.loads(f.read(chunk_length).decode('utf-8'))
    f.read(8)
    bin_bytes = f.read()

import numpy as np
from find_white_wall import compute_world_matrix, accessors

# Let's look at all meshes that are part of the architecture
for idx in [5, 6, 8, 22]:
    n = nodes[idx]
    mesh = meshes[n['mesh']]
    print(f"Node {idx} '{n['name']}':")
    for prim in mesh['primitives']:
        pos_acc = accessors[prim['attributes']['POSITION']]
        bv = data['bufferViews'][pos_acc['bufferView']]
        offset = bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
        cnt = pos_acc['count']
        verts = np.frombuffer(bin_bytes[offset:offset+cnt*12], dtype=np.float32).reshape((cnt, 3))
        M = compute_world_matrix(idx)
        v_w = (np.hstack([verts, np.ones((cnt, 1))]) @ M.T)[:, :3]
        print(f"   Vertices count: {cnt}, X range: [{v_w[:,0].min():.2f}, {v_w[:,0].max():.2f}], Z range: [{v_w[:,2].min():.2f}, {v_w[:,2].max():.2f}]")
