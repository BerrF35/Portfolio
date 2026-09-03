import json

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

nodes = data.get('nodes', [])

def print_tree(idx, indent=0):
    n = nodes[idx]
    name = n.get('name', '')
    mesh = n.get('mesh')
    children = n.get('children', [])
    trans = n.get('translation')
    print('  '*indent + f'[{idx}] "{name}" mesh={mesh} trans={trans}')
    for c in (children or []):
        print_tree(c, indent+1)

sketchfab_roots = [147, 152, 173, 188, 192, 195, 229, 369]
for r in sketchfab_roots:
    print(f'\n=== ROOT {r} ===')
    print_tree(r)
