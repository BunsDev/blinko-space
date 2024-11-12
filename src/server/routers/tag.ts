import { router, authProcedure, demoAuthMiddleware } from '../trpc';
import { z } from 'zod';
import { prisma } from '../prisma';
import { caller } from './_app';
import { tagSchema } from '@/lib/prismaZodType';

export const tagRouter = router({
  list: authProcedure
    // .meta({ openapi: { method: 'GET', path: '/v1/tags/list', summary: 'Get user tags', protect: true } })
    .input(z.void())
    // .output(z.array(tagSchema))
    .query(async function ({ ctx }) {
      const tags = await prisma.tag.findMany({
        where: {
          tagsToNote: {
            some: {
              note: {
                accountId: Number(ctx.id)
              }
            }
          }
        },
        distinct: ['id'] 
      });
      return tags;
    }),
  updateTagMany: authProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/tags/batch-update', summary: 'Batch update tags', protect: true , tags: ['Tag']} })
    .input(z.object({
      ids: z.array(z.number()),
      tag: z.string()
    }))
    .output(z.boolean())
    .mutation(async function ({ input }) {
      const { ids, tag } = input
      const notes = await prisma.notes.findMany({ where: { id: { in: ids } } })
      for (const note of notes) {
        const newContent = note.content += ' #' + tag
        await caller.notes.upsert({ content: newContent, id: note.id })
      }
      return true
    }),
  updateTagName: authProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/tags/update-name', summary: 'Update tag name', protect: true , tags: ['Tag']} })
    .input(z.object({
      oldName: z.string(),
      newName: z.string(),
      id: z.number()
    }))
    .output(z.boolean())
    .mutation(async function ({ input }) {
      const { id, oldName, newName } = input
      const tagToNote = await prisma.tagsToNote.findMany({ where: { tagId: id } })
      const noteIds = tagToNote.map(i => i.noteId)
      const hasTagNote = await prisma.notes.findMany({ where: { id: { in: noteIds } } })
      hasTagNote.map(i => {
        i.content = i.content.replace(new RegExp(`#${oldName}`, 'g'), "#" + newName)
      })
      for (const note of hasTagNote) {
        await caller.notes.upsert({ content: note.content, id: note.id })
      }
      return true
    }),
  updateTagIcon: authProcedure
    .meta({ openapi: { method: 'POST', path: '/v1/tags/update-icon', summary: 'Update tag icon', protect: true , tags: ['Tag']} })
    .input(z.object({
      id: z.number(),
      icon: z.string()
    }))
    .output(tagSchema)
    .mutation(async function ({ input }) {
      const { id, icon } = input
      return await prisma.tag.update({ where: { id }, data: { icon } })
    }),
  deleteOnlyTag: authProcedure.use(demoAuthMiddleware)
    .meta({ openapi: { method: 'POST', path: '/v1/tags/delete-only-tag', summary: 'Only delete tag ,not delete notes', protect: true, tags: ['Tag'] } })
    .input(z.object({
      id: z.number()
    }))
    .output(z.boolean())
    .mutation(async function ({ input }) {
      const { id } = input
      const tag = await prisma.tag.findFirst({ where: { id }, include: { tagsToNote: true } })
      const allNotesId = tag?.tagsToNote.map(i => i.noteId) ?? []
      for (const noteId of allNotesId) {
        const note = await prisma.notes.findFirst({ where: { id: noteId } })
        await prisma.notes.update({ where: { id: note!.id }, data: { content: note!.content.replace(new RegExp(`#${tag!.name}`, 'g'), '') } })
        await prisma.tagsToNote.deleteMany({ where: { tagId: tag!.id } })
      }
      await prisma.tag.delete({ where: { id } })
      return true
    }),
  deleteTagWithAllNote: authProcedure.use(demoAuthMiddleware)
    .meta({ openapi: { method: 'POST', path: '/v1/tags/delete-tag-with-notes', summary: 'Delete tagnot and delete notes', protect: true, tags: ['Tag'] } })
    .input(z.object({
      id: z.number()
    }))
    .output(z.boolean())
    .mutation(async function ({ input }) {
      const { id } = input
      const tag = await prisma.tag.findFirst({ where: { id }, include: { tagsToNote: true } })
      const allNotesId = tag?.tagsToNote.map(i => i.noteId) ?? []
      await caller.notes.deleteMany({ ids: allNotesId })
      return true
    }),
})
