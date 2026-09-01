import math

DESK_W = 2.8
DESK_D = 1.3
DESK_H = 0.80

objects = {
    'laptop': {'x': 0, 'z': 0.05, 'ground': 'desk'},
    'robot': {'x': -0.68, 'z': 0.08, 'ground': 'desk'},
    'camera': {'x': -0.28, 'z': 0.26, 'ground': 'desk'},
    'raspberry': {'x': 0.48, 'z': -0.06, 'ground': 'desk'},
    'esp32': {'x': 0.76, 'z': 0.06, 'ground': 'desk'},
    'cat': {'x': 0.98, 'z': 0.18, 'ground': 'desk'},
    'dog': {'x': -1.35, 'z': 1.05, 'ground': 'floor'},
    'telescope': {'x': 1.55, 'z': 0.75, 'ground': 'floor'}
}

print('Verifying object positions on 2.8m x 1.3m desk:')
for k, v in objects.items():
    if v['ground'] == 'desk':
        in_x = abs(v['x']) < DESK_W / 2
        in_z = abs(v['z']) < DESK_D / 2
        margin_x = (DESK_W / 2) - abs(v['x'])
        margin_z = (DESK_D / 2) - abs(v['z'])
        print(f"  {k:10}: x={v['x']:+.2f}, z={v['z']:+.2f} | Inside desk? {in_x and in_z} (margins: x={margin_x:.2f}m, z={margin_z:.2f}m)")
    else:
        print(f"  {k:10}: x={v['x']:+.2f}, z={v['z']:+.2f} | Grounded on floor")
