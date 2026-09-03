import json
import numpy as np

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))
    bin_data = f.read()

# Let's inspect mesh 115 primitive vertices
meshes = data.get('meshes', [])
accessors = data.get('accessors', [])
buffer_views = data.get('bufferViews', [])

m115 = meshes[115]
prim = m115['primitives'][0]
pos_acc = accessors[prim['attributes']['POSITION']]
bv = buffer_views[pos_acc['bufferView']]
offset = bv.get('byteOffset', 0) + pos_acc.get('byteOffset', 0)
count = pos_acc['count']

vertices = np.frombuffer(bin_data[offset:offset+count*12], dtype=np.float32).reshape((count, 3))
print('Total vertices:', count)
print('Y range:', vertices[:,1].min(), vertices[:,1].max())
print('Z range:', vertices[:,2].min(), vertices[:,2].max())
print('X range:', vertices[:,0].min(), vertices[:,0].max())

# Let's see if vertices cluster along Y or Z into 3 buttons!
hist, bin_edges = np.histogram(vertices[:, 1], bins=10)
print('Y histogram:', hist)
print('Bin edges:', bin_edges.round(2))
