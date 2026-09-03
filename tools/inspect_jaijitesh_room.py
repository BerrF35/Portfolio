import json, struct

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

scenes = data.get('scenes', [])
nodes = data.get('nodes', [])
default_scene = data.get('scene', 0)
root_nodes = scenes[default_scene].get('nodes', [])

print(f'Root nodes count: {len(root_nodes)}')
for r in root_nodes:
    n = nodes[r]
    print(f'Root [{r:3d}] "{n.get("name")}" children={len(n.get("children", [])) if n.get("children") else 0} mesh={n.get("mesh")}')

print('\n=== KEY OBJECT SEARCH ===')
keywords = ['fan', 'cat', 'dog', 'laptop', 'omen', 'screen', 'monitor', 'switch', 'door', 'camera', 'city', 'esp', 'pi', 'raspberry', 'bot', 'chassis', 'window', 'light', 'button']
for i, n in enumerate(nodes):
    name = n.get('name', '').lower()
    for kw in keywords:
        if kw in name:
            print(f'Match "{kw}": [{i}] "{n.get("name")}" trans={n.get("translation")} rot={n.get("rotation")} scale={n.get("scale")}')
            break
