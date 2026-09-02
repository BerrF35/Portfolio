import json, struct, sys, os
import numpy as np

sys.path.append(os.path.dirname(__file__))
from find_white_wall import nodes, meshes, accessors, compute_world_matrix

with open('assets/futuristic_room.glb', 'rb') as f:
    f.read(12)
    chunk_len, _ = struct.unpack('<II', f.read(8))
    data = json.loads(f.read(chunk_len).decode('utf-8'))
    f.read(8)
    bin_bytes = f.read()

wall_mesh = meshes[nodes[5]['mesh']]
prim = wall_mesh['primitives'][0]
pos_acc = accessors[prim['attributes']['POSITION']]
bv = data['bufferViews'][pos_acc['bufferView']]
offset = bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
cnt = pos_acc['count']
verts = np.frombuffer(bin_bytes[offset:offset+cnt*12], dtype=np.float32).reshape((cnt, 3))
M = compute_world_matrix(5)
v_w = (np.hstack([verts, np.ones((cnt, 1))]) @ M.T)[:, :3]

# Right wall vertices
mask = (v_w[:, 0] > 0.3) & (v_w[:, 0] < 0.6)
print("Right wall verts near x ~ 0.49:")
print(f"Count: {np.sum(mask)}")
print(f"Y range: [{v_w[mask, 1].min():.2f}, {v_w[mask, 1].max():.2f}]")
print(f"Z range: [{v_w[mask, 2].min():.2f}, {v_w[mask, 2].max():.2f}]")

# Let's see what z ranges exist on this wall
z_vals = v_w[mask, 2]
print(f"Z min: {z_vals.min():.2f}, Z max: {z_vals.max():.2f}")
