import json, struct
from PIL import Image
import io

with open('assets/futuristic_room.glb', 'rb') as f:
    f.read(12)
    chunk_length, chunk_type = struct.unpack('<II', f.read(8))
    data = json.loads(f.read(chunk_length).decode('utf-8'))
    f.read(8) # bin chunk header
    bin_data = f.read()

# Let's inspect images in the GLB
images = data.get('images', [])
textures = data.get('textures', [])
materials = data.get('materials', [])

print(f"Total images: {len(images)}")
for i, img in enumerate(images):
    bv_idx = img.get('bufferView')
    if bv_idx is not None:
        bv = data['bufferViews'][bv_idx]
        offset = bv.get('byteOffset', 0)
        length = bv['byteLength']
        img_bytes = bin_data[offset:offset+length]
        try:
            im = Image.open(io.BytesIO(img_bytes))
            print(f"Image [{i}] '{img.get('name')}': format={im.format} size={im.size} mode={im.mode}")
        except Exception as e:
            print(f"Image [{i}] error: {e}")
