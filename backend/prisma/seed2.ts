import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tenant = await prisma.tenant.findFirst({ where: { slug: 'demo-cafe' } });
  if (!tenant) { console.log('Tenant not found'); return; }
  console.log('Tenant:', tenant.id);
  const cat1 = await prisma.category.create({ data: { tenantId: tenant.id, name: 'Ca phe', displayOrder: 1 } });
  const cat2 = await prisma.category.create({ data: { tenantId: tenant.id, name: 'Tra sua', displayOrder: 2 } });
  const cat3 = await prisma.category.create({ data: { tenantId: tenant.id, name: 'Do an', displayOrder: 3 } });
  await prisma.product.createMany({ data: [
    { tenantId: tenant.id, categoryId: cat1.id, name: 'Ca phe sua da', basePrice: 35000, stockQuantity: -1 },
    { tenantId: tenant.id, categoryId: cat1.id, name: 'Bac xiu', basePrice: 35000, stockQuantity: -1 },
    { tenantId: tenant.id, categoryId: cat2.id, name: 'Tra dao cam sa', basePrice: 45000, stockQuantity: -1 },
    { tenantId: tenant.id, categoryId: cat3.id, name: 'Banh mi trung', basePrice: 25000, stockQuantity: 50 },
  ]});
  console.log('Done!');
}
main().catch(console.error);
