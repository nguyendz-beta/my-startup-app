import { Router } from 'express'
import { authMiddleware } from '../../middlewares/authMiddleware'
import prisma from '../../prisma/prismaClient'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req, res) => {
  try {
    const user = (req as any).user
    const branches = await prisma.branch.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'asc' },
    })
    return res.json({ success: true, data: branches })
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message })
  }
})

export default router