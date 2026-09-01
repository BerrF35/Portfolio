models = {
    'laptop': (0.0, 0.05, 0.52, 0.45),
    'robot': (-0.82, 0.05, 0.44, 0.18),
    'camera': (-0.46, 0.28, 0.16, 0.16),
    'mouse': (0.45, 0.18, 0.08, 0.12),
    'raspberry': (0.44, -0.18, 0.14, 0.11),
    'esp32': (0.76, -0.15, 0.12, 0.06),
    'cat': (0.92, 0.12, 0.26, 0.15),
}

for k1 in sorted(models.keys()):
    for k2 in sorted(models.keys()):
        if k1 >= k2:
            continue
        v1 = models[k1]
        v2 = models[k2]
        dx = abs(v1[0] - v2[0]) - (v1[2] + v2[2]) / 2
        dz = abs(v1[1] - v2[1]) - (v1[3] + v2[3]) / 2
        is_clear = dx > 0.02 or dz > 0.02
        status = 'CLEAR' if is_clear else 'OVERLAP'
        print(f'{k1:9} <-> {k2:9}: x_gap={dx:+.3f}m, z_gap={dz:+.3f}m -> {status}')
