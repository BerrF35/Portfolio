import json, struct

def inspect_model(name, path):
    print(f"\n==================== {name} ({path}) ====================")
    try:
        with open(path, 'rb') as f:
            magic, ver, length = struct.unpack('<4sII', f.read(12))
            chunk_len, chunk_type = struct.unpack('<I4s', f.read(8))
            data = json.loads(f.read(chunk_len))
            
            print("MATERIALS:", len(data.get('materials', [])))
            print("NODES:", len(data.get('nodes', [])))
            for idx, node in enumerate(data.get('nodes', [])[:12]):
                print(f"  [{idx}] {node.get('name')} (mesh: {node.get('mesh')}, children: {node.get('children')})")
    except Exception as e:
        print("Error inspecting:", e)

inspect_model("BERRY DOG", "assets/full_body_shepherd_dog_meshy.glb")
inspect_model("CRISPY CAT", "assets/3d_modelling_my_cat_fripouille.glb")
inspect_model("STUDIO SETUP", "assets/studio_setup.glb")
inspect_model("CAMERA", "assets/canon_at-1_retro_camera.glb")
inspect_model("TELESCOPE", "assets/telescope.glb")
