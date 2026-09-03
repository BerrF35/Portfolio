import json

with open('assets/jaijitesh_room.glb', 'rb') as f:
    f.read(12)
    chunk_len = int.from_bytes(f.read(4), 'little')
    f.read(4)
    data = json.loads(f.read(chunk_len).decode('utf-8'))

extensions = data.get('extensions', {})
print('Extensions used:', data.get('extensionsUsed', []))
print('Extensions required:', data.get('extensionsRequired', []))
if 'KHR_lights_punctual' in extensions:
    print('Lights:', extensions['KHR_lights_punctual'])
else:
    print('No KHR_lights_punctual in GLB root')
