import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "brianmagagula5@gmail.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Brian7350$@#";
  const orgName = process.env.SEED_ORG_NAME ?? "Scan Suite";
  const slug = "scansuite";

  const existingUser = await prisma.user.findFirst({
    where: { email }
  });

  if (existingUser) {
    console.log(`Seed skipped. User already exists: ${email}`);
    return;
  }

  const organization = await prisma.organization.upsert({
    where: { slug },
    update: {},
    create: {
      name: orgName,
      slug,
    }
  });

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: Role.OWNER,
      organizationId: organization.id
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

