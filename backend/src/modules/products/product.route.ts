import { Router } from 'express'
import { productController } from './product.controller'
import { authMiddleware } from '../../middlewares/authMiddleware'
import prisma from '../../prisma/prismaClient'

const router = Router()

// PUBLIC — khách quét QR xem menu (không cần auth)
router.get('/public', async (req, res) => {
  try {
    const { branchId } = req.query
    if (!branchId) return res.status(400).json({ success: false, message: 'Thiếu branchId' })
    
    const branch = await prisma.branch.findUnique({ where: { id: branchId as string } })
    if (!branch) return res.status(404).json({ success: false, message: 'Chi nhánh không tồn tại' })

    const data = await prisma.product.findMany({
      where: { tenantId: branch.tenantId, isAvailable: true },
      orderBy: [{ categoryId: 'asc' }, { displayOrder: 'asc' }],
      include: {
        category: { select: { id: true, name: true } },
        variants: { where: { isAvailable: true }, select: { id: true, name: true, priceModifier: true } },
      },
    })
    return res.json({ success: true, data })
  } catch (e: any) {
    return res.status(400).json({ success: false, message: e.message })
  }
})

router.use(authMiddleware)

// Categories
router.get('/categories', productController.getCategories)
router.post('/categories', productController.createCategory)
router.put('/categories/:id', productController.updateCategory)
router.delete('/categories/:id', productController.deleteCategory)

// Variants — phải đặt TRƯỚC /:id
router.put('/variants/:variantId', productController.updateVariant)
router.delete('/variants/:variantId', productController.deleteVariant)

// Products
router.get('/', productController.getProducts)
router.get('/:id', productController.getProductById)
router.post('/', productController.createProduct)
router.put('/:id', productController.updateProduct)
router.delete('/:id', productController.deleteProduct)

// Variants của product
router.post('/:productId/variants', productController.createVariant)

export default router