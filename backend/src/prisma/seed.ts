import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-cafe' },
    update: {},
    create: {
      name: 'Demo Café',
      slug: 'demo-cafe',
      planType: 'PRO',
      isActive: true,
    },
  });
  console.log('✅ Tenant:', tenant.name);

  await prisma.tenantPlan.create({
    data: {
      tenantId: tenant.id,
      planName: 'PRO',
      maxBranches: 5,
      maxUsers: 20,
      maxProducts: 500,
    },
  });

  const branch = await prisma.branch.create({
    data: {
      tenantId: tenant.id,
      name: 'Chi nhánh Quận 1',
      address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
      phone: '0901234567',
    },
  });
  console.log('✅ Branch:', branch.name);

  const passwordHash = await bcrypt.hash('123456', 10);

  const owner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: null,
      name: 'Nguyễn Văn Chủ',
      email: 'owner@democafe.vn',
      passwordHash,
      phone: '0901111111',
      role: 'OWNER',
    },
  });

  const cashier = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Trần Thị Thu Ngân',
      email: 'cashier@democafe.vn',
      passwordHash,
      phone: '0902222222',
      role: 'CASHIER',
    },
  });

  const kitchen = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      branchId: branch.id,
      name: 'Lê Văn Bếp',
      email: 'kitchen@democafe.vn',
      passwordHash,
      phone: '0903333333',
      role: 'KITCHEN',
    },
  });
  console.log('✅ Users:', owner.email, cashier.email, kitchen.email);

  const tableNames = ['Bàn 01', 'Bàn 02', 'Bàn 03', 'Bàn 04', 'VIP 1', 'Sân vườn A'];
  await prisma.table.createMany({
    data: tableNames.map((name, i) => ({
      branchId: branch.id,
      name,
      capacity: i >= 4 ? 6 : 4,
      qrCode: `https://order.democafe.vn/table/${i + 1}`,
    })),
  });
  console.log('✅ Tables:', tableNames.length);

  const [catCoffee, catTea, catFood] = await Promise.all([
    prisma.category.create({
      data: { tenantId: tenant.id, name: 'Cà phê', displayOrder: 1 },
    }),
    prisma.category.create({
      data: { tenantId: tenant.id, name: 'Trà & Nước ép', displayOrder: 2 },
    }),
    prisma.category.create({
      data: { tenantId: tenant.id, name: 'Đồ ăn', displayOrder: 3 },
    }),
  ]);
  console.log('✅ Categories: 3');

  const caphe = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: catCoffee.id,
      name: 'Cà phê sữa đá',
      description: 'Cà phê phin truyền thống với sữa đặc',
      basePrice: 35000,
      stockQuantity: -1,
      displayOrder: 1,
    },
  });

  const bac_xiu = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: catCoffee.id,
      name: 'Bạc xỉu',
      basePrice: 35000,
      stockQuantity: -1,
      displayOrder: 2,
    },
  });

  const tra_dao = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: catTea.id,
      name: 'Trà đào cam sả',
      basePrice: 45000,
      stockQuantity: -1,
      displayOrder: 1,
    },
  });

  await prisma.product.create({
    data: {
      tenantId: tenant.id,
      categoryId: catFood.id,
      name: 'Bánh mì trứng',
      basePrice: 25000,
      stockQuantity: 50,
      displayOrder: 1,
    },
  });
  console.log('✅ Products: 4');

  await prisma.productVariant.createMany({
    data: [
      { productId: caphe.id, name: 'Size M', priceModifier: 0 },
      { productId: caphe.id, name: 'Size L', priceModifier: 10000 },
      { productId: bac_xiu.id, name: 'Nóng', priceModifier: 0 },
      { productId: bac_xiu.id, name: 'Đá', priceModifier: 0 },
      { productId: tra_dao.id, name: 'Ít đường', priceModifier: 0 },
      { productId: tra_dao.id, name: 'Không đường', priceModifier: 0 },
    ],
  });
  console.log('✅ Variants: 6');

  await prisma.paymentMethod.createMany({
    data: [
      { tenantId: tenant.id, name: 'Tiền mặt', type: 'CASH' },
      { tenantId: tenant.id, name: 'Chuyển khoản', type: 'TRANSFER' },
      { tenantId: tenant.id, name: 'MoMo', type: 'QR_CODE' },
      { tenantId: tenant.id, name: 'VNPay', type: 'QR_CODE' },
    ],
  });
  console.log('✅ Payment Methods: 4');

  await prisma.discount.create({
    data: {
      tenantId: tenant.id,
      code: 'KHAI_TRUONG',
      description: 'Giảm 20% khai trương',
      type: 'PERCENTAGE',
      value: 20,
      minOrderValue: 50000,
      maxUses: 100,
      isActive: true,
    },
  });
  console.log('✅ Discount: KHAI_TRUONG');

  console.log('\n🎉 Seed hoàn tất!');
  console.log('──────────────────────────────');
  console.log('📧 owner@democafe.vn     | 123456');
  console.log('📧 cashier@democafe.vn   | 123456');
  console.log('📧 kitchen@democafe.vn   | 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
