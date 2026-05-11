import prisma from '../../prisma/prismaClient';
import { orderEvents } from '../../sockets/taskSocket';

export const orderService = {
  async getOrders(branchId: string, filters?: { status?: string; source?: string; date?: string }) {
    return prisma.order.findMany({
      where: {
        branchId,
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.source && { source: filters.source as any }),
        ...(filters?.date && {
          createdAt: {
            gte: new Date(filters.date + 'T00:00:00'),
            lte: new Date(filters.date + 'T23:59:59'),
          },
        }),
      },
      orderBy: { createdAt: 'asc' },
      include: {
        table: { select: { id: true, name: true } },
        cashier: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, imageUrl: true } },
            variant: { select: { id: true, name: true } },
          },
        },
        payment: true,
      },
    });
  },

  async getOrderById(branchId: string, orderId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, branchId },
      include: {
        table: true,
        cashier: { select: { id: true, name: true } },
        items: {
          include: { product: true, variant: true },
        },
        payment: { include: { method: true } },
        discountR: true,
      },
    });
    if (!order) throw new Error('Đơn hàng không tồn tại');
    return order;
  },

  async createOrder(
    branchId: string,
    cashierId: string | null,
    data: {
      tableId?: string;
      source: string;
      note?: string;
      discountId?: string;
      autoComplete?: boolean;
      paymentMethod?: string;
      items: { productId: string; variantId?: string; quantity: number; note?: string }[];
    },
  ) {
    let subtotal = 0;
    const itemsWithPrice = await Promise.all(
      data.items.map(async (item) => {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error(`Sản phẩm không tồn tại: ${item.productId}`);
        if (!product.isAvailable) throw new Error(`Sản phẩm đã hết: ${product.name}`);

        let unitPrice = product.basePrice;
        if (item.variantId) {
          const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
          if (variant) unitPrice += variant.priceModifier;
        }

        const itemSubtotal = unitPrice * item.quantity;
        subtotal += itemSubtotal;
        return { ...item, unitPrice, subtotal: itemSubtotal };
      }),
    );

    let discountAmount = 0;
    if (data.discountId) {
      const discount = await prisma.discount.findUnique({ where: { id: data.discountId } });
      if (discount && discount.isActive) {
        discountAmount =
          discount.type === 'PERCENTAGE'
            ? Math.round(subtotal * (discount.value / 100))
            : discount.value;
      }
    }

    const total = subtotal - discountAmount;

    const now = new Date();
    const datePart = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const todayOrders = await prisma.order.count({
      where: { createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) } },
    });
    const orderCode = `ORD-${datePart}-${String(todayOrders + 1).padStart(3, '0')}-${Math.random().toString(36).slice(2, 4).toUpperCase()}`;

    const status = data.autoComplete ? 'COMPLETED' : 'PENDING';

    const order = await prisma.order.create({
      data: {
        branchId,
        cashierId,
        tableId: data.tableId,
        discountId: data.discountId,
        orderCode,
        source: data.source as any,
        status: status as any,
        paymentMethod: data.paymentMethod,
        ...(data.autoComplete && { completedAt: new Date() }),
        note: data.note,
        subtotal,
        discount: discountAmount,
        tax: 0,
        total,
        items: {
          createMany: {
            data: itemsWithPrice.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              subtotal: item.subtotal,
              note: item.note,
            })),
          },
        },
      },
      include: {
        items: { include: { product: true, variant: true } },
        table: true,
      },
    });

    orderEvents.newOrder(branchId, order);
    return order;
  },

  async updateOrderStatus(branchId: string, orderId: string, status: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, branchId },
      include: { items: true },
    });
    if (!order) throw new Error('Đơn hàng không tồn tại');

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as any,
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      },
    });

    // Tự động trừ kho khi COMPLETED
    if (status === 'COMPLETED') {
      const db = prisma as any;
      for (const item of order.items) {
        // Ưu tiên nguyên liệu riêng theo size (variantId)
        let ingredients = await db.productIngredient.findMany({
          where: {
            productId: item.productId,
            variantId: item.variantId ?? null,
          },
        });

        // Nếu size đó chưa có nguyên liệu riêng → fallback về nguyên liệu chung
        if (ingredients.length === 0 && item.variantId) {
          ingredients = await db.productIngredient.findMany({
            where: { productId: item.productId, variantId: null },
          });
        }

        for (const ing of ingredients) {
          const invItem = await db.inventoryItem.findFirst({
            where: { id: ing.itemId, branchId },
          });
          if (!invItem) continue;
          const deduct = ing.quantity * item.quantity;
          await db.inventoryItem.update({
            where: { id: ing.itemId },
            data: { quantity: Math.max(0, invItem.quantity - deduct) },
          });
          await db.inventoryItemLog.create({
            data: {
              itemId: ing.itemId,
              type: 'OUT',
              quantity: deduct,
              note: `Đơn #${order.orderCode}`,
              createdBy: 'system',
            },
          });
        }
      }
    }

    orderEvents.orderStatusChanged(branchId, updatedOrder);
    return updatedOrder;
  },

  async createPayment(
    branchId: string,
    orderId: string,
    data: { methodId: string; amount: number; referenceCode?: string },
  ) {
    const order = await prisma.order.findFirst({ where: { id: orderId, branchId } });
    if (!order) throw new Error('Đơn hàng không tồn tại');

    const payment = await prisma.payment.create({
      data: {
        orderId,
        methodId: data.methodId,
        amount: data.amount,
        status: 'PAID',
        referenceCode: data.referenceCode,
        paidAt: new Date(),
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    if (order.tableId) {
      await prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    orderEvents.orderPaid(branchId, { orderId, payment });
    return payment;
  },

  async cancelOrder(branchId: string, orderId: string) {
    const order = await prisma.order.findFirst({ where: { id: orderId, branchId } });
    if (!order) throw new Error('Đơn hàng không tồn tại');
    if (order.status === 'COMPLETED') throw new Error('Không thể huỷ đơn đã hoàn thành');

    return prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });
  },
};
