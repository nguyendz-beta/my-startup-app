import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();
async function main() {
  console.log("Seeding...");
  const tenant = await prisma.tenant.upsert({
    where: { slug: "demo-cafe" },
    update: {},
    create: { name: "Demo Cafe", slug: "demo-cafe", planType: "PRO", isActive: true },
  });
  await prisma.tenantPlan.create({ data: { tenantId: tenant.id, planName: "PRO", maxBranches: 5, maxUsers: 20, maxProducts: 500 } });
  const branch = await prisma.branch.create({ data: { tenantId: tenant.id, name: "Chi nhanh Quan 1", address: "123 Nguyen Hue Q1", phone: "0901234567" } });
  const hash = await bcrypt.hash("123456", 10);
  await prisma.user.create({ data: { tenantId: tenant.id, name: "Chu Quan", email: "owner@democafe.vn", passwordHash: hash, role: "OWNER" } });
  await prisma.user.create({ data: { tenantId: tenant.id, branchId: branch.id, name: "Thu Ngan", email: "cashier@democafe.vn", passwordHash: hash, role: "CASHIER" } });
  await prisma.user.create({ data: { tenantId: tenant.id, branchId: branch.id, name: "Le Van Bep", email: "kitchen@democafe.vn", passwordHash: hash, role: "KITCHEN" } });
  const tableNames = ["Ban 01","Ban 02","Ban 03","Ban 04","VIP 1","San vuon A"];
  await prisma.table.createMany({ data: tableNames.map((name, i) => ({ branchId: branch.id, name, capacity: i >= 4 ? 6 : 4, qrCode: "https://order.democafe.vn/table/" + (i+1) })) });
  const catCoffee = await prisma.category.create({ data: { tenantId: tenant.id, name: "Ca phe", displayOrder: 1 } });
  const catTea = await prisma.category.create({ data: { tenantId: tenant.id, name: "Tra & Nuoc ep", displayOrder: 2 } });
  const catFood = await prisma.category.create({ data: { tenantId: tenant.id, name: "Do an", displayOrder: 3 } });
  const p1 = await prisma.product.create({ data: { tenantId: tenant.id, categoryId: catCoffee.id, name: "Ca phe sua da", basePrice: 35000, stockQuantity: -1, displayOrder: 1 } });
  const p2 = await prisma.product.create({ data: { tenantId: tenant.id, categoryId: catCoffee.id, name: "Bac xiu", basePrice: 35000, stockQuantity: -1, displayOrder: 2 } });
  const p3 = await prisma.product.create({ data: { tenantId: tenant.id, categoryId: catTea.id, name: "Tra dao cam sa", basePrice: 45000, stockQuantity: -1, displayOrder: 1 } });
  await prisma.product.create({ data: { tenantId: tenant.id, categoryId: catFood.id, name: "Banh mi trung", basePrice: 25000, stockQuantity: 50, displayOrder: 1 } });
  await prisma.productVariant.createMany({ data: [
    { productId: p1.id, name: "Size M", priceModifier: 0 },
    { productId: p1.id, name: "Size L", priceModifier: 10000 },
    { productId: p2.id, name: "Nong", priceModifier: 0 },
    { productId: p2.id, name: "Da", priceModifier: 0 },
    { productId: p3.id, name: "It duong", priceModifier: 0 },
    { productId: p3.id, name: "Khong duong", priceModifier: 0 },
  ]});
  await prisma.paymentMethod.createMany({ data: [
    { tenantId: tenant.id, name: "Tien mat", type: "CASH" },
    { tenantId: tenant.id, name: "Chuyen khoan", type: "TRANSFER" },
    { tenantId: tenant.id, name: "MoMo", type: "QR_CODE" },
    { tenantId: tenant.id, name: "VNPay", type: "QR_CODE" },
  ]});
  await prisma.discount.create({ data: { tenantId: tenant.id, code: "KHAI_TRUONG", description: "Giam 20%", type: "PERCENTAGE", value: 20, minOrderValue: 50000, maxUses: 100, isActive: true } });
  console.log("Done!");
  console.log("owner@democafe.vn | 123456");
  console.log("cashier@democafe.vn | 123456");
  console.log("kitchen@democafe.vn | 123456");
}
main().catch(console.error).finally(() => prisma.$disconnect());
