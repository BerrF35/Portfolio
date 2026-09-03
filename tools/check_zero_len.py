import json

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

meshes = data.get('meshes', [])
accessors = data.get('accessors', [])
buffer_views = data.get('bufferViews', [])

for m_idx, m in enumerate(meshes):
    for p_idx, p in enumerate(m.get('primitives', [])):
        # check attributes
        for a_name, a_idx in p.get('attributes', {}).items():
            acc = accessors[a_idx]
            bv = buffer_views[acc['bufferView']]
            if bv.get('byteLength', 0) == 0 or acc.get('count', 0) == 0:
                print(f'Mesh {m_idx} ({m.get("name")}) prim {p_idx} attr {a_name} has count=0 or byteLength=0!')
        # check indices
        if 'indices' in p:
            i_idx = p['indices']
            acc = accessors[i_idx]
            bv = buffer_views[acc['bufferView']]
            if bv.get('byteLength', 0) == 0 or acc.get('count', 0) == 0:
                print(f'Mesh {m_idx} ({m.get("name")}) prim {p_idx} indices has count=0 or byteLength=0!')
