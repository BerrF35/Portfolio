import json, struct

with open('assets/studio_setup.glb', 'rb') as f:
    f.read(12)
    chunk_len, _ = struct.unpack('<I4s', f.read(8))
    data = json.loads(f.read(chunk_len))
    
    nodes = data.get('nodes', [])
    for idx, n in enumerate(nodes):
        name = n.get('name', '')
        if any(w in name.lower() for w in ['ceiling', 'roof', 'ball', 'sphere', 'curtain', 'floor', 'umbrella', 'lamp', 'tripod', 'spot']):
            print(f"Node [{idx}]: {name}")
