import json, struct

with open('assets/3d_modelling_my_cat_fripouille.glb', 'rb') as f:
    f.read(12)
    chunk_len, _ = struct.unpack('<I4s', f.read(8))
    data = json.loads(f.read(chunk_len))
    
    nodes = data.get('nodes', [])
    for idx, n in enumerate(nodes[:10]):
        print(f"Node [{idx}] '{n.get('name')}' -> rot: {n.get('rotation')}, scale: {n.get('scale')}, trans: {n.get('translation')}")
