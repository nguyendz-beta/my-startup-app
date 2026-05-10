import { Request, Response } from 'express'
import { dashboardService } from './dashboard.service'

export const dashboardController = {
  async getStats(req: Request, res: Response) {
    try {
      const user = (req as any).user
      const branchId = (req.query.branchId as string) || user.branchId || ''
      const data = await dashboardService.getStats(user.tenantId, branchId || undefined)
      return res.json({ success: true, data })
    } catch (e: any) {
      return res.status(400).json({ success: false, message: e.message })
    }
  },
}