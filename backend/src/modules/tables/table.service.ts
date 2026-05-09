import prisma from '../../prisma/prismaClient'

export const tableService = {
  async getTables(branchId: string) {
    return prisma.table.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: 'asc' },
      include: {
        orders: {
          where: { status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] } },
          select: { id: true, orderCode: true, status: true, total: true, createdAt: true },
        },
      },
    })
  },

  async createTable(branchId: string, data: { name: string; capacity?: number }) {
    const qrCode = `https://order.app/table/${branchId}/${Date.now()}`
    return prisma.table.create({
      data: { branchId, qrCode, ...data },
    })
  },

  async updateTable(branchId: string, tableId: string, data: { name?: string; capacity?: number; status?: string; isActive?: boolean }) {
    const table = await prisma.table.findFirst({ where: { id: tableId, branchId } })
    if (!table) throw new Error('Bàn không tồn tại')
    return prisma.table.update({ where: { id: tableId }, data: data as any })
  },

  async deleteTable(branchId: string, tableId: string) {
    const table = await prisma.table.findFirst({ where: { id: tableId, branchId } })
    if (!table) throw new Error('Bàn không tồn tại')
    return prisma.table.update({ where: { id: tableId }, data: { isActive: false } })
  },
}