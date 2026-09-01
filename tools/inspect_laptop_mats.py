import json, struct

with open('assets/hp_omen_laptop.glb', 'rb') as f:
    f.read(12)
    chunk_len, _ = struct.unpack('<I4s', f.read(8))
    data = json.loads(f.read(chunk_len))
    
    nodes = data.get('nodes', [])
    meshes = data.get('meshes', [])
    materials = data.get('materials', [])
    
    for idx, node in enumerate(nodes):
        mesh_idx = node.get('mesh')
        if mesh_idx is not None:
            m = meshes[mesh_idx]
            prims = m.get('primitives', [])
            mat_indices = [p.get('material') for p in prims]
            mat_names = [materials[i].get('name') if i is not None else 'none' for i in mat_indices]
            print(f"Node [{idx}] '{node.get('name')}' -> Mesh [{mesh_idx}] -> Mats: {mat_names}")
