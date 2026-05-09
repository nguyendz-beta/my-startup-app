import { Router } from 'express'
import { tableController } from './table.controller'
import { authMiddleware } from '../../middlewares/authMiddleware'

const router = Router()
router.use(authMiddleware)

router.get('/branch/:branchId', tableController.getTables)
router.post('/branch/:branchId', tableController.createTable)
router.put('/branch/:branchId/:tableId', tableController.updateTable)
router.delete('/branch/:branchId/:tableId', tableController.deleteTable)

export default router