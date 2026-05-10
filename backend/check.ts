import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({ select: { email: true, role: true } });
  console.log('Users:', JSON.stringify(users, null, 2));
  await prisma['\$disconnect']();
}
main().catch(console.error).finally(() => process.exit());
