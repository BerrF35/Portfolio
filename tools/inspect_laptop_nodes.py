import json, struct

with open('assets/hp_omen_laptop.glb', 'rb') as f:
    f.read(12)
    chunk_len, _ = struct.unpack('<I4s', f.read(8))
    data = json.loads(f.read(chunk_len))
    
    nodes = data.get('nodes', [])
    for idx, n in enumerate(nodes):
        print(f"Node [{idx}] '{n.get('name')}' -> mesh: {n.get('mesh')}, children: {n.get('children')}, trans: {n.get('translation')}, rot: {n.get('rotation')}")
