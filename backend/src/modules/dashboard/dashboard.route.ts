import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { authMiddleware } from '../../middlewares/authMiddleware';
import prisma from '../../prisma/prismaClient';

const router = Router();
router.use(authMiddleware);

router.get('/stats', dashboardController.getStats);

// Helper lấy branchId
async function resolveBranchId(user: any, query: any) {
  let branchId = query.branchId as string;
  if (!branchId) {
    if (user.branchId) {
      branchId = user.branchId;
    } else {
      const branch = await prisma.branch.findFirst({ where: { tenantId: user.tenantId } });
      if (!branch) throw new Error('Không tìm thấy chi nhánh');
      branchId = branch.id;
    }
  }
  return branchId;
}

// Helper lấy startDate/endDate theo range
function resolveRange(query: any) {
  const range = (query.range as string) || '7';
  const endDate = (query.endDate as string) || new Date().toISOString().split('T')[0];
  let startDate = query.startDate as string;

  if (!startDate) {
    if (range === 'today') {
      startDate = endDate;
    } else if (range === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - d.getDay() + 1);
      startDate = d.toISOString().split('T')[0];
    } else if (range === 'month') {
      const d = new Date();
      startDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    } else if (range === 'year') {
      startDate = `${new Date().getFullYear()}-01-01`;
    } else {
      startDate = new Date(Date.now() - parseInt(range) * 86400000).toISOString().split('T')[0];
    }
  }
  return { startDate, endDate };
}

