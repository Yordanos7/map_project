import prisma from "@map_project/db";
import { publicProcedure, router } from "../index";

export const mapRouter = router({
    /**
     * Returns all Ethiopian Roads as a GeoJSON FeatureCollection.
     * The geometry is unpacked from PostGIS using ST_AsGeoJSON so Leaflet
     * can consume it directly.
     */
    getRoads: publicProcedure.query(async () => {
        const rows = await prisma.$queryRaw<
            Array<{
                gid: number;
                med_descri: string | null;
                rtt_descri: string | null;
                f_code_des: string | null;
                iso: string | null;
                isocountry: string | null;
                geojson: string;
            }>
        >`
      SELECT
        gid,
        med_descri,
        rtt_descri,
        f_code_des,
        iso,
        isocountry,
        ST_AsGeoJSON(geom)::text AS geojson
      FROM eth_roads
      WHERE geom IS NOT NULL
    `;

        const features = rows.map((row) => ({
            type: "Feature" as const,
            geometry: JSON.parse(row.geojson),
            properties: {
                gid: row.gid,
                med_descri: row.med_descri,
                rtt_descri: row.rtt_descri,
                f_code_des: row.f_code_des,
                iso: row.iso,
                isocountry: row.isocountry,
            },
        }));

        return {
            type: "FeatureCollection" as const,
            features,
        };
    }),

    /**
     * Returns road statistics from the database for display in the UI.
     */
    getRoadStats: publicProcedure.query(async () => {
        const stats = await prisma.$queryRaw<
            Array<{ rtt_descri: string | null; count: bigint }>
        >`
      SELECT rtt_descri, COUNT(*) as count
      FROM eth_roads
      GROUP BY rtt_descri
      ORDER BY count DESC
    `;

        return stats.map((s) => ({
            roadType: s.rtt_descri ?? "Unknown",
            count: Number(s.count),
        }));
    }),

    /**
     * Returns Ethiopian population grid as GeoJSON points.
     * Sampled to every 4th point (MOD 4 = 0) for performance,
     * only cells with population ≥ 5.
     */
    getPopulation: publicProcedure.query(async () => {
        const rows = await prisma.$queryRaw<
            Array<{
                gid: number;
                population: number;
                lon: number;
                lat: number;
                geojson: string;
            }>
        >`
          SELECT
            gid,
            population,
            lon,
            lat,
            ST_AsGeoJSON(geom)::text AS geojson
          FROM eth_population
          WHERE population >= 5
            AND MOD(gid, 4) = 0
          ORDER BY population DESC
        `;

        const features = rows.map((row) => ({
            type: "Feature" as const,
            geometry: JSON.parse(row.geojson),
            properties: {
                gid: row.gid,
                population: Number(row.population),
                lon: Number(row.lon),
                lat: Number(row.lat),
            },
        }));

        const maxPop = features.reduce((m, f) => Math.max(m, f.properties.population), 0);

        return {
            type: "FeatureCollection" as const,
            features,
            meta: { total: features.length, maxPop },
        };
    }),
    /**
     * Returns the full Ethiopian population grid for the heatmap.
     * Unlike getPopulation which was downsampled GeoJSON, this returns a lightweight
     * tuple array [lat, lon, intensity] for all points so leaflet.heat can render them.
     */
    getPopulationHeatmap: publicProcedure.query(async () => {
        const rows = await prisma.$queryRaw<
            Array<{
                lat: number;
                lon: number;
                intensity: number;
            }>
        >`
          SELECT
            lat,
            lon,
            population AS intensity
          FROM eth_population
          WHERE population > 0
        `;

        // We return it exactly as [lat, lon, intensity] which Leaflet.heat expects
        return rows.map((r) => [Number(r.lat), Number(r.lon), Number(r.intensity)]);
    }),

    /**
     * Returns Ethiopian classified settlements (Cities, Towns, Villages).
     * Retrieves properties like place (hierarchy size), name, and population
     * into a standard GeoJSON FeatureCollection.
     */
    getSettlements: publicProcedure.query(async () => {
        const rows = await prisma.$queryRaw<
            Array<{
                gid: number;
                name: string | null;
                place: string | null;
                population: string | null;
                geojson: string;
            }>
        >`
          SELECT
            gid,
            name,
            place,
            population,
            ST_AsGeoJSON(geom)::text AS geojson
          FROM eth_settlements
          WHERE geom IS NOT NULL
        `;

        const features = rows.map((row) => ({
            type: "Feature" as const,
            geometry: JSON.parse(row.geojson),
            properties: {
                gid: row.gid,
                name: row.name ?? "Unknown Location",
                place: row.place ?? "village",
                population: row.population,
            },
        }));

        return {
            type: "FeatureCollection" as const,
            features,
        };
    }),

    /**
     * Returns Ethiopian Health Facilities (Hospitals, Clinics, Pharmacies).
     */
    getHealthFacilities: publicProcedure.query(async () => {
        const rows = await prisma.$queryRaw<
            Array<{
                gid: number;
                name: string | null;
                amenity: string | null;
                healthcare: string | null;
                operator_t: string | null;
                capacity_p: string | null;
                geojson: string;
            }>
        >`
          SELECT
            gid,
            name,
            amenity,
            healthcare,
            operator_t,
            capacity_p,
            ST_AsGeoJSON(geom)::text AS geojson
          FROM eth_health
          WHERE geom IS NOT NULL
        `;

        const features = rows.map((row) => ({
            type: "Feature" as const,
            geometry: JSON.parse(row.geojson),
            properties: {
                gid: row.gid,
                name: row.name ?? "Health Facility",
                amenity: row.amenity,
                healthcare: row.healthcare,
                operator: row.operator_t,
                capacity: row.capacity_p,
            },
        }));

        return {
            type: "FeatureCollection" as const,
            features,
        };
    }),

    /**
     * Returns Ethiopian Education Facilities (Schools, Universities, Kindergartens).
     */
    getEducationFacilities: publicProcedure.query(async () => {
        const rows = await prisma.$queryRaw<
            Array<{
                gid: number;
                name: string | null;
                amenity: string | null;
                operator_t: string | null;
                capacity_p: string | null;
                geojson: string;
            }>
        >`
          SELECT
            gid,
            name,
            amenity,
            operator_t,
            capacity_p,
            ST_AsGeoJSON(geom)::text AS geojson
          FROM eth_education
          WHERE geom IS NOT NULL
        `;

        const features = rows.map((row) => ({
            type: "Feature" as const,
            geometry: JSON.parse(row.geojson),
            properties: {
                gid: row.gid,
                name: row.name ?? "Educational Facility",
                amenity: row.amenity ?? "school",
                operator: row.operator_t,
                capacity: row.capacity_p,
            },
        }));

        return {
            type: "FeatureCollection" as const,
            features,
        };
    }),

    /**
     * Returns Ethiopian Land Cover Grid Points (Downsampled array).
     * Returns an optimized array: [lat, lon, cover_class]
     */
    getLandcover: publicProcedure.query(async () => {
        const rows = await prisma.$queryRaw<
            Array<{
                cover_class: number;
                lon: number;
                lat: number;
            }>
        >`
          SELECT
            cover_class,
            lon,
            lat
          FROM eth_landcover
        `;

        // We return exactly [lat, lon, class_id] to minimize JSON size over the wire
        return rows.map((r) => [Number(r.lat), Number(r.lon), Number(r.cover_class)]);
    }),

    /**
     * Returns Ethiopian Forests & Biodiversity Points directly from Land Cover.
     */
    getForests: publicProcedure.query(async () => {
        const rows = await prisma.$queryRaw<Array<{ lon: number, lat: number }>>`
          SELECT lon, lat FROM eth_landcover WHERE cover_class IN (1, 3, 8, 9)
        `;
        return rows.map((r) => [Number(r.lat), Number(r.lon)]);
    }),

    /**
     * Returns Ethiopian Inland Water Resources directly from Land Cover.
     */
    getWaterResources: publicProcedure.query(async () => {
        const rows = await prisma.$queryRaw<Array<{ lon: number, lat: number }>>`
          SELECT lon, lat FROM eth_landcover WHERE cover_class = 20
        `;
        return rows.map((r) => [Number(r.lat), Number(r.lon)]);
    }),

    /**
     * Returns Agro-Ecological Zones (Rangeland + Cropland).
     */
    getAgroEcology: publicProcedure.query(async () => {
        const rows = await prisma.$queryRaw<Array<{ cover_class: number, lon: number, lat: number }>>`
          SELECT cover_class, lon, lat FROM eth_landcover 
          WHERE cover_class IN (9, 12, 13, 14, 16, 17, 18)
        `;
        return rows.map((r) => [Number(r.lat), Number(r.lon), Number(r.cover_class)]);
    }),

    /**
     * Returns Crop Distribution exclusively (Agriculture).
     */
    /**
     * Returns Crop Distribution exclusively (Agriculture).
     */
    getCrops: publicProcedure.query(async () => {
        const rows = await prisma.$queryRaw<Array<{ lon: number, lat: number }>>`
          SELECT lon, lat FROM eth_landcover 
          WHERE cover_class IN (16, 17, 18)
        `;
        return rows.map((r) => [Number(r.lat), Number(r.lon)]);
    }),

    /**
     * Returns all Regions (adm1)
     */
    getRegions: publicProcedure.query(async () => {
        const rows = await prisma.$queryRaw<
            Array<{ adm1_pcode: string; adm1_name: string }>
        >`SELECT adm1_pcode, adm1_name FROM eth_adm1 ORDER BY adm1_name`;
        return rows;
    }),

    /**
     * Returns Zones filtered by region pcode
     */
    getZones: publicProcedure
        .input((v: unknown) => v as { regionPcode: string })
        .query(async ({ input }) => {
            const rows = await prisma.$queryRaw<
                Array<{ adm2_pcode: string; adm2_name: string }>
            >`SELECT adm2_pcode, adm2_name FROM eth_adm2 WHERE adm1_pcode = ${input.regionPcode} ORDER BY adm2_name`;
            return rows;
        }),

    /**
     * Returns Woredas filtered by zone pcode
     */
    getWoredas: publicProcedure
        .input((v: unknown) => v as { zonePcode: string })
        .query(async ({ input }) => {
            const rows = await prisma.$queryRaw<
                Array<{ adm3_pcode: string; adm3_name: string }>
            >`SELECT adm3_pcode, adm3_name FROM eth_adm3 WHERE adm2_pcode = ${input.zonePcode} ORDER BY adm3_name`;
            return rows;
        }),

    /**
     * Returns the GeoJSON boundary + bbox for a given admin unit to zoom to
     */
    getAdminBoundary: publicProcedure
        .input((v: unknown) => v as { level: number; pcode: string })
        .query(async ({ input }) => {
            let row: Array<{ geojson: string; name: string; minx: number; miny: number; maxx: number; maxy: number }>;
            if (input.level === 1) {
                row = await prisma.$queryRaw`
                    SELECT ST_AsGeoJSON(geom)::text AS geojson, adm1_name AS name,
                           ST_XMin(ST_Envelope(geom)) AS minx, ST_YMin(ST_Envelope(geom)) AS miny,
                           ST_XMax(ST_Envelope(geom)) AS maxx, ST_YMax(ST_Envelope(geom)) AS maxy
                    FROM eth_adm1 WHERE adm1_pcode = ${input.pcode}`;
            } else if (input.level === 2) {
                row = await prisma.$queryRaw`
                    SELECT ST_AsGeoJSON(geom)::text AS geojson, adm2_name AS name,
                           ST_XMin(ST_Envelope(geom)) AS minx, ST_YMin(ST_Envelope(geom)) AS miny,
                           ST_XMax(ST_Envelope(geom)) AS maxx, ST_YMax(ST_Envelope(geom)) AS maxy
                    FROM eth_adm2 WHERE adm2_pcode = ${input.pcode}`;
            } else {
                row = await prisma.$queryRaw`
                    SELECT ST_AsGeoJSON(geom)::text AS geojson, adm3_name AS name,
                           ST_XMin(ST_Envelope(geom)) AS minx, ST_YMin(ST_Envelope(geom)) AS miny,
                           ST_XMax(ST_Envelope(geom)) AS maxx, ST_YMax(ST_Envelope(geom)) AS maxy
                    FROM eth_adm3 WHERE adm3_pcode = ${input.pcode}`;
            }
            if (!row[0]) return null;
            const r = row[0];
            return {
                name: r.name,
                geojson: JSON.parse(r.geojson),
                bbox: [Number(r.miny), Number(r.minx), Number(r.maxy), Number(r.maxx)] as [number, number, number, number],
            };
        }),

    /**
     * Returns Ethiopian Railway Infrastructure (DIVA-GIS)
     */
    getRailways: publicProcedure.query(async () => {
        const rows = await prisma.$queryRaw<
            Array<{
                gid: number;
                exs_descri: string | null;
                fco_descri: string | null;
                geojson: string;
            }>
        >`
          SELECT
            gid,
            exs_descri,
            fco_descri,
            ST_AsGeoJSON(geom)::text AS geojson
          FROM eth_railways
          WHERE geom IS NOT NULL
        `;

        const features = rows.map((row) => ({
            type: "Feature" as const,
            geometry: JSON.parse(row.geojson),
            properties: {
                gid: row.gid,
                status: row.exs_descri,
                type: row.fco_descri,
            },
        }));

        return {
            type: "FeatureCollection" as const,
            features,
        };
    }),

    /**
     * Returns Ethiopian Energy & Telecom Infrastructure (OSM power lines)
     */
    getEnergyTelecom: publicProcedure.query(async () => {
        const rows = await prisma.$queryRaw<
            Array<{
                gid: number;
                name: string | null;
                power: string | null;
                voltage: string | null;
                operator: string | null;
                geojson: string;
            }>
        >`
          SELECT
            gid,
            name,
            power,
            voltage,
            operator,
            ST_AsGeoJSON(geom)::text AS geojson
          FROM eth_energy_telecom
          WHERE geom IS NOT NULL
        `;

        const features = rows.map((row) => ({
            type: "Feature" as const,
            geometry: JSON.parse(row.geojson),
            properties: {
                gid: row.gid,
                name: row.name,
                power: row.power,
                voltage: row.voltage,
                operator: row.operator,
            },
        }));

        return {
            type: "FeatureCollection" as const,
            features,
        };
    }),
});
