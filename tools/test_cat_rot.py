import json, struct, math

with open('assets/3d_modelling_my_cat_fripouille.glb', 'rb') as f:
    f.read(12)
    chunk_len, _ = struct.unpack('<I4s', f.read(8))
    data = json.loads(f.read(chunk_len))
    
    # Mesh 1 is the main body
    m = data['meshes'][1]
    pos_idx = m['primitives'][0]['attributes']['POSITION']
    acc = data['accessors'][pos_idx]
    print(f"Cat Body Raw Bounds: min={acc['min']}, max={acc['max']}")
