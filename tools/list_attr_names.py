import json

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

meshes = data.get('meshes', [])
accessors = data.get('accessors', [])
buffer_views = data.get('bufferViews', [])

all_attr_names = set()
for m in meshes:
    for p in m.get('primitives', []):
        for name in p.get('attributes', {}).keys():
            all_attr_names.add(name)

print('All attribute names in GLB:', all_attr_names)
