import json, struct
import math

def parse_room_transforms(path):
    with open(path, 'rb') as f:
        magic = f.read(4)
        version, length = struct.unpack('<II', f.read(8))
        chunk_length, chunk_type = struct.unpack('<II', f.read(8))
        json_data = f.read(chunk_length)
        data = json.loads(json_data.decode('utf-8'))
        
    nodes = data.get('nodes', [])
    
    # Build parent-child map
    parent_map = {}
    for p_idx, node in enumerate(nodes):
        for c_idx in node.get('children', []):
            parent_map[c_idx] = p_idx
            
    def get_world_pos(idx):
        curr = idx
        pos = [0, 0, 0]
        chain = []
        while curr is not None:
            chain.append(curr)
            curr = parent_map.get(curr)
        chain.reverse()
        
        # Simple translation accumulation for uniform/orthogonal setups
        for n_idx in chain:
            t = nodes[n_idx].get('translation')
            if t:
                pos[0] += t[0]
                pos[1] += t[1]
                pos[2] += t[2]
        return pos, [nodes[i].get('name') for i in chain]

    print('=== KEY OBJECTS AND GLOBAL POSITIONS ===')
    targets = ['BedFrame', 'BedCover', 'TeaTable', 'Handcuffs&Bottle', 'OfficeTable', 'KeyBoard', 'Monitor.001', 'Monitor.002', 'Monitor.003', 'Monitor.004', 'Sofa', 'ChineseSoldier_low', 'Fan']
    for i, n in enumerate(nodes):
        name = n.get('name', '')
        for t in targets:
            if name == t or (name and name.startswith(t)):
                pos, chain = get_world_pos(i)
                scale = n.get('scale')
                rot = n.get('rotation')
                print(f'{name:30} -> pos={pos} (scale={scale}, rot={rot})')

if __name__ == '__main__':
    parse_room_transforms('assets/futuristic_room.glb')
