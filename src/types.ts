export interface FolderContents {
  files: { name: string; modifiedDate: Date }[]; // Files with their modified date
  subfolders: Record<string, FolderContents>; // Subfolder contents
}

export interface FolderResult {
  contents: FolderContents;
  treeRepresentation: string; // String representation of the directory tree
}

export interface OrganizationOptions {
  directory: string;
  confirmSubdirectoryOrg: boolean;
  confirmReorganization: boolean;
}

export interface APIResponse {
  data: {
    aIRecommendations: string
  }
  extensions: {
    invocations: {
      aIRecommendations: {
        executionId: string
      }
    }
  }
}

