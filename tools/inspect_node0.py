import json

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

nodes = data.get('nodes', [])
meshes = data.get('meshes', [])
accessors = data.get('accessors', [])

node0 = nodes[0]
mesh0 = meshes[node0['mesh']]
print('Node 0 name:', node0.get('name'))
print('Mesh 0 primitives count:', len(mesh0['primitives']))
prim0 = mesh0['primitives'][0]
pos_acc = accessors[prim0['attributes']['POSITION']]
print('Prim 0 bounds:', pos_acc['min'], pos_acc['max'])

# Check all primitives min/max
mins = []
maxs = []
for p in mesh0['primitives']:
    pa = accessors[p['attributes']['POSITION']]
    mins.append(pa['min'])
    maxs.append(pa['max'])

import numpy as np
mins = np.array(mins).min(axis=0)
maxs = np.array(maxs).max(axis=0)
print('Node 0 total local bounds:', mins, maxs)
print('Node 0 translation:', node0.get('translation'))
print('Node 0 world bounds:', mins + np.array(node0.get('translation', [0,0,0])), maxs + np.array(node0.get('translation', [0,0,0])))
