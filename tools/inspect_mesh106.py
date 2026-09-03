import json

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

meshes = data.get('meshes', [])
accessors = data.get('accessors', [])

m106 = meshes[106] # mesh Object_15
print('Mesh 106 name:', m106.get('name'))
for p in m106['primitives']:
    print('Material:', p.get('material'))
    print('Attributes:', p.get('attributes'))
    if 'targets' in p:
        print('Targets (morph):', len(p['targets']))
