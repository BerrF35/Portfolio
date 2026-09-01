import json, struct

def inspect_mouse():
    path = "assets/ice_claw_mouse.glb"
    print(f"\n==================== MOUSE ({path}) ====================")
    try:
        with open(path, 'rb') as f:
            f.read(12)
            chunk_len, _ = struct.unpack('<I4s', f.read(8))
            data = json.loads(f.read(chunk_len))
            
            print("MATERIALS:", len(data.get('materials', [])))
            print("NODES:", len(data.get('nodes', [])))
            for idx, node in enumerate(data.get('nodes', [])[:10]):
                print(f"  [{idx}] {node.get('name')} (mesh: {node.get('mesh')})")
            
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
            print(f"Size: {size}")
            print(f"Max Dim: {max(size)}")
    except Exception as e:
        print("Error:", e)

inspect_mouse()
