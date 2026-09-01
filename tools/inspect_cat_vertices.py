import json, struct

with open('assets/3d_modelling_my_cat_fripouille.glb', 'rb') as f:
    f.read(12)
    chunk_len, _ = struct.unpack('<I4s', f.read(8))
    data = json.loads(f.read(chunk_len))
    
    accessors = data.get('accessors', [])
    for m_idx, m in enumerate(data.get('meshes', [])):
        for p in m.get('primitives', []):
            pos_idx = p['attributes'].get('POSITION')
            acc = accessors[pos_idx]
            print(f"Mesh {m_idx} POSITION: min={acc['min']}, max={acc['max']}")
