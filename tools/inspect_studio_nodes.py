import json, struct

with open('assets/studio_setup.glb', 'rb') as f:
    f.read(12)
    chunk_len, _ = struct.unpack('<I4s', f.read(8))
    data = json.loads(f.read(chunk_len))
    
    nodes = data.get('nodes', [])
    root_children = nodes[3].get('children', [])
    for idx in root_children:
        print(f"Child [{idx}]: {nodes[idx].get('name')}")
