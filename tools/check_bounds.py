import json, struct

def get_mesh_bounds(path):
    print(f"\n==================== BOUNDS FOR {path} ====================")
    with open(path, 'rb') as f:
        magic, ver, length = struct.unpack('<4sII', f.read(12))
        chunk_len, chunk_type = struct.unpack('<I4s', f.read(8))
        data = json.loads(f.read(chunk_len))
        
        accessors = data.get('accessors', [])
        for i, acc in enumerate(accessors):
            if 'min' in acc and 'max' in acc and len(acc['min']) == 3:
                # position accessor
                pass
        
        # print node names and meshes
        for n in data.get('nodes', []):
            if n.get('name'):
                print("  Node:", n.get('name'))

get_mesh_bounds("assets/office_desk.glb")
get_mesh_bounds("assets/hp_omen_laptop.glb")
get_mesh_bounds("assets/raspberry.glb")
get_mesh_bounds("assets/esp32.glb")
get_mesh_bounds("assets/chassis.glb")
