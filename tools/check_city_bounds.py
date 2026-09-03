import json
import numpy as np

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

meshes = data.get('meshes', [])
accessors = data.get('accessors', [])

# City meshes are around 116 to 145
mins = []
maxs = []
for m_idx in range(116, 146):
    m = meshes[m_idx]
    for p in m['primitives']:
        pa = accessors[p['attributes']['POSITION']]
        mins.append(pa['min'])
        maxs.append(pa['max'])

mins = np.array(mins).min(axis=0)
maxs = np.array(maxs).max(axis=0)
city_pos = np.array([-60.457, -133.178, -60.922])
print('City local bounds:', mins, maxs)
print('City world bounds:', mins + city_pos, maxs + city_pos)
