import json
import struct
import re

with open('assets/jaijitesh_room.glb', 'rb') as f:
    magic, ver, length = struct.unpack('<4sII', f.read(12))
    chunk_len, chunk_type = struct.unpack('<I4s', f.read(8))
    json_bytes = f.read(chunk_len)
    gltf = json.loads(json_bytes)
    nodes = gltf.get('nodes', [])
    for i, n in enumerate(nodes):
        name = n.get('name', '')
        if re.search(r'cam|canon', name, re.I):
            print(f'Node {i}: name="{name}", mesh={n.get("mesh")}, children={n.get("children")}')
