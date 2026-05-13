"""
Read eth_pop raster using Python stdlib (struct) + GDAL VRT metadata,
then generate and pipe SQL directly to psql — no external packages needed.
"""
import struct
import subprocess
import os

# ── VRT metadata (from eth_pop.vrt) ──────────────────────────────────────────
GRI_PATH = "/home/yordanos/Downloads/ETH_pop/eth_pop.gri"
ORIGIN_X, PIXEL_W = 32.9,  0.03023333
ORIGIN_Y, PIXEL_H = 14.925, -0.03023003
COLS, ROWS        = 500, 384
NODATA            = -9999
DTYPE_FMT         = "<h"   # little-endian signed int16
DTYPE_SIZE        = 2       # bytes per pixel

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
print("Creating table eth_population...")
run_sql("DROP TABLE IF EXISTS eth_population;")
run_sql("""
CREATE TABLE eth_population (
    gid        SERIAL PRIMARY KEY,
    population INTEGER,
    lon        DOUBLE PRECISION,
    lat        DOUBLE PRECISION,
    geom       geometry(Point, 4326)
);
""")

# ── 2. Read raster row by row, generate CSV, bulk COPY ─────────────────────
CSV_PATH = "/tmp/eth_pop_points.csv"
inserted = 0

with open(GRI_PATH, "rb") as f, open(CSV_PATH, "w") as csv:
    for row_idx in range(ROWS):
        raw = f.read(COLS * DTYPE_SIZE)
        if len(raw) < COLS * DTYPE_SIZE:
            break
        values = struct.unpack(f"<{COLS}h", raw)
        for col_idx, val in enumerate(values):
            if val == NODATA or val <= 0:
                continue
            lon = ORIGIN_X + (col_idx + 0.5) * PIXEL_W
            lat = ORIGIN_Y + (row_idx + 0.5) * PIXEL_H
            csv.write(f"{val},{lon:.6f},{lat:.6f}\n")
            inserted += 1

print(f"Generated {inserted:,} valid population points → {CSV_PATH}")

# ── 3. COPY CSV into staging table, then apply ST_MakePoint ──────────────────
print("Importing into PostgreSQL...")
stage_sql = """
CREATE TEMP TABLE eth_pop_stage (population INTEGER, lon DOUBLE PRECISION, lat DOUBLE PRECISION);
\\COPY eth_pop_stage FROM '/tmp/eth_pop_points.csv' WITH (FORMAT csv);
INSERT INTO eth_population (population, lon, lat, geom)
  SELECT population, lon, lat, ST_SetSRID(ST_MakePoint(lon, lat), 4326)
  FROM eth_pop_stage;
"""

proc = subprocess.run(
    ["/bin/bash", "-c", f"echo {repr(stage_sql)} | {PSQL}"],
    capture_output=True, text=True
)
print(proc.stdout[-500:] if proc.stdout else "(no output)")
if proc.stderr:
    print("STDERR:", proc.stderr[-500:])

# ── 4. Spatial index ──────────────────────────────────────────────────────────
print("Creating spatial index...")
run_sql("CREATE INDEX eth_population_geom_idx ON eth_population USING GIST(geom);")

# verify
result = run_sql("SELECT COUNT(*) FROM eth_population;")
print("Verification count:", result.strip())
