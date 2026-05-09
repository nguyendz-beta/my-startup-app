import { Router } from 'express'
import { userController } from './user.controller'
import { authMiddleware } from '../../middlewares/authMiddleware'

const router = Router()
router.use(authMiddleware)

router.get('/', userController.getUsers)
router.get('/:id', userController.getUserById)
router.post('/', userController.createUser)
router.put('/:id', userController.updateUser)
router.patch('/:id/password', userController.changePassword)
router.delete('/:id', userController.deleteUser)

export default router