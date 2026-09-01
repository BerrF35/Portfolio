import json, struct

with open('assets/esp32.glb', 'rb') as f:
    f.read(12)
    chunk_len, _ = struct.unpack('<I4s', f.read(8))
    data = json.loads(f.read(chunk_len))
    
    accessors = data.get('accessors', [])
    for idx, acc in enumerate(accessors):
        if 'min' in acc and 'max' in acc:
            print(f"Accessor [{idx}]: min={acc['min']}, max={acc['max']}")
