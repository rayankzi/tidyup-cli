import { z } from "zod"

export const FolderContentsSchema = z.object({
  files: z.array(
    z.object({
      name: z.string(),
      modifiedDate: z.date()
    })
  ),
  subfolders: z.record(z.lazy(() => FolderContentsSchema))
});

export const FolderResultSchema = z.object({
  contents: FolderContentsSchema,
  treeRepresentation: z.string()
});

export const OrganizationOptionsSchema = z.object({
  directory: z.string(),
  confirmSubdirectoryOrg: z.boolean(),
  confirmReorganization: z.boolean(),
  additionalText: z.string()
});
//s
export const APIResponseSchema = z.object({
  data: z.object({
    aIRecommendations: z.string()
  }),
  extensions: z.object({
    invocations: z.object({
      aIRecommendations: z.object({
        executionId: z.string()
      })
    })
  })
});

export type FolderContents = z.infer<typeof FolderContentsSchema>;
export type FolderResult = z.infer<typeof FolderResultSchema>;
export type OrganizationOptions = z.infer<typeof OrganizationOptionsSchema>;
export type APIResponse = z.infer<typeof APIResponseSchema>;