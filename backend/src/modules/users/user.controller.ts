import { Request, Response } from 'express'
import { userService } from './user.service'

const getTenantId = (req: Request) => (req as any).user.tenantId as string

export const userController = {
  async getUsers(req: Request, res: Response) {
    try {
      const branchId = req.query.branchId as string | undefined
      const data = await userService.getUsers(getTenantId(req), branchId)
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async getUserById(req: Request, res: Response) {
    try {
      const data = await userService.getUserById(getTenantId(req), req.params.id as string)
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(404).json({ success: false, message: e.message })
    }
  },

  async createUser(req: Request, res: Response) {
    try {
      const data = await userService.createUser(getTenantId(req), req.body)
      return res.status(201).json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async updateUser(req: Request, res: Response) {
    try {
      const data = await userService.updateUser(getTenantId(req), req.params.id as string, req.body)
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async changePassword(req: Request, res: Response) {
    try {
      const { oldPassword, newPassword } = req.body
      const data = await userService.changePassword(getTenantId(req), req.params.id as string, oldPassword, newPassword)
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async deleteUser(req: Request, res: Response) {
    try {
      await userService.deleteUser(getTenantId(req), req.params.id as string)
      return res.json({ success: true, message: 'Đã xoá user' })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },
}