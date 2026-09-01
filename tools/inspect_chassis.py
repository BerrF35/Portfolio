import json, struct

def inspect_nodes(path):
    print(f"\n==================== {path} ====================")
    with open(path, 'rb') as f:
        magic, ver, length = struct.unpack('<4sII', f.read(12))
        chunk_len, chunk_type = struct.unpack('<I4s', f.read(8))
        data = json.loads(f.read(chunk_len))
        
        print("MATERIALS:")
        for idx, m in enumerate(data.get('materials', [])):
            print(f"  [{idx}] {m.get('name')}")
            
        print("\nMESHES:")
        for idx, m in enumerate(data.get('meshes', [])):
            print(f"  [{idx}] {m.get('name')}")

        print("\nNODES:")
        for idx, n in enumerate(data.get('nodes', [])):
            print(f"  [{idx}] {n.get('name')} (mesh: {n.get('mesh')}, children: {n.get('children')})")

inspect_nodes("assets/chassis.glb")
inspect_nodes("assets/hp_omen_laptop.glb")
