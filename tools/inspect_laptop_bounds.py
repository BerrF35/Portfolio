import json, struct

with open('assets/hp_omen_laptop.glb', 'rb') as f:
    f.read(12)
    chunk_len, _ = struct.unpack('<I4s', f.read(8))
    data = json.loads(f.read(chunk_len))
    
    accessors = data.get('accessors', [])
    meshes = data.get('meshes', [])
    for idx, m in enumerate(meshes):
        pos_acc_idx = m['primitives'][0]['attributes']['POSITION']
        pos_acc = accessors[pos_acc_idx]
        print(f"Mesh [{idx}] '{m.get('name')}' -> min={pos_acc.get('min')}, max={pos_acc.get('max')}")
