import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'demo-cafe' } });
  if (!tenant) { console.log('Tenant not found'); return; }
  const catCoffee = await prisma.category.upsert({ where: { id: 'coffee' }, update: {}, create: { tenantId: tenant.id, name: 'Ca phe', displayOrder: 1 } });
  const catTea = await prisma.category.upsert({ where: { id: 'tea' }, update: {}, create: { tenantId: tenant.id, name: 'Tra & Nuoc ep', displayOrder: 2 } });
  const catFood = await prisma.category.upsert({ where: { id: 'food' }, update: {}, create: { tenantId: tenant.id, name: 'Do an', displayOrder: 3 } });
  await prisma.product.createMany({ data: [
    { tenantId: tenant.id, categoryId: catCoffee.id, name: 'Ca phe sua da', basePrice: 35000, stockQuantity: -1, displayOrder: 1 },
    { tenantId: tenant.id, categoryId: catCoffee.id, name: 'Bac xiu', basePrice: 35000, stockQuantity: -1, displayOrder: 2 },
    { tenantId: tenant.id, categoryId: catTea.id, name: 'Tra dao cam sa', basePrice: 45000, stockQuantity: -1, displayOrder: 1 },
    { tenantId: tenant.id, categoryId: catFood.id, name: 'Banh mi trung', basePrice: 25000, stockQuantity: 50, displayOrder: 1 },
  ], skipDuplicates: true });
  console.log('Done!');
}
main().catch(console.error).finally(() => prisma['\\']());
