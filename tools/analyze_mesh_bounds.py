import json, struct
import numpy as np

def analyze_mesh_bounds(path):
    with open(path, 'rb') as f:
        magic = f.read(4)
        version, length = struct.unpack('<II', f.read(8))
        chunk_length, chunk_type = struct.unpack('<II', f.read(8))
        json_data = f.read(chunk_length)
        data = json.loads(json_data.decode('utf-8'))
        bin_header = f.read(8) # chunk_length, chunk_type for BIN
        bin_data = f.read()

    accessors = data.get('accessors', [])
    buffer_views = data.get('bufferViews', [])
    nodes = data.get('nodes', [])
    meshes = data.get('meshes', [])

    print('=== MESH BOUNDING BOXES (LOCAL ACCESSOR MIN/MAX) ===')
    for m_idx, mesh in enumerate(meshes):
        name = mesh.get('name', f'Mesh_{m_idx}')
        prims = mesh.get('primitives', [])
        for p in prims:
            pos_acc_idx = p.get('attributes', {}).get('POSITION')
            if pos_acc_idx is not None:
                acc = accessors[pos_acc_idx]
                min_v = acc.get('min')
                max_v = acc.get('max')
                print(f'[{m_idx}] {name:30} min={min_v} max={max_v}')

if __name__ == '__main__':
    analyze_mesh_bounds('assets/futuristic_room.glb')
