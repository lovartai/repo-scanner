export interface FileAnalysis {
  path: string;
  modificationFrequency: number;
  bugFixCount: number;
  lastModified: string; // ISO date string in JSON
  firstCommit: string; // ISO date string in JSON
  metrics: {
    lines: number;
    blankLines: number;
    commentLines: number;
    codeLines: number;
  };
  authors: string[];
}

export interface RepoAnalysis {
  repositoryPath: string;
  analyzedAt: string; // ISO date string in JSON
  totalCommits: number;
  totalFiles: number;
  files: FileAnalysis[];
}

export type SortField = 'path' | 'modificationFrequency' | 'bugFixCount' | 'lastModified' | 'codeLines' | 'authors';
export type SortOrder = 'asc' | 'desc';