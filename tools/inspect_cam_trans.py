import json
import struct

with open('assets/jaijitesh_room.glb', 'rb') as f:
    magic, ver, length = struct.unpack('<4sII', f.read(12))
    chunk_len, chunk_type = struct.unpack('<I4s', f.read(8))
    json_bytes = f.read(chunk_len)
    gltf = json.loads(json_bytes)
    nodes = gltf.get('nodes', [])
    for idx in [129, 130, 174, 175, 176, 185, 187]:
        n = nodes[idx]
        print(f"Node {idx} ({n.get('name')}): translation={n.get('translation')}, scale={n.get('scale')}")
    
    for i, n in enumerate(nodes):
        if n.get('children') and 187 in n['children']:
            print(f"Parent of 187 is Node {i}: {n.get('name')}, translation={n.get('translation')}, scale={n.get('scale')}")

