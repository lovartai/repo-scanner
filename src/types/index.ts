export interface FileAnalysis {
  path: string;
  modificationFrequency: number;
  bugFixCount: number;
  lastModified: Date;
  firstCommit: Date;
  metrics: {
    lines: number;
    blankLines: number;
    commentLines: number;
    codeLines: number;
  };
  authors: string[];
}

export interface CommitInfo {
  hash: string;
  author: string;
  date: Date;
  message: string;
  files: string[];
}

export interface RepoAnalysis {
  repositoryPath: string;
  analyzedAt: Date;
  totalCommits: number;
  totalFiles: number;
  files: FileAnalysis[];
}

export interface AnalyzerOptions {
  includePaths?: string[];
  excludePaths?: string[];
  bugKeywords?: string[];
  fileExtensions?: string[];
}

export interface ReporterOptions {
  format: 'json' | 'csv' | 'html';
  outputPath?: string;
}