import { Router } from 'express'
import { authController } from './auth.controller'
import { authMiddleware } from '../../middlewares/authMiddleware'

const router = Router()

router.post('/login', authController.login)
router.post('/register', authController.register)
router.get('/me', authMiddleware, authController.me)

export default router