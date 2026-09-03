import json

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

nodes = data.get('nodes', [])
for i, n in enumerate(nodes):
    name = n.get('name', '')
    if 'track' not in name.lower() and 'wheel' not in name.lower() and 'roller' not in name.lower():
        print(f'[{i:3d}] "{name}" mesh={n.get("mesh")} trans={n.get("translation")}')
