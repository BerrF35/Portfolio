import json, struct

def inspect_model(name, path):
    print(f"\n==================== {name} ({path}) ====================")
    with open(path, 'rb') as f:
        magic, ver, length = struct.unpack('<4sII', f.read(12))
        chunk_len, chunk_type = struct.unpack('<I4s', f.read(8))
        data = json.loads(f.read(chunk_len))
        
        print("MATERIALS:")
        materials = data.get('materials', [])
        for idx, mat in enumerate(materials):
            print(f"  [{idx}] {mat.get('name')}")
            
        print("NODES:")
        nodes = data.get('nodes', [])
        for idx, node in enumerate(nodes):
            print(f"  [{idx}] {node.get('name')} (mesh: {node.get('mesh')}, children: {node.get('children')})")

inspect_model("OFFICE DESK", "assets/office_desk.glb")
inspect_model("HP OMEN", "assets/hp_omen_laptop.glb")
inspect_model("RASPBERRY PI", "assets/raspberry.glb")
inspect_model("ESP32", "assets/esp32.glb")
inspect_model("CHASSIS", "assets/chassis.glb")
