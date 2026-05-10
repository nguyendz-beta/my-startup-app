import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import prisma from '../../prisma/prismaClient';

const router = Router();
router.use(authMiddleware);

router.get('/stats', dashboardController.getStats);

router.get('/revenue', async (req, res) => {
  try {
    const user = (req as any).user;
    let branchId = req.query.branchId as string;
    if (!branchId) {
      if (user.branchId) {
        branchId = user.branchId;
      } else {
        const branch = await prisma.branch.findFirst({ where: { tenantId: user.tenantId } });
        if (!branch)
          return res.status(400).json({ success: false, message: 'Không tìm thấy chi nhánh' });
        branchId = branch.id;
      }
    }

    const startDate =
      (req.query.startDate as string) ||
      new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const endDate = (req.query.endDate as string) || new Date().toISOString().split('T')[0];

    const orders = await prisma.order.findMany({
      where: {
        branchId,
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(startDate + 'T00:00:00'),
          lte: new Date(endDate + 'T23:59:59'),
        },
      },
      select: { total: true, createdAt: true },
    });

    // Group by date
    const map: Record<string, { revenue: number; orders: number }> = {};
    const start = new Date(startDate);
    const end = new Date(endDate);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      map[key] = { revenue: 0, orders: 0 };
    }

    for (const order of orders) {
      const key = order.createdAt.toISOString().split('T')[0];
      if (map[key]) {
        map[key].revenue += order.total;
        map[key].orders += 1;
      }
    }

    const data = Object.entries(map).map(([date, v]) => ({ date, ...v }));
    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

export default router;
