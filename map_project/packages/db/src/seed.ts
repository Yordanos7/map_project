import "dotenv/config";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({
    path: path.resolve(process.cwd(), "../../apps/server/.env"),
});

import prisma from "./index.ts";

async function main() {
    const roadSigns = [
        {
            id: "road_signs_4326_v3.1",
            objectid: 2,
            signType: "Height Limit",
            lat: 8.79335421347303,
            long: 38.9955033513433,
            remark: "4.5m",
        },
        {
            id: "road_signs_4326_v3.2",
            objectid: 3,
            signType: "Height Limit",
            lat: 8.79292203172403,
            long: 39.0003697571671,
            remark: "4.2m",
        },
        {
            id: "road_signs_4326_v3.3",
            objectid: 4,
            signType: "Height Limit",
            lat: 8.79207803093392,
            long: 39.0001581769409,
            remark: "4.2m",
        },
        {
            id: "road_signs_4326_v3.4",
            objectid: 5,
            signType: "Height Limit",
            lat: 8.7935078411189,
            long: 38.9962962694562,
            remark: "4.2m",
        },
        {
            id: "road_signs_4326_v3.5",
            objectid: 6,
            signType: "Height Limit",
            lat: 8.79364641532319,
            long: 38.9967398127806,
            remark: "4.2m",
        },
        {
            id: "road_signs_4326_v3.44",
            objectid: 54,
            signType: "Parking",
            lat: 8.76350309657611,
            long: 39.0181422516404,
            remark: "Rail way",
        },
        {
            id: "road_signs_4326_v3.45",
            objectid: 55,
            signType: "Bus station",
            lat: 8.74640515536898,
            long: 38.9858997745527,
            remark: null,
        },
        {
            id: "road_signs_4326_v3.47",
            objectid: 57,
            signType: "Bajaji Station",
            lat: 8.74720950639019,
            long: 38.9895682670209,
            remark: null,
        },
        {
            id: "road_signs_4326_v3.49",
            objectid: 59,
            signType: "Speed Limit",
            lat: 8.73900507502201,
            long: 38.9916678198138,
            remark: "30 km/hr",
        },
    ];

    console.log("Seeding road signs...");
    for (const sign of roadSigns) {
        await prisma.roadSign.upsert({
            where: { id: sign.id },
            update: {},
            create: sign,
        });

        // Populate the PostGIS geometry column natively
        await prisma.$executeRaw`
            UPDATE "road_signs" 
            SET geom = ST_SetSRID(ST_MakePoint(${sign.long}, ${sign.lat}), 4326)
            WHERE id = ${sign.id}
        `;
    }
    console.log("Seeding completed successfully!");
}

main()
    .catch((e) => {
        console.error("Seeding failed:", e);
        process.exit(1);
    });
