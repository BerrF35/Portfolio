import json

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

nodes = data.get('nodes', [])
materials = data.get('materials', [])

print("=== NODES 0 TO 50 ===")
for i in range(50):
    n = nodes[i]
    print(f'[{i:3d}] "{n.get("name")}" mesh={n.get("mesh")} children={n.get("children")}')

print("\n=== SEARCHING FOR CAT, SWITCH, BUTTON ===")
for i, n in enumerate(nodes):
    name = n.get('name', '').lower()
    for kw in ['cat', 'switch', 'button', 'world', 'object_7', 'object_9', 'asset3d']:
        if kw in name:
            print(f'Match "{kw}": [{i}] "{n.get("name")}" mesh={n.get("mesh")} trans={n.get("translation")} rot={n.get("rotation")} scale={n.get("scale")}')
            break

print("\n=== CHECKING ROOT 0 Asset3DLoader.sceneRoot ===")
def print_tree(idx, indent=0):
    n = nodes[idx]
    print('  '*indent + f'[{idx}] "{n.get("name")}" mesh={n.get("mesh")} trans={n.get("translation")}')
    for c in (n.get('children') or []):
        print_tree(c, indent+1)

print_tree(0)
