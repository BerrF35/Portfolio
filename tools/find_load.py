with open('app.js', 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if '.glb' in line or 'GLTFLoader' in line or 'loadRoom' in line:
            print(f'Line {i+1}: {line.strip()[:100]}')
