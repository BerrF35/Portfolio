import json, struct
from tools.find_white_wall import compute_world_matrix, nodes, accessors, meshes, materials

# Let's check which surfaces in the room have white / light color
for n_idx, n in enumerate(nodes):
    mesh_idx = n.get('mesh')
    if mesh_idx is not None:
        name = n.get('name', '')
        if any(w in name.lower() for w in ['wall', 'panel', 'door', 'floor']):
            print(f"Node [{n_idx}] '{name}'")
