import bcrypt from 'bcryptjs'
import prisma from '../../prisma/prismaClient'

export const userService = {
  async getUsers(tenantId: string, branchId?: string) {
    return prisma.user.findMany({
      where: {
        tenantId,
        ...(branchId && { branchId }),
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        branch: { select: { id: true, name: true } },
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async getUserById(tenantId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        branchId: true,
        branch: { select: { id: true, name: true } },
        lastLoginAt: true,
        createdAt: true,
      },
    })
    if (!user) throw new Error('User không tồn tại')
    return user
  },

  async createUser(tenantId: string, data: {
    name: string
    email: string
    password: string
    phone?: string
    role: string
    branchId?: string
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) throw new Error('Email đã được sử dụng')

    const { password, ...rest } = data
    const passwordHash = await bcrypt.hash(password, 10)

    return prisma.user.create({
      data: { tenantId, ...rest, passwordHash, role: rest.role as any },
      select: { id: true, name: true, email: true, role: true, branchId: true, createdAt: true },
    })
  },

  async updateUser(tenantId: string, userId: string, data: {
    name?: string
    phone?: string
    role?: string
    branchId?: string
    isActive?: boolean
  }) {
    const user = await prisma.user.findFirst({ where: { id: userId, tenantId } })
    if (!user) throw new Error('User không tồn tại')
    return prisma.user.update({
      where: { id: userId },
      data: data as any,
      select: { id: true, name: true, email: true, role: true, branchId: true, isActive: true },
    })
  },

  async changePassword(tenantId: string, userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, tenantId } })
    if (!user) throw new Error('User không tồn tại')

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash)
    if (!isMatch) throw new Error('Mật khẩu cũ không đúng')

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
    return { message: 'Đổi mật khẩu thành công' }
  },

  async deleteUser(tenantId: string, userId: string) {
    const user = await prisma.user.findFirst({ where: { id: userId, tenantId } })
    if (!user) throw new Error('User không tồn tại')
    return prisma.user.update({ where: { id: userId }, data: { isActive: false } })
  },
}