import json

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))
    bin_header = f.read(8)
    bin_len = int.from_bytes(bin_header[:4], 'little')
    bin_data = f.read(bin_len)

print(f'Binary chunk size: {len(bin_data)} bytes')

buffers = data.get('buffers', [])
buffer_views = data.get('bufferViews', [])
accessors = data.get('accessors', [])

print(f'Buffers: {len(buffers)}, BufferViews: {len(buffer_views)}, Accessors: {len(accessors)}')

for i, bv in enumerate(buffer_views):
    offset = bv.get('byteOffset', 0)
    length = bv.get('byteLength', 0)
    if offset + length > len(bin_data):
        print(f'BufferView [{i}] OUT OF BOUNDS! offset={offset}, length={length}, max={len(bin_data)}')

for i, acc in enumerate(accessors):
    bv_idx = acc.get('bufferView')
    if bv_idx is None:
        print(f'Accessor [{i}] has None bufferView!')
    else:
        bv = buffer_views[bv_idx]
        offset = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
        # check type and componentType
        count = acc.get('count', 0)
        if count == 0:
            print(f'Accessor [{i}] count == 0!')
