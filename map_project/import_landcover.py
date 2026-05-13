import struct
import subprocess
import os

# ── VRT metadata (from ETH_cov.vrt) ──────────────────────────────────────────
GRI_PATH = "/home/yordanos/Downloads/ETH_cov/ETH_cov.gri"
ORIGIN_X, PIXEL_W = 32.9,  0.008333333
ORIGIN_Y, PIXEL_H = 15.0, -0.008333333
COLS, ROWS        = 1824, 1416
DTYPE_SIZE        = 1

STRIDE = 6  # Downsample by taking 1 in every 6 pixels (1/36th total)

# ── DB connection ─────────────────────────────────────────────────────────────
PSQL = "PGPASSWORD=postgres psql -h localhost -p 5433 -U postgres -d map_project_db"

def run_sql(sql):
    proc = subprocess.run(
        f'echo "{sql}" | {PSQL}',
        shell=True, capture_output=True, text=True
    )
    if proc.returncode != 0:
        print("SQL ERROR:", proc.stderr)
    return proc.stdout

# ── 1. Create table ──────────────────────────────────────────────────────────
print("Creating table eth_landcover...")
run_sql("DROP TABLE IF EXISTS eth_landcover;")
run_sql("""
CREATE TABLE eth_landcover (
    gid         SERIAL PRIMARY KEY,
    cover_class INTEGER,
    lon         DOUBLE PRECISION,
    lat         DOUBLE PRECISION,
    geom        geometry(Point, 4326)
);
""")

# ── 2. Read raster row by row, generate CSV, bulk COPY ─────────────────────
CSV_PATH = "/tmp/eth_landcover_points.csv"
inserted = 0

with open(GRI_PATH, "rb") as f, open(CSV_PATH, "w") as csv:
    for row_idx in range(ROWS):
        raw = f.read(COLS * DTYPE_SIZE)
        if len(raw) < COLS * DTYPE_SIZE:
            break
            
        # Only process rows mod STRIDE
        if row_idx % STRIDE != 0:
            continue
            
        values = struct.unpack(f"<{COLS}B", raw)
        for col_idx in range(0, COLS, STRIDE):
            val = values[col_idx]
            if val == 0 or val == 255: # Assuming NoData/Border
                continue
                
            lon = ORIGIN_X + (col_idx + 0.5) * PIXEL_W
            lat = ORIGIN_Y + (row_idx + 0.5) * PIXEL_H
            csv.write(f"{val},{lon:.6f},{lat:.6f}\n")
            inserted += 1

print(f"Generated {inserted:,} sampled landcover points → {CSV_PATH}")

# ── 3. COPY CSV into staging table, then apply ST_MakePoint ──────────────────
print("Importing into PostgreSQL...")
stage_sql = """
CREATE TEMP TABLE eth_lc_stage (cover_class INTEGER, lon DOUBLE PRECISION, lat DOUBLE PRECISION);
\\COPY eth_lc_stage FROM '/tmp/eth_landcover_points.csv' WITH (FORMAT csv);
INSERT INTO eth_landcover (cover_class, lon, lat, geom)
  SELECT cover_class, lon, lat, ST_SetSRID(ST_MakePoint(lon, lat), 4326)
  FROM eth_lc_stage;
"""

proc = subprocess.run(
    PSQL, shell=True, input=stage_sql, capture_output=True, text=True
)
if proc.stderr:
    print("STDERR:", proc.stderr[-500:])

# ── 4. Spatial index ──────────────────────────────────────────────────────────
print("Creating spatial index...")
run_sql("CREATE INDEX eth_landcover_geom_idx ON eth_landcover USING GIST(geom);")

# verify
result = run_sql("SELECT COUNT(*) FROM eth_landcover;")
print("Verification count:", result.strip())
