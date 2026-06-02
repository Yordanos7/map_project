import prisma from "@map_project/db";
import { z } from "zod";
import { protectedProcedure, router } from "../index";

// ── Road Signs ────────────────────────────────────────────────────────────────
const RoadSignInput = z.object({
    id: z.string(),
    objectid: z.number().int(),
    signType: z.string(),
    lat: z.number(),
    long: z.number(),
    remark: z.string().nullable().optional(),
});

// ── Health Facility ───────────────────────────────────────────────────────────
const HealthInput = z.object({
    name: z.string().nullable().optional(),
    amenity: z.string().nullable().optional(),
    healthcare: z.string().nullable().optional(),
    operator_t: z.string().nullable().optional(),
    capacity_p: z.string().nullable().optional(),
    addr_city: z.string().nullable().optional(),
});

// ── Education Facility ────────────────────────────────────────────────────────
const EducationInput = z.object({
    name: z.string().nullable().optional(),
    amenity: z.string().nullable().optional(),
    operator_t: z.string().nullable().optional(),
    capacity_p: z.string().nullable().optional(),
    addr_city: z.string().nullable().optional(),
});

// ── Settlement ────────────────────────────────────────────────────────────────
const SettlementInput = z.object({
    name: z.string().nullable().optional(),
    place: z.string().nullable().optional(),
    population: z.string().nullable().optional(),
    is_in: z.string().nullable().optional(),
});

export const adminRouter = router({
    // ── Stats ─────────────────────────────────────────────────────────────────
    getStats: protectedProcedure.query(async () => {
        const [roadSigns, health, education, settlements, users] = await Promise.all([
            prisma.roadSign.count(),
            prisma.ethiopiaHealth.count(),
            prisma.ethiopiaEducation.count(),
            prisma.ethiopiaSettlement.count(),
            prisma.user.count(),
        ]);
        return { roadSigns, health, education, settlements, users };
    }),

    // ── Users ─────────────────────────────────────────────────────────────────
    getUsers: protectedProcedure.query(async () => {
        return prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    }),
    deleteUser: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return prisma.user.delete({ where: { id: input.id } });
        }),

    // ── Road Signs ────────────────────────────────────────────────────────────
    getRoadSigns: protectedProcedure.query(async () => {
        return prisma.roadSign.findMany({ orderBy: { objectid: "asc" } });
    }),
    createRoadSign: protectedProcedure
        .input(RoadSignInput)
        .mutation(async ({ input }) => {
            return prisma.roadSign.create({ data: input });
        }),
    updateRoadSign: protectedProcedure
        .input(z.object({ id: z.string(), data: RoadSignInput.partial() }))
        .mutation(async ({ input }) => {
            return prisma.roadSign.update({ where: { id: input.id }, data: input.data });
        }),
    deleteRoadSign: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return prisma.roadSign.delete({ where: { id: input.id } });
        }),

    // ── Health Facilities ─────────────────────────────────────────────────────
    getHealth: protectedProcedure.query(async () => {
        return prisma.ethiopiaHealth.findMany({
            select: { gid: true, name: true, amenity: true, healthcare: true, operator_t: true, capacity_p: true, addr_city: true },
            orderBy: { gid: "asc" },
            take: 500,
        });
    }),
    updateHealth: protectedProcedure
        .input(z.object({ gid: z.number(), data: HealthInput }))
        .mutation(async ({ input }) => {
            return prisma.ethiopiaHealth.update({ where: { gid: input.gid }, data: input.data });
        }),
    deleteHealth: protectedProcedure
        .input(z.object({ gid: z.number() }))
        .mutation(async ({ input }) => {
            return prisma.ethiopiaHealth.delete({ where: { gid: input.gid } });
        }),

    // ── Education Facilities ──────────────────────────────────────────────────
    getEducation: protectedProcedure.query(async () => {
        return prisma.ethiopiaEducation.findMany({
            select: { gid: true, name: true, amenity: true, operator_t: true, capacity_p: true, addr_city: true },
            orderBy: { gid: "asc" },
            take: 500,
        });
    }),
    updateEducation: protectedProcedure
        .input(z.object({ gid: z.number(), data: EducationInput }))
        .mutation(async ({ input }) => {
            return prisma.ethiopiaEducation.update({ where: { gid: input.gid }, data: input.data });
        }),
    deleteEducation: protectedProcedure
        .input(z.object({ gid: z.number() }))
        .mutation(async ({ input }) => {
            return prisma.ethiopiaEducation.delete({ where: { gid: input.gid } });
        }),

    // ── Settlements ───────────────────────────────────────────────────────────
    getSettlements: protectedProcedure.query(async () => {
        return prisma.ethiopiaSettlement.findMany({
            select: { gid: true, name: true, place: true, population: true, is_in: true },
            orderBy: { gid: "asc" },
            take: 500,
        });
    }),
    updateSettlement: protectedProcedure
        .input(z.object({ gid: z.number(), data: SettlementInput }))
        .mutation(async ({ input }) => {
            return prisma.ethiopiaSettlement.update({ where: { gid: input.gid }, data: input.data });
        }),
    deleteSettlement: protectedProcedure
        .input(z.object({ gid: z.number() }))
        .mutation(async ({ input }) => {
            return prisma.ethiopiaSettlement.delete({ where: { gid: input.gid } });
        }),
});
