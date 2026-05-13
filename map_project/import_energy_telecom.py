"""
Fetches Ethiopian power line / energy infrastructure from OpenStreetMap
via the Overpass API and imports it into the eth_energy_telecom PostGIS table.
"""
import json
import os
import psycopg2
import urllib.request
import urllib.parse

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5433/map_project_db"
)

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Fetch all power lines in Ethiopia bounding box
QUERY = """
[out:json][timeout:120];
(
  way["power"="line"](3.4,33.0,15.0,48.0);
  way["power"="minor_line"](3.4,33.0,15.0,48.0);
  way["power"="cable"](3.4,33.0,15.0,48.0);
);
out geom;
"""


def fetch_overpass():
    data = urllib.parse.urlencode({"data": QUERY}).encode()
    req = urllib.request.Request(OVERPASS_URL, data=data)
    req.add_header("Content-Type", "application/x-www-form-urlencoded")
    req.add_header("User-Agent", "EthiopiaMapProject/1.0 (data import script)")
    with urllib.request.urlopen(req, timeout=180) as resp:
        return json.loads(resp.read().decode())


def parse_dsn(url: str):
    # postgresql://user:pass@host:port/dbname
    url = url.replace("postgresql://", "").replace("postgres://", "")
    userpass, rest = url.split("@", 1)
    user, password = userpass.split(":", 1)
    hostport, dbname = rest.split("/", 1)
    if ":" in hostport:
        host, port = hostport.split(":", 1)
    else:
        host, port = hostport, "5432"
    return dict(host=host, port=int(port), dbname=dbname, user=user, password=password)


def main():
    print("Fetching power line data from Overpass API...")
    result = fetch_overpass()
    elements = result.get("elements", [])
    print(f"  Got {len(elements)} ways")

    conn = psycopg2.connect(**parse_dsn(DATABASE_URL))
    cur = conn.cursor()

    cur.execute("TRUNCATE eth_energy_telecom RESTART IDENTITY;")

    inserted = 0
    for el in elements:
        if el.get("type") != "way":
            continue
        geometry = el.get("geometry", [])
        if len(geometry) < 2:
            continue

        tags = el.get("tags", {})
        name = tags.get("name") or tags.get("name:en")
        power = tags.get("power")
        voltage = tags.get("voltage")
        operator = tags.get("operator")
        osm_id = el.get("id")

        # Build WKT LineString
        coords = ", ".join(f"{pt['lon']} {pt['lat']}" for pt in geometry)
        wkt = f"MULTILINESTRING(({coords}))"

        cur.execute(
            """
            INSERT INTO eth_energy_telecom (name, power, voltage, operator, osm_id, geom)
            VALUES (%s, %s, %s, %s, %s, ST_GeomFromText(%s, 4326))
            """,
            (name, power, voltage, operator, osm_id, wkt),
        )
        inserted += 1

    conn.commit()
    cur.close()
    conn.close()
    print(f"Imported {inserted} power line segments into eth_energy_telecom.")


if __name__ == "__main__":
    main()
