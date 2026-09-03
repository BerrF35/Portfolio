import json

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

nodes = data.get('nodes', [])
for i in range(50, 147):
    n = nodes[i]
    if n.get('mesh') is not None or n.get('children'):
        print(f'[{i:3d}] "{n.get("name")}" mesh={n.get("mesh")} trans={n.get("translation")}')
