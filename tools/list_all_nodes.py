import json, struct

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.seek(12)
    chunk_len, _ = struct.unpack('<I4s', f.read(8))
    gltf = json.loads(f.read(chunk_len))
    for i, n in enumerate(gltf['nodes']):
        print(f"{i}: {n.get('name')}")
