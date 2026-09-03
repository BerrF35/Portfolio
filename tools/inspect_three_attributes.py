import urllib.request

url = 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js'
with urllib.request.urlopen(url) as resp:
    lines = resp.read().decode('utf-8').split('\n')

for i in range(13420, 13460):
    print(f'{i+1}: {lines[i]}')
