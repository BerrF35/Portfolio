import json

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

nodes = data.get('nodes', [])
meshes = data.get('meshes', [])
materials = data.get('materials', [])

print("=== ALL MATERIALS ===")
for i, m in enumerate(materials):
    print(f'Mat [{i:3d}] {m.get("name")}')
