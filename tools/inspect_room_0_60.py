import json, struct

def inspect_nodes(path):
    with open(path, 'rb') as f:
        magic = f.read(4)
        version, length = struct.unpack('<II', f.read(8))
        chunk_length, chunk_type = struct.unpack('<II', f.read(8))
        json_data = f.read(chunk_length)
        data = json.loads(json_data.decode('utf-8'))
        
        print('GLTF Version:', version)
        print('Animations:', [a.get('name', f'anim_{i}') for i, a in enumerate(data.get('animations', []))])
        
        nodes = data.get('nodes', [])
        for i in range(min(60, len(nodes))):
            n = nodes[i]
            print(f'[{i}] "{n.get("name","")}" trans={n.get("translation")} children={n.get("children")}')

inspect_nodes('assets/futuristic_room.glb')
