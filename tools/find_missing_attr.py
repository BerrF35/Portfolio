import json

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

accessors = data.get('accessors', [])
meshes = data.get('meshes', [])
buffer_views = data.get('bufferViews', [])

print(f'Total accessors: {len(accessors)}')
for i, acc in enumerate(accessors):
    bv_idx = acc.get('bufferView')
    count = acc.get('count', 0)
    if bv_idx is None:
        print(f'Accessor [{i}] has NO bufferView! count={count}')
    elif bv_idx >= len(buffer_views):
        print(f'Accessor [{i}] bufferView {bv_idx} out of range! count={count}')

for m_idx, m in enumerate(meshes):
    for p_idx, p in enumerate(m.get('primitives', [])):
        for attr_name, acc_idx in p.get('attributes', {}).items():
            acc = accessors[acc_idx]
            if acc.get('bufferView') is None:
                print(f'Mesh [{m_idx}] "{m.get("name")}" prim [{p_idx}] attr "{attr_name}" has accessor {acc_idx} with NO bufferView!')
