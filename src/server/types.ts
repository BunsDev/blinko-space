import { RouterOutput, RouterInput } from "./routers/_app"
import { z } from "zod"

export type Note = Partial<NonNullable<RouterOutput['notes']['list'][0]>>
export type Attachment = NonNullable<Note['attachments']>[0] & { size: any }
export type Tag = NonNullable<RouterOutput['tags']['list']>[0]
export type Config = NonNullable<RouterOutput['config']['list']>
export type LinkInfo = NonNullable<RouterOutput['public']['linkPreview']>
export type ResourceType = NonNullable<RouterOutput['attachments']['list']>[0]
export enum NoteType {
  'BLINKO',
  'NOTE'
}

export const ZUserPerferConfigKey = z.union([
  z.literal('textFoldLength'),
  z.literal('smallDeviceCardColumns'),
  z.literal('mediumDeviceCardColumns'),
  z.literal('largeDeviceCardColumns'),
  z.literal('timeFormat'),
  z.literal('isHiddenMobileBar'),
  z.literal('isOrderByCreateTime'),
  z.literal('language'),
  z.literal('theme'),
  z.literal('webhookEndpoint'),
  z.literal('toolbarVisibility'),
  z.literal('twoFactorEnabled'),
  z.literal('twoFactorSecret'),
  z.literal('themeColor'),
  z.literal('themeForegroundColor'),
  z.literal('isCloseDailyReview')
]);

export const ZConfigKey = z.union([
  z.literal('isAutoArchived'),
  z.literal('autoArchivedDays'),
  z.literal('isUseAI'),
  z.literal('aiModelProvider'),
  z.literal('aiApiKey'),
  z.literal('aiApiEndpoint'),
  z.literal('aiApiVersion'),
  z.literal('aiModel'),
  z.literal('isAllowRegister'),
  z.literal('objectStorage'),
  z.literal('s3AccessKeyId'),
  z.literal('s3AccessKeySecret'),
  z.literal('s3Endpoint'),
  z.literal('s3Bucket'),
  z.literal('s3Region'),
  z.literal('s3CustomPath'),
  z.literal('localCustomPath'),
  z.literal('embeddingModel'),
  z.literal('embeddingTopK'),
  z.literal('embeddingLambda'),
  z.literal('embeddingScore'),
  z.literal('excludeEmbeddingTagId'),
  z.literal('spotifyConsumerKey'),
  z.literal('spotifyConsumerSecret'),
  z.literal('isCloseBackgroundAnimation'),
  z.literal('customBackgroundUrl'),
  z.literal('oauth2Providers'),
  ZUserPerferConfigKey
]);

export type ConfigKey = z.infer<typeof ZConfigKey>;

export const ZOAuth2ProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  wellKnown: z.string().optional(),
  scope: z.string().optional(),
  authorizationUrl: z.string().optional(),
  tokenUrl: z.string(),
  userinfoUrl: z.string(),
  clientId: z.string(),
  clientSecret: z.string(),
});

export const ZConfigSchema = z.object({
  isAutoArchived: z.boolean().optional(),
  autoArchivedDays: z.number().optional(),
  isUseAI: z.boolean().optional(),
  aiModelProvider: z.any().optional(),
  aiApiKey: z.any().optional(),
  aiApiEndpoint: z.any().optional(),
  aiApiVersion: z.any().optional(),
  aiModel: z.any().optional(),
  isHiddenMobileBar: z.boolean().optional(),
  toolbarVisibility: z.any().optional(),
  isAllowRegister: z.any().optional(),
  isCloseBackgroundAnimation: z.boolean().optional(),
  customBackgroundUrl: z.any().optional(),
  isOrderByCreateTime: z.any().optional(),
  timeFormat: z.any().optional(),
  smallDeviceCardColumns: z.any().optional(),
  mediumDeviceCardColumns: z.any().optional(),
  largeDeviceCardColumns: z.any().optional(),
  textFoldLength: z.number().optional(),
  objectStorage: z.any().optional(),
  s3AccessKeyId: z.any().optional(),
  s3AccessKeySecret: z.any().optional(),
  s3Endpoint: z.any().optional(),
  s3Bucket: z.any().optional(),
  s3CustomPath: z.any().optional(),
  s3Region: z.any().optional(),
  localCustomPath: z.any().optional(),
  embeddingModel: z.any().optional(),
  embeddingTopK: z.number().optional(),
  embeddingLambda: z.number().optional(),
  embeddingScore: z.number().optional(),
  excludeEmbeddingTagId: z.number().optional(),
  language: z.any().optional(),
  theme: z.any().optional(),
  themeColor: z.any().optional(),
  themeForegroundColor: z.any().optional(),
  webhookEndpoint: z.any().optional(),
  twoFactorEnabled: z.boolean().optional(),
  twoFactorSecret: z.string().optional(),
  spotifyConsumerKey: z.string().optional(),
  spotifyConsumerSecret: z.string().optional(),
  isCloseDailyReview: z.boolean().optional(),
  oauth2Providers: z.array(ZOAuth2ProviderSchema).optional(),
});

export type GlobalConfig = z.infer<typeof ZConfigSchema>;

