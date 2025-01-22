import type * as trpcNext from '@trpc/server/adapters/next';
import { getToken } from 'next-auth/jwt';
import { prisma } from './prisma';
export type User = {
  name: string,
  sub: string,
  role: string,
  id: string,
  exp: number,
  iat: number
}
export async function createContext(
  opts: trpcNext.CreateNextContextOptions,
) {
  const token = await getToken({ req: opts.req, secret: process.env.NEXTAUTH_SECRET }) as User;
  if (!token?.sub) {
    return {} as User;
  }
  return { ...token, id: token.sub }
}

export type Context = Awaited<ReturnType<typeof createContext>>;