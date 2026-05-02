import { env } from "@map_project/env/server";
import pkg from "../prisma/generated/index.js";
const { PrismaClient } = pkg;
// @ts-ignore
import { PrismaPg } from "@prisma/adapter-pg";

export function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();
export default prisma;
