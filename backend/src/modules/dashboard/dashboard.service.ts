import prisma from '../../prisma/prismaClient';

export const dashboardService = {
  async getStats(tenantId: string, branchId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereOrder = {
      branch: { tenantId },
      ...(branchId && { branchId }),
      createdAt: { gte: today, lt: tomorrow },
    };

    // Tổng doanh thu hôm nay (chỉ đơn COMPLETED)
    const revenueResult = await prisma.order.aggregate({
      where: { ...whereOrder, status: 'COMPLETED' },
      _sum: { total: true },
    });

    // Tổng đơn hôm nay
    const todayOrders = await prisma.order.count({ where: whereOrder });

    // Đơn chờ xử lý
    const pendingOrders = await prisma.order.count({
      where: { ...whereOrder, status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] } },
    });

    // Đơn hoàn thành
    const completedOrders = await prisma.order.count({
      where: { ...whereOrder, status: 'COMPLETED' },
    });

    // Doanh thu theo giờ (8h - 22h)
    const orders = await prisma.order.findMany({
      where: { ...whereOrder, status: 'COMPLETED' },
      select: { createdAt: true, total: true },
    });

    const revenueByHour = Array.from({ length: 15 }, (_, i) => ({ hour: i + 8, revenue: 0 }));
    orders.forEach((o) => {
      const hour = new Date(o.createdAt).getHours();
      const slot = revenueByHour.find((h) => h.hour === hour);
      if (slot) slot.revenue += o.total;
    });

    // Top sản phẩm bán chạy
    const items = await prisma.orderItem.findMany({
      where: { order: { ...whereOrder, status: 'COMPLETED' } },
      include: { product: { select: { name: true } } },
    });

    const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    items.forEach((item) => {
      const name = item.product.name;
      if (!productMap[name]) productMap[name] = { name, quantity: 0, revenue: 0 };
      productMap[name].quantity += item.quantity;
      productMap[name].revenue += item.subtotal;
    });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Tổng quan từng chi nhánh (chỉ OWNER)
    let branches = undefined;
    if (!branchId) {
      const allBranches = await prisma.branch.findMany({ where: { tenantId } });
      branches = await Promise.all(
        allBranches.map(async (branch) => {
          const bWhere = { branchId: branch.id, createdAt: { gte: today, lt: tomorrow } };
          const rev = await prisma.order.aggregate({
            where: { ...bWhere, status: 'COMPLETED' },
            _sum: { total: true },
          });
          const todayOrdersB = await prisma.order.count({ where: bWhere });
          const pendingB = await prisma.order.count({
            where: { ...bWhere, status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] } },
          });
          return {
            id: branch.id,
            name: branch.name,
            todayRevenue: rev._sum.total || 0,
            todayOrders: todayOrdersB,
            pendingOrders: pendingB,
            activeShift: false,
          };
        }),
      );
    }

    return {
      todayRevenue: revenueResult._sum.total || 0,
      todayOrders,
      pendingOrders,
      completedOrders,
      topProducts,
      revenueByHour,
      branches,
    };
  },
};
