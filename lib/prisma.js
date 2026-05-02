import PrismaPkg from '@prisma/client';
const { PrismaClient } = PrismaPkg;
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const prismaClientSingleton = () => {
  console.log("Initializing Prisma Client with PostgreSQL adapter...");
  try {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    console.log("PostgreSQL pool created.");
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (error) {
    console.error("Failed to initialize Prisma Client:", error);
    throw error;
  }
};

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
