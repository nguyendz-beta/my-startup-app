import { Router } from 'express'
import { orderController } from './order.controller'
import { authMiddleware } from '../../middlewares/authMiddleware'

const router = Router()
router.use(authMiddleware)

router.get('/branch/:branchId', orderController.getOrders)
router.get('/:id', orderController.getOrderById)
router.post('/', orderController.createOrder)
router.patch('/:id/status', orderController.updateOrderStatus)
router.post('/:id/payment', orderController.createPayment)
router.patch('/:id/cancel', orderController.cancelOrder)

export default router