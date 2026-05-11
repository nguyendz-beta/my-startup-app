import { Router } from 'express'
import { authMiddleware } from '../../middlewares/authMiddleware'
import prisma from '../../prisma/prismaClient'

const router = Router()
router.use(authMiddleware)

const db = prisma as any

const getBranchId = async (user: any, queryBranchId?: string) => {
  if (queryBranchId) return queryBranchId
  if (user.branchId) return user.branchId
  const branch = await db.branch.findFirst({ where: { tenantId: user.tenantId } })
  if (!branch) throw new Error('Không tìm thấy chi nhánh')
  return branch.id
}

// Lấy danh sách nguyên liệu
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user
    const branchId = await getBranchId(user, req.query.branchId as string)
    const data = await db.inventoryItem.findMany({
      where: { branchId },
      orderBy: { name: 'asc' },
    })
    return res.json({ success: true, data })
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message })
  }
})

// Thêm nguyên liệu
router.post('/', async (req, res) => {
  try {
    const user = (req as any).user
    const branchId = await getBranchId(user, req.body.branchId)
    const data = await db.inventoryItem.create({
      data: {
        branchId,
        name: req.body.name,
        unit: req.body.unit || 'kg',
        quantity: parseFloat(req.body.quantity) || 0,
        minQuantity: parseFloat(req.body.minQuantity) || 10,
        costPrice: parseFloat(req.body.costPrice) || 0,
        category: req.body.category || null,
      },
    })
    return res.status(201).json({ success: true, data })
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message })
  }
})

// Sửa nguyên liệu
router.put('/:id', async (req, res) => {
  try {
    const data = await db.inventoryItem.update({
      where: { id: req.params.id },
      data: {
        name: req.body.name,
        unit: req.body.unit,
        minQuantity: parseFloat(req.body.minQuantity) || 10,
        costPrice: parseFloat(req.body.costPrice) || 0,
        category: req.body.category || null,
      },
    })
    return res.json({ success: true, data })
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message })
  }
})

// Xoá nguyên liệu
router.delete('/:id', async (req, res) => {
  try {
    await db.inventoryItem.delete({ where: { id: req.params.id } })
    return res.json({ success: true })
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message })
  }
})

// Nhập/Xuất/Điều chỉnh kho
router.post('/:id/stock', async (req, res) => {
  try {
    const user = (req as any).user
    const item = await db.inventoryItem.findUnique({ where: { id: req.params.id } })
    if (!item) return res.status(404).json({ success: false, message: 'Không tìm thấy nguyên liệu' })

    const qty = parseFloat(req.body.quantity)
    let newQty = item.quantity
    if (req.body.type === 'IN') newQty += qty
    else if (req.body.type === 'OUT') newQty -= qty
    else if (req.body.type === 'ADJUST') newQty = qty

    const updated = await db.inventoryItem.update({
      where: { id: req.params.id },
      data: { quantity: newQty },
    })

    await db.inventoryItemLog.create({
      data: {
        itemId: req.params.id,
        type: req.body.type,
        quantity: qty,
        note: req.body.note || null,
        createdBy: user.name || user.userId,
      },
    })

    return res.json({ success: true, data: updated })
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message })
  }
})

// Lịch sử nhập/xuất
router.get('/:id/logs', async (req, res) => {
  try {
    const data = await db.inventoryItemLog.findMany({
      where: { itemId: req.params.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return res.json({ success: true, data })
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message })
  }
})

export default router