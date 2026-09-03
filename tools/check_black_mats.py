import json, struct

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.seek(12)
    chunk_len, _ = struct.unpack('<I4s', f.read(8))
    gltf = json.loads(f.read(chunk_len))
    for i, m in enumerate(gltf['materials']):
        pbr = m.get('pbrMetallicRoughness', {})
        bcf = pbr.get('baseColorFactor')
        if bcf and max(bcf[:3]) < 0.2:
            print(f'Material {i} ("{m.get("name")}"): baseColorFactor={bcf}, hasMap={bool(pbr.get("baseColorTexture"))}')
