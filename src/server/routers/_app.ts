/**
 * This file contains the root router of your tRPC-backend
 */
import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { router, t } from '../trpc';
import { aiRouter } from './ai';
import { attachmentsRouter } from './attachment';
import { noteRouter } from './note';
import { tagRouter } from './tag';
import { userRouter } from './user';
import { configRouter } from './config';
import { publicRouter } from './public';
import { taskRouter } from './task';

export const appRouter = router({
  ai: aiRouter,
  notes: noteRouter,
  tags: tagRouter,
  users: userRouter,
  attachments: attachmentsRouter,
  config: configRouter,
  public: publicRouter,
  task: taskRouter
});

export const createCaller = t.createCallerFactory(appRouter);
export const caller = createCaller({ id: '1', name: 'admin', sub: '1', role: 'superadmin', exp: 0, iat: 0 });

export type AppRouter = typeof appRouter;
export type RouterOutput = inferRouterOutputs<AppRouter>;
export type RouterInput = inferRouterInputs<AppRouter>;
