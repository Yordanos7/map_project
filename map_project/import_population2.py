"""
Phase 2 only: COPY the csv into the already-created eth_population table.
"""
import subprocess, os

PSQL_CMD = ["psql", "-h", "localhost", "-p", "5433", "-U", "postgres", "-d", "map_project_db"]
CSV_PATH  = "/tmp/eth_pop_points.csv"
SQL_FILE  = "/tmp/eth_pop_import.sql"

# verify CSV exists
count = sum(1 for _ in open(CSV_PATH))
print(f"CSV has {count:,} rows")

# write SQL file
with open(SQL_FILE, "w") as f:
    f.write("BEGIN;\n")
    f.write("CREATE TEMP TABLE eth_pop_stage (population INTEGER, lon DOUBLE PRECISION, lat DOUBLE PRECISION);\n")
    f.write(f"\\COPY eth_pop_stage FROM '{CSV_PATH}' WITH (FORMAT csv);\n")
    f.write("INSERT INTO eth_population (population, lon, lat, geom) "
            "SELECT population, lon, lat, ST_SetSRID(ST_MakePoint(lon, lat), 4326) "
            "FROM eth_pop_stage;\n")
    f.write("COMMIT;\n")
    f.write("SELECT COUNT(*) FROM eth_population;\n")

env = dict(os.environ, PGPASSWORD="postgres")
result = subprocess.run(
    PSQL_CMD + ["-f", SQL_FILE],
    capture_output=True, text=True, env=env
)
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr[:500])