// ── Doanh thu theo ngày ──────────────────────────────────────────
router.get('/revenue', async (req, res) => {
  try {
    const user = (req as any).user;
    const branchId = await resolveBranchId(user, req.query);
    const { startDate, endDate } = resolveRange(req.query);

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

    const map: Record<string, { revenue: number; orders: number }> = {};
    for (let d = new Date(startDate); d <= new Date(endDate); d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      map[key] = { revenue: 0, orders: 0 };
    }
    for (const o of orders) {
      const key = o.createdAt.toISOString().split('T')[0];
      if (map[key]) { map[key].revenue += o.total; map[key].orders += 1; }
    }

    return res.json({ success: true, data: Object.entries(map).map(([date, v]) => ({ date, ...v })) });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// ── Tổng quan (hôm nay vs hôm qua, tuần này vs tuần trước) ───────
router.get('/summary', async (req, res) => {
  try {
    const user = (req as any).user;
    const branchId = await resolveBranchId(user, req.query);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    const lastWeekStart = new Date(weekStart); lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(weekStart); lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const query = (gte: Date, lte: Date) => prisma.order.aggregate({
      where: { branchId, status: 'COMPLETED', createdAt: { gte, lte } },
      _sum: { total: true }, _count: true,
    });

    const [today, yesterday, thisWeek, lastWeek, thisMonth, lastMonth, thisYear] = await Promise.all([
      query(todayStart, new Date()),
      query(yesterdayStart, new Date(todayStart.getTime() - 1)),
      query(weekStart, new Date()),
      query(lastWeekStart, lastWeekEnd),
      query(monthStart, new Date()),
      query(lastMonthStart, lastMonthEnd),
      query(yearStart, new Date()),
    ]);

    const pct = (curr: number, prev: number) =>
      prev === 0 ? 100 : Math.round(((curr - prev) / prev) * 100);

    return res.json({
      success: true, data: {
        today: { revenue: today._sum.total || 0, orders: today._count },
        yesterday: { revenue: yesterday._sum.total || 0, orders: yesterday._count },
        todayVsYesterday: pct(today._sum.total || 0, yesterday._sum.total || 0),
        thisWeek: { revenue: thisWeek._sum.total || 0, orders: thisWeek._count },
        lastWeek: { revenue: lastWeek._sum.total || 0, orders: lastWeek._count },
        weekVsLastWeek: pct(thisWeek._sum.total || 0, lastWeek._sum.total || 0),
        thisMonth: { revenue: thisMonth._sum.total || 0, orders: thisMonth._count },
        lastMonth: { revenue: lastMonth._sum.total || 0, orders: lastMonth._count },
        monthVsLastMonth: pct(thisMonth._sum.total || 0, lastMonth._sum.total || 0),
        thisYear: { revenue: thisYear._sum.total || 0, orders: thisYear._count },
      },
    });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// ── Top sản phẩm bán chạy ────────────────────────────────────────
router.get('/top-products', async (req, res) => {
  try {
    const user = (req as any).user;
    const branchId = await resolveBranchId(user, req.query);
    const { startDate, endDate } = resolveRange(req.query);

    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          branchId, status: 'COMPLETED',
          createdAt: { gte: new Date(startDate + 'T00:00:00'), lte: new Date(endDate + 'T23:59:59') },
        },
      },
      include: { product: { select: { name: true } } },
    });

    const map: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const item of items) {
      if (!map[item.productId]) map[item.productId] = { name: item.product.name, quantity: 0, revenue: 0 };
      map[item.productId].quantity += item.quantity;
      map[item.productId].revenue += item.subtotal;
    }

    const data = Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// ── Theo phương thức thanh toán ──────────────────────────────────
router.get('/by-payment', async (req, res) => {
  try {
    const user = (req as any).user;
    const branchId = await resolveBranchId(user, req.query);
    const { startDate, endDate } = resolveRange(req.query);

    const orders = await prisma.order.findMany({
      where: {
        branchId, status: 'COMPLETED',
        createdAt: { gte: new Date(startDate + 'T00:00:00'), lte: new Date(endDate + 'T23:59:59') },
      },
      select: { total: true, paymentMethod: true },
    });

    const map: Record<string, { revenue: number; orders: number }> = {};
    for (const o of orders) {
      const key = o.paymentMethod || 'CASH';
      if (!map[key]) map[key] = { revenue: 0, orders: 0 };
      map[key].revenue += o.total;
      map[key].orders += 1;
    }

    return res.json({ success: true, data: Object.entries(map).map(([method, v]) => ({ method, ...v })) });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// ── Theo nguồn đơn ───────────────────────────────────────────────
router.get('/by-source', async (req, res) => {
  try {
    const user = (req as any).user;
    const branchId = await resolveBranchId(user, req.query);
    const { startDate, endDate } = resolveRange(req.query);

    const orders = await prisma.order.findMany({
      where: {
        branchId, status: 'COMPLETED',
        createdAt: { gte: new Date(startDate + 'T00:00:00'), lte: new Date(endDate + 'T23:59:59') },
      },
      select: { total: true, source: true },
    });

    const map: Record<string, { revenue: number; orders: number }> = {};
    for (const o of orders) {
      const key = o.source as string;
      if (!map[key]) map[key] = { revenue: 0, orders: 0 };
      map[key].revenue += o.total;
      map[key].orders += 1;
    }

    return res.json({ success: true, data: Object.entries(map).map(([source, v]) => ({ source, ...v })) });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// ── Giờ cao điểm ────────────────────────────────────────────────
router.get('/peak-hours', async (req, res) => {
  try {
    const user = (req as any).user;
    const branchId = await resolveBranchId(user, req.query);
    const { startDate, endDate } = resolveRange(req.query);

    const orders = await prisma.order.findMany({
      where: {
        branchId, status: 'COMPLETED',
        createdAt: { gte: new Date(startDate + 'T00:00:00'), lte: new Date(endDate + 'T23:59:59') },
      },
      select: { total: true, createdAt: true },
    });

    const map: Record<number, { revenue: number; orders: number }> = {};
    for (let h = 0; h < 24; h++) map[h] = { revenue: 0, orders: 0 };
    for (const o of orders) {
      const h = o.createdAt.getHours();
      map[h].revenue += o.total;
      map[h].orders += 1;
    }

    return res.json({ success: true, data: Object.entries(map).map(([hour, v]) => ({ hour: parseInt(hour), ...v })) });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// ── Theo nhân viên ───────────────────────────────────────────────
router.get('/by-staff', async (req, res) => {
  try {
    const user = (req as any).user;
    const branchId = await resolveBranchId(user, req.query);
    const { startDate, endDate } = resolveRange(req.query);

    const orders = await prisma.order.findMany({
      where: {
        branchId, status: 'COMPLETED',
        createdAt: { gte: new Date(startDate + 'T00:00:00'), lte: new Date(endDate + 'T23:59:59') },
        cashierId: { not: null },
      },
      select: { total: true, cashier: { select: { id: true, name: true } } },
    });

    const map: Record<string, { name: string; revenue: number; orders: number }> = {};
    for (const o of orders) {
      if (!o.cashier) continue;
      if (!map[o.cashier.id]) map[o.cashier.id] = { name: o.cashier.name, revenue: 0, orders: 0 };
      map[o.cashier.id].revenue += o.total;
      map[o.cashier.id].orders += 1;
    }

    const data = Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue);

    return res.json({ success: true, data });
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

export default router;