import json

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

anims = data.get('animations', [])
print(f'Total animations: {len(anims)}')
for i, a in enumerate(anims):
    print(f'Animation [{i}]: "{a.get("name")}" channels={len(a.get("channels", []))}')
    for c in a.get('channels', []):
        target = c.get('target', {})
        node_idx = target.get('node')
        node_name = data['nodes'][node_idx].get('name') if node_idx is not None else 'None'
        print(f'   Target node [{node_idx}] "{node_name}" path="{target.get("path")}"')
