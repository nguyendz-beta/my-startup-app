import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  const result = await prisma.user.updateMany({
    where: { email: { in: ['owner@democafe.vn', 'cashier@democafe.vn', 'kitchen@democafe.vn'] } },
    data: { passwordHash: hash }
  });
  console.log('Updated:', result.count, 'users');
  console.log('Login: owner@democafe.vn / admin123');
}
main().catch(console.error);
