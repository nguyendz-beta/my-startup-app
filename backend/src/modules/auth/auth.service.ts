import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../../prisma/prismaClient'

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret'
const JWT_EXPIRES_IN = '7d'

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { tenant: true, branch: true },
    })

    if (!user || !user.isActive) {
      throw new Error('Email hoặc mật khẩu không đúng')
    }

    if (!user.tenant.isActive) {
      throw new Error('Tài khoản đã bị khoá')
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      throw new Error('Email hoặc mật khẩu không đúng')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: user.tenantId,
        branchId: user.branchId,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant: { id: user.tenant.id, name: user.tenant.name, slug: user.tenant.slug },
        branch: user.branch ? { id: user.branch.id, name: user.branch.name } : null,
      },
    }
  },

  async register(data: {
    tenantName: string
    tenantSlug: string
    ownerName: string
    email: string
    password: string
    phone?: string
  }) {
    const existingTenant = await prisma.tenant.findUnique({
      where: { slug: data.tenantSlug },
    })
    if (existingTenant) {
      throw new Error('Tên quán đã tồn tại, vui lòng chọn tên khác')
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    })
    if (existingUser) {
      throw new Error('Email đã được sử dụng')
    }

    const passwordHash = await bcrypt.hash(data.password, 10)

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: data.tenantName, slug: data.tenantSlug, planType: 'FREE' },
      })

      await tx.tenantPlan.create({
        data: { tenantId: tenant.id, planName: 'FREE', maxBranches: 1, maxUsers: 3, maxProducts: 30 },
      })

      const branch = await tx.branch.create({
        data: { tenantId: tenant.id, name: 'Chi nhánh chính' },
      })

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          branchId: null,
          name: data.ownerName,
          email: data.email,
          passwordHash,
          phone: data.phone,
          role: 'OWNER',
        },
      })

      await tx.paymentMethod.createMany({
        data: [
          { tenantId: tenant.id, name: 'Tiền mặt', type: 'CASH' },
          { tenantId: tenant.id, name: 'Chuyển khoản', type: 'TRANSFER' },
        ],
      })

      return { tenant, branch, user }
    })

    const token = jwt.sign(
      { userId: result.user.id, tenantId: result.tenant.id, branchId: null, role: 'OWNER' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    )

    return {
      token,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        tenant: { id: result.tenant.id, name: result.tenant.name, slug: result.tenant.slug },
        branch: null,
      },
    }
  },

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true, branch: true },
    })

    if (!user) throw new Error('User không tồn tại')

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      tenant: { id: user.tenant.id, name: user.tenant.name, slug: user.tenant.slug },
      branch: user.branch ? { id: user.branch.id, name: user.branch.name } : null,
    }
  },
}