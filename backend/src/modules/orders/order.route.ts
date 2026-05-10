import { Router } from 'express';
import { orderController } from './order.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import prisma from '../../prisma/prismaClient';

const router = Router();

// PUBLIC route — khách quét QR đặt món (không cần auth)
router.post('/public', async (req, res) => {
  try {
    const { branchId, tableId, source, items } = req.body;
    if (!branchId || !items?.length) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin đặt món' });
    }

    let subtotal = 0;
    const itemsWithPrice = await Promise.all(
      items.map(async (item: any) => {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product || !product.isAvailable) throw new Error(`Sản phẩm không hợp lệ`);
        let unitPrice = product.basePrice;
        if (item.variantId) {
          const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
          if (variant) unitPrice += variant.priceModifier;
        }
        const itemSubtotal = unitPrice * item.quantity;
        subtotal += itemSubtotal;
        return { productId: item.productId, variantId: item.variantId, quantity: item.quantity, unitPrice, subtotal: itemSubtotal };
      })
    );

    const todayOrders = await prisma.order.count({
      where: { branchId, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    });
    const orderCode = `${String.fromCharCode(65 + (Math.floor(todayOrders / 100) % 26))}${String(todayOrders % 100 + 1).padStart(3, '0')}`;

    const order = await prisma.order.create({
      data: {
        branchId,
        tableId: tableId || null,
        orderCode,
        source: source || 'QR_ORDER',
        status: 'PENDING',
        subtotal,
        discount: 0,
        tax: 0,
        total: subtotal,
        items: { createMany: { data: itemsWithPrice } },
      },
      include: { items: { include: { product: true, variant: true } }, table: true },
    });

    return res.status(201).json({ success: true, data: order });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// Routes cần auth
router.use(authMiddleware);

router.get('/', orderController.getOrders);
router.get('/branch/:branchId', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', orderController.createOrder);
router.patch('/:id/status', orderController.updateOrderStatus);
router.post('/:id/payment', orderController.createPayment);
router.patch('/:id/cancel', orderController.cancelOrder);

export default router;