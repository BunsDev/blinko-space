import { router, publicProcedure, authProcedure, superAdminAuthMiddleware } from '../trpc';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { prisma } from '../prisma';
import { encode } from 'next-auth/jwt';
import { Prisma } from '@prisma/client';
import { accountsSchema } from '@/lib/prismaZodType';
import { hashPassword, verifyPassword } from 'prisma/seed';

const genToken = async ({ id, name, role }: { id: number, name: string, role: string }) => {
  return await encode({
    token: {
      role,
      name,
      sub: id.toString(),
    },
    secret: process.env.NEXTAUTH_SECRET!
  })
}

export const userRouter = router({
  list: authProcedure.use(superAdminAuthMiddleware)
    .meta({ openapi: { method: 'GET', path: '/v1/user/list', summary: 'Find user list', tags: ['User'] } })
    .input(z.void())
    .output(z.array(accountsSchema))
    .query(async () => {
      return await prisma.accounts.findMany()
    }),
  detail: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/v1/user/detail', summary: 'Find user detail from user id', tags: ['User'] } })
    .input(z.object({ id: z.number() }))
    .output(z.object({
      id: z.number(),
      name: z.string(),
      nickName: z.string(),
      token: z.string()
    }))
    .query(async ({ input }) => {
      const user = await prisma.accounts.findFirst({ where: { id: input.id } })
      return {
        id: input.id,
        name: user?.name ?? '',
        nickName: user?.nickname ?? '',
        token: user?.apiToken ?? ''
      }
    }),
  canRegister: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/user/can-register', summary: 'Check if can register admin', tags: ['User'] } })
    .input(z.void())
    .output(z.boolean())
    .mutation(async () => {
      const count = await prisma.accounts.count()
      if (count == 0) {
        return true
      } else {
        const res = await prisma.config.findFirst({ where: { key: 'isAllowRegister' } })
        //@ts-ignore
        return res?.config.value === true
      }
    }),
  createAdmin: publicProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/user/create-admin', summary: 'Create admin user', tags: ['User'] } })
    .input(z.object({
      name: z.string(),
      password: z.string()
    }))
    .output(z.union([z.boolean(), z.any()]))
    .mutation(async ({ input }) => {
      return prisma.$transaction(async () => {
        const { name, password } = input
        const passwordHash = await hashPassword(password)
        const count = await prisma.accounts.count()
        if (count == 0) {
          const res = await prisma.accounts.create({ data: { name, password: passwordHash, nickname: name, role: 'superadmin' } })
          await prisma.accounts.update({ where: { id: res.id }, data: { apiToken: await genToken({ id: res.id, name, role: 'superadmin' }) } })
          return true
        } else {
          const config = await prisma.config.findFirst({ where: { key: 'isAllowRegister' } })
          //@ts-ignore
          if (config?.value === false) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'User set is not allow register',
            });
          } else {
            const hasSameUser = await prisma.accounts.findFirst({ where: { name } })
            if (hasSameUser && await verifyPassword(password, hasSameUser?.password ?? '')) {
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'User and password already exists',
              });
            }
            const res = await prisma.accounts.create({ data: { name, password: passwordHash, nickname: name, role: 'user' } })
            await prisma.accounts.update({ where: { id: res.id }, data: { apiToken: await genToken({ id: res.id, name, role: 'user' }) } })
            return true
          }
        }
      })
    }),
  regenToken: authProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/user/regen-token', summary: 'Regen token', tags: ['User'] } })
    .input(z.void())
    .output(z.boolean())
    .mutation(async ({ ctx }) => {
      const user = await prisma.accounts.findFirst({ where: { id: Number(ctx.id) } })
      if (user) {
        await prisma.accounts.update({ where: { id: user.id }, data: { apiToken: await genToken({ id: user.id, name: user.name ?? '', role: user.role }) } })
        return true
      } else {
        return false
      }
    }),
  upsertUser: authProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/user/upsert', summary: 'Update or create user', tags: ['User'] } })
    .input(z.object({
      id: z.number().optional(),
      name: z.string().optional(),
      originalPassword: z.string().optional(),
      password: z.string().optional(),
      nickname: z.string().optional()
    }))
    .output(z.union([z.boolean(), z.any()]))
    .mutation(async ({ input }) => {
      return prisma.$transaction(async () => {
        const { id, nickname, name, password, originalPassword } = input

        const update: Prisma.accountsUpdateInput = {}
        if (id) {
          if (name) update.name = name
          if (password) {
            const passwordHash = await hashPassword(password)
            update.password = passwordHash
          }
          if (nickname) update.nickname = nickname
          if (originalPassword) {
            const user = await prisma.accounts.findFirst({ where: { id } })
            if (user && !(await verifyPassword(originalPassword, user?.password ?? ''))) {
              throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Password is incorrect' });
            }
          }
          await prisma.accounts.update({ where: { id }, data: update })
          return true
        } else {
          if (!password) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Password is required' });
          }
          const passwordHash = await hashPassword(password!)
          const res = await prisma.accounts.create({ data: { name, password: passwordHash, nickname: name, role: 'user' } })
          await prisma.accounts.update({ where: { id: res.id }, data: { apiToken: await genToken({ id: res.id, name: name ?? '', role: 'user' }) } })
          return true
        }
      })
    }),
  upsertUserByAdmin: authProcedure.use(superAdminAuthMiddleware)
    .meta({ openapi: { method: 'POST', path: '/v1/user/upsert-by-admin', summary: 'Update or create user by admin', tags: ['User'] } })
    .input(z.object({
      id: z.number().optional(),
      name: z.string().optional(),
      password: z.string().optional(),
      nickname: z.string().optional()
    }))
    .output(z.union([z.boolean(), z.any()]))
    .mutation(async ({ input }) => {
      return prisma.$transaction(async () => {
        const { id, nickname, name, password } = input

        const update: Prisma.accountsUpdateInput = {}
        const hasSameUser = await prisma.accounts.findFirst({ where: { name } })
        if (hasSameUser) {
          if (password) {
            if (hasSameUser && await verifyPassword(password, hasSameUser?.password ?? '')) {
              throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User and password already exists' });
            }
          }
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User and password already exists' });
        }
        if (id) {
          if (name) update.name = name
          if (password) {
            const passwordHash = await hashPassword(password)
            update.password = passwordHash
          }
          if (nickname) update.nickname = nickname
          await prisma.accounts.update({ where: { id }, data: update })
          return true
        } else {
          if (!password) {
            throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Password is required' });
          }
          const passwordHash = await hashPassword(password!)
          const res = await prisma.accounts.create({ data: { name, password: passwordHash, nickname: name, role: 'user' } })
          await prisma.accounts.update({ where: { id: res.id }, data: { apiToken: await genToken({ id: res.id, name: name ?? '', role: 'user' }) } })
          return true
        }
      })
    }),
})
