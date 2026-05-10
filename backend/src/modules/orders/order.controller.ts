import { Request, Response } from 'express'
import { orderService } from './order.service'
import prisma from '../../prisma/prismaClient'

const str = (v: any): string => Array.isArray(v) ? v[0] : v || ''

const getBranchId = async (user: any): Promise<string> => {
  if (user.branchId) return user.branchId
  const branch = await prisma.branch.findFirst({ where: { tenantId: user.tenantId } })
  if (!branch) throw new Error('Không tìm thấy chi nhánh')
  return branch.id
}

export const orderController = {
  async getOrders(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const branchId = str(req.params.branchId) || await getBranchId(user)
      const data = await orderService.getOrders(branchId, {
        status: str(req.query.status),
        source: str(req.query.source),
        date: str(req.query.date),
      })
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async getOrderById(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const branchId = await getBranchId(user)
      const data = await orderService.getOrderById(branchId, str(req.params.id))
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(404).json({ success: false, message: e.message })
    }
  },

  async createOrder(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const branchId = await getBranchId(user)
      const data = await orderService.createOrder(branchId, user.userId, req.body)
      return res.status(201).json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async updateOrderStatus(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const branchId = await getBranchId(user)
      const data = await orderService.updateOrderStatus(branchId, str(req.params.id), req.body.status)
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async createPayment(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const branchId = await getBranchId(user)
      const data = await orderService.createPayment(branchId, str(req.params.id), req.body)
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },

  async cancelOrder(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const branchId = await getBranchId(user)
      await orderService.cancelOrder(branchId, str(req.params.id))
      return res.json({ success: true, message: 'Đã huỷ đơn hàng' })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },
}