import json

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

images = data.get('images', [])
buffer_views = data.get('bufferViews', [])
buffers = data.get('buffers', [])

image_bytes = 0
for img in images:
    bv_idx = img.get('bufferView')
    if bv_idx is not None:
        image_bytes += buffer_views[bv_idx].get('byteLength', 0)

total_bytes = buffers[0].get('byteLength', 0)
geom_bytes = total_bytes - image_bytes
print(f'Total binary: {total_bytes / (1024*1024):.2f} MB')
print(f'Images total: {image_bytes / (1024*1024):.2f} MB ({len(images)} images)')
print(f'Geometry/other: {geom_bytes / (1024*1024):.2f} MB')
