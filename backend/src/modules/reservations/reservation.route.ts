import { Router } from 'express'
import { authMiddleware } from '../../middlewares/authMiddleware'
import prisma from '../../prisma/prismaClient'

const router = Router()
router.use(authMiddleware)

const db = prisma as any

const getBranchId = async (user: any, bodyBranchId?: string) => {
  if (bodyBranchId) return bodyBranchId
  if (user.branchId) return user.branchId
  const branch = await db.branch.findFirst({ where: { tenantId: user.tenantId } })
  if (!branch) throw new Error('Không tìm thấy chi nhánh')
  return branch.id
}

router.get('/', async (req, res) => {
  try {
    const user = (req as any).user
    const branchId = await getBranchId(user, req.query.branchId as string)
    const where: any = { branchId }
    if (req.query.status) where.status = req.query.status
    const data = await db.reservation.findMany({
      where,
      orderBy: { reservedAt: 'asc' },
      include: { table: { select: { id: true, name: true } } },
    })
    return res.json({ success: true, data })
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const user = (req as any).user
    const branchId = await getBranchId(user, req.body.branchId)
    const data = await db.reservation.create({
      data: {
        branchId,
        customerName: req.body.customerName,
        customerPhone: req.body.customerPhone,
        partySize: req.body.partySize,
        reservedAt: new Date(req.body.reservedAt),
        note: req.body.note,
      },
      include: { table: { select: { id: true, name: true } } },
    })
    return res.status(201).json({ success: true, data })
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const data = await db.reservation.update({
      where: { id: req.params.id },
      data: {
        status: req.body.status,
        tableId: req.body.tableId,
        note: req.body.note,
      },
      include: { table: { select: { id: true, name: true } } },
    })
    return res.json({ success: true, data })
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    await db.reservation.delete({ where: { id: req.params.id } })
    return res.json({ success: true })
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message })
  }
})

export default router