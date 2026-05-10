import { Router } from 'express'
import { authMiddleware } from '../../middlewares/authMiddleware'
import prisma from '../../prisma/prismaClient'

const router = Router()
router.use(authMiddleware)

// Lấy danh sách ca
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user
    const branchId = (req.query.branchId as string) || user.branchId || ''
    if (!branchId) {
      const branch = await prisma.branch.findFirst({ where: { tenantId: user.tenantId } })
      if (!branch) return res.status(400).json({ success: false, message: 'Không tìm thấy chi nhánh' })
      const shifts = await prisma.shiftReport.findMany({
        where: { branchId: branch.id },
        orderBy: { openedAt: 'desc' },
        take: 30,
        include: {
          branch: { select: { id: true, name: true } },
        },
      })
      return res.json({ success: true, data: shifts.map(formatShift) })
    }
    const shifts = await prisma.shiftReport.findMany({
      where: { branchId },
      orderBy: { openedAt: 'desc' },
      take: 30,
    })
    return res.json({ success: true, data: shifts.map(formatShift) })
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message })
  }
})

// Mở ca
router.post('/', async (req, res) => {
  try {
    const user = (req as any).user
    let branchId = req.body.branchId || user.branchId
    if (!branchId) {
      const branch = await prisma.branch.findFirst({ where: { tenantId: user.tenantId } })
      if (!branch) return res.status(400).json({ success: false, message: 'Không tìm thấy chi nhánh' })
      branchId = branch.id
    }

    const existing = await prisma.shiftReport.findFirst({
      where: { branchId, closedAt: null },
    })
    if (existing) return res.status(400).json({ success: false, message: 'Đã có ca đang mở!' })

    const shift = await prisma.shiftReport.create({
      data: {
        branchId,
        openedBy: user.userId,
        openingCash: req.body.openCash || 0,
      },
    })
    return res.status(201).json({ success: true, data: formatShift(shift) })
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message })
  }
})

// Đóng ca
router.put('/:id/close', async (req, res) => {
  try {
    const user = (req as any).user
    let branchId = user.branchId
    if (!branchId) {
      const branch = await prisma.branch.findFirst({ where: { tenantId: user.tenantId } })
      if (branch) branchId = branch.id
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const [revenueResult, totalOrders] = await Promise.all([
      prisma.order.aggregate({
        where: { branchId, status: 'COMPLETED', createdAt: { gte: today } },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { branchId, createdAt: { gte: today } },
      }),
    ])

    const shift = await prisma.shiftReport.update({
      where: { id: req.params.id },
      data: {
        closedBy: user.userId,
        closingCash: req.body.closeCash || 0,
        totalRevenue: revenueResult._sum.total || 0,
        totalOrders,
        note: req.body.note,
        closedAt: new Date(),
      },
    })
    return res.json({ success: true, data: formatShift(shift) })
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message })
  }
})

function formatShift(s: any) {
  return {
    id: s.id,
    openedAt: s.openedAt,
    closedAt: s.closedAt,
    openCash: s.openingCash,
    closeCash: s.closingCash,
    totalOrders: s.totalOrders || 0,
    totalRevenue: s.totalRevenue || 0,
    note: s.note,
    openedBy: { name: s.openedBy || 'N/A' },
    closedBy: s.closedBy ? { name: s.closedBy } : null,
  }
}

export default router