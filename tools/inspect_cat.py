import struct, json

with open('assets/3d_modelling_my_cat_fripouille.glb', 'rb') as f:
    magic, version, length = struct.unpack('<4sII', f.read(12))
    chunk_len, chunk_type = struct.unpack('<II', f.read(8))
    json_data = json.loads(f.read(chunk_len).decode('utf-8'))
    bin_chunk_len, bin_chunk_type = struct.unpack('<II', f.read(8))
    bin_data = f.read(bin_chunk_len)

    print('Nodes in cat model:')
    for i, n in enumerate(json_data.get('nodes', [])):
        print(f"  Node {i}: {n.get('name')}, rot={n.get('rotation')}, scale={n.get('scale')}, trans={n.get('translation')}, mesh={n.get('mesh')}")

    print('\nAccessors in cat model:')
    for i, acc in enumerate(json_data.get('accessors', [])):
        if acc.get('type') == 'VEC3' and 'min' in acc:
            print(f"  Acc {i}: min={acc.get('min')}, max={acc.get('max')}")
