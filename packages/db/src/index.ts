import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client.js";
import bcrypt from "bcrypt";

interface Logger {
  info: (msg: string) => void;
  debug: (msg: string) => void;
}

const noopLogger: Logger = {
  info: () => {},
  debug: () => {},
};

let prisma: PrismaClient | null = null;

export const prismaConnect = async (
  url: string,
  logger: Logger = noopLogger,
): Promise<PrismaClient> => {
  logger.debug("Connecting to PostgreSQL... -> " + url);
  const adapter = new PrismaPg({ connectionString: url });
  prisma = new PrismaClient({ adapter });
  await prisma.$connect();
  logger.info("Connected to PostgreSQL");
  return prisma;
};

export const prismaDisconnect = async (): Promise<void> => {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
};

export const getPrismaClient = (): PrismaClient => {
  if (!prisma) {
    throw new Error("Prisma client not initialized — call prismaConnect first");
  }
  return prisma;
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (
  candidate: string,
  hashed: string,
): Promise<boolean> => {
  return bcrypt.compare(candidate, hashed);
};

export type { PrismaClient };
export * from "./generated/prisma/client.js";
