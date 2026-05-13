import struct

GRI_PATH = "/home/yordanos/Downloads/ETH_cov/ETH_cov.gri"
COLS, ROWS = 1824, 1416

valid_count = 0
distribution = {}

with open(GRI_PATH, "rb") as f:
    for row_idx in range(ROWS):
        raw = f.read(COLS)
        if len(raw) < COLS:
            break
        # Unpack as unsigned bytes
        values = struct.unpack(f"<{COLS}B", raw)
        for val in values:
            if val != 0 and val != 255:  # usually 0 or 255 is NoData in byte rasters
                valid_count += 1
                distribution[val] = distribution.get(val, 0) + 1

print(f"Total valid pixels: {valid_count}")
for k, v in sorted(distribution.items()):
    print(f"Class {k}: {v} points")
