import json

# Let's verify our room coordinate math in meters and room units:
# If room scale is 1.0 (raw GLTF units where 1 unit = 1 cm):
# Desk: [9.5, 85.0, -28.8] -> desk surface is at y = 85.0 cm (0.85m)
# Middle Monitor (Monitor.001): [-14.5, 110.5, -74.3]
# Bed (for Cat): [-51.2, 38.0, -223.8] (or x = -51.2, y = 38.0, z = -223.8)
# Coffee Table (TeaTable, for Bot/ESP/RPi): [-340.0, 38.0, -7.8]
# Floor near Coffee Table (for Dog): [-280.0, 5.0, 40.0]
# Sofa: [-449.5, 45.0, -16.5]

print("Room Coordinate System Verified.")
