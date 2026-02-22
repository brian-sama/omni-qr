import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@omniqr.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!ChangeMe123!";
  const orgName = process.env.SEED_ORG_NAME ?? "omniQR Demo Organization";

  const existing = await prisma.user.findFirst({
    where: { email },
    include: { organization: true }
  });

  if (existing) {
    console.log(`Seed skipped. User already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const organization = await prisma.organization.create({
    data: {
      name: orgName,
      users: {
        create: {
          email,
          passwordHash,
          role: Role.OWNER
        }
      }
    },
    include: {
      users: true
    }
  });

  console.log(`Seed complete. Organization: ${organization.name}`);
  console.log(`Owner email: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

