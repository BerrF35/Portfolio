import json, struct

def inspect_glb(path):
    with open(path, 'rb') as f:
        magic = f.read(4)
        version, length = struct.unpack('<II', f.read(8))
        chunk_length, chunk_type = struct.unpack('<II', f.read(8))
        json_data = f.read(chunk_length)
        data = json.loads(json_data.decode('utf-8'))
        
        print('GLTF Version:', version)
        print('Animations:', [a.get('name', f'anim_{i}') for i, a in enumerate(data.get('animations', []))])
        print('Nodes count:', len(data.get('nodes', [])))
        print('Meshes count:', len(data.get('meshes', [])))
        
        nodes = data.get('nodes', [])
        print('\n--- ALL NODE NAMES ---')
        for i, n in enumerate(nodes):
            name = n.get('name', '')
            trans = n.get('translation', None)
            rot = n.get('rotation', None)
            scale = n.get('scale', None)
            mesh = n.get('mesh', None)
            children = n.get('children', None)
            print(f'[{i}] "{name}" mesh={mesh} trans={trans} rot={rot} scale={scale} children={children}')

if __name__ == '__main__':
    inspect_glb('assets/futuristic_room.glb')
