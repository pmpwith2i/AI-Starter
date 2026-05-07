// Idempotent starter seed.
// Run: pnpm --filter @repo/db exec prisma db seed
//
// Creates the bare minimum so the dashboard login + realtime widgets work:
//   - one verified user (admin@example.com / Admin123!)
//   - one welcome Notification
//   - mandatory consent records (terms_of_service + privacy_policy)
//
// Add domain seeding to this file as you scaffold features.

import { PrismaClient } from "./generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

const POLICY_VERSION = process.env.PRIVACY_POLICY_VERSION ?? "1.0";

const main = async () => {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      emailVerified: true,
    },
  });

  await prisma.consentRecord.upsert({
    where: { id: `seed-tos-${admin.id}` },
    update: {},
    create: {
      id: `seed-tos-${admin.id}`,
      userId: admin.id,
      purpose: "terms_of_service",
      policyVersion: POLICY_VERSION,
      grantedAt: new Date(),
    },
  });

  await prisma.consentRecord.upsert({
    where: { id: `seed-priv-${admin.id}` },
    update: {},
    create: {
      id: `seed-priv-${admin.id}`,
      userId: admin.id,
      purpose: "privacy_policy",
      policyVersion: POLICY_VERSION,
      grantedAt: new Date(),
    },
  });

  await prisma.notification.upsert({
    where: { id: `seed-welcome-${admin.id}` },
    update: {},
    create: {
      id: `seed-welcome-${admin.id}`,
      userId: admin.id,
      type: "welcome",
      title: "Welcome to your starter project",
      body: "This notification proves the realtime PG trigger pipeline works end-to-end.",
    },
  });

  console.log("Seeded admin@example.com / Admin123!");
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
