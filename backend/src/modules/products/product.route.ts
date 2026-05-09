import { Router } from 'express'
import { productController } from './product.controller'
import { authMiddleware } from '../../middlewares/authMiddleware'

const router = Router()
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