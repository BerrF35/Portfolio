import json, struct

def inspect_model_detailed(name, path):
    print(f"\n==================== {name} ({path}) ====================")
    try:
        with open(path, 'rb') as f:
            f.read(12)
            chunk_len, _ = struct.unpack('<I4s', f.read(8))
            data = json.loads(f.read(chunk_len))
            
            accessors = data.get('accessors', [])
            min_p = [float('inf')]*3
            max_p = [float('-inf')]*3
            
            for m in data.get('meshes', []):
                for prim in m.get('primitives', []):
                    pos_idx = prim['attributes'].get('POSITION')
                    if pos_idx is not None:
                        acc = accessors[pos_idx]
                        if 'min' in acc and 'max' in acc:
                            for i in range(3):
                                min_p[i] = min(min_p[i], acc['min'][i])
                                max_p[i] = max(max_p[i], acc['max'][i])
            
            size = [max_p[i] - min_p[i] for i in range(3)]
            center = [(max_p[i] + min_p[i])/2 for i in range(3)]
            print(f"Size: {size}")
            print(f"Center: {center}")
            print(f"Max Dimension: {max(size)}")
            print(f"Meshes count: {len(data.get('meshes', []))}")
            print(f"Materials count: {len(data.get('materials', []))}")
    except Exception as e:
        print("Error:", e)

inspect_model_detailed("STUDIO SETUP", "assets/studio_setup.glb")
inspect_model_detailed("BOOKS COLLECTION", "assets/sci-fi_hardcover_book_collection.glb")
