import prisma from '../../prisma/prismaClient';

export const authRepository = {
  findByEmail: (email: string) => prisma.user.findUnique({ where: { email } }),
  findById: (id: number) => prisma.user.findUnique({ where: { id } }),
  createUser: (data: { email: string; name?: string; password: string; roleId?: number }) =>
    prisma.user.create({ data }),
};
