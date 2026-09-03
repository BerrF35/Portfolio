with open('app.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print('Total lines in app.js:', len(lines))
# print main sections
for i, line in enumerate(lines):
    if line.startswith('// ===') or 'function ' in line and line.startswith('function'):
        print(f'L{i+1}: {line.strip()[:80]}')
