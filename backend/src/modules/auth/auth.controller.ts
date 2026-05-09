import { Request, Response } from 'express'
import { authService } from './auth.service'

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email và mật khẩu là bắt buộc' })
      }
      const data = await authService.login(email, password)
      return res.json({ success: true, data })
    } catch (error: any) {
      return res.status(401).json({ success: false, message: error.message })
    }
  },

  async register(req: Request, res: Response) {
    try {
      const { tenantName, tenantSlug, ownerName, email, password, phone } = req.body
      if (!tenantName || !tenantSlug || !ownerName || !email || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' })
      }
      const data = await authService.register({ tenantName, tenantSlug, ownerName, email, password, phone })
      return res.status(201).json({ success: true, data })
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message })
    }
  },

  async me(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId
      const data = await authService.me(userId)
      return res.json({ success: true, data })
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message })
    }
  },
}