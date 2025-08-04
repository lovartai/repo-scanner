import simpleGit, { SimpleGit, LogResult } from 'simple-git';
import { FileAnalysis, CommitInfo, AnalyzerOptions } from '../types/index.js';
import { glob } from 'glob';
import { readFileSync } from 'fs';
import { join, relative } from 'path';

export class GitAnalyzer {
  private git: SimpleGit;
  private repoPath: string;
  private options: AnalyzerOptions;
  private defaultBugKeywords = ['fix', 'bug', 'patch', 'issue', 'error', 'correct', 'resolve'];

  constructor(repoPath: string, options: AnalyzerOptions = {}) {
    this.repoPath = repoPath;
    this.git = simpleGit(repoPath);
    this.options = {
      bugKeywords: options.bugKeywords || this.defaultBugKeywords,
      fileExtensions: options.fileExtensions || ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs'],
      excludePaths: options.excludePaths || ['node_modules', '.git', 'dist', 'build', '.cache'],
      includePaths: options.includePaths || ['**/*']
    };
  }

  async analyze(): Promise<Map<string, FileAnalysis>> {
    const fileAnalysisMap = new Map<string, FileAnalysis>();
    
    // Get all commits
    const log = await this.git.log(['--all', '--numstat', '--date=iso']);
    
    // Get all files in the repository
    const files = await this.getRepoFiles();
    
    // Initialize file analysis for each file
    for (const file of files) {
      fileAnalysisMap.set(file, {
        path: file,
        modificationFrequency: 0,
        bugFixCount: 0,
        lastModified: new Date(),
        firstCommit: new Date(),
        metrics: await this.analyzeFileMetrics(join(this.repoPath, file)),
        authors: []
      });
    }

    // Process commit history
    await this.processCommitHistory(log, fileAnalysisMap);
    
    return fileAnalysisMap;
  }

  private async getRepoFiles(): Promise<string[]> {
    const patterns = this.options.fileExtensions!.map(ext => `**/*.${ext}`);
    const files: string[] = [];
    
    for (const pattern of patterns) {
      const matched = await glob(pattern, {
        cwd: this.repoPath,
        ignore: this.options.excludePaths
      });
      files.push(...matched);
    }
    
    return files;
  }

  private async processCommitHistory(log: LogResult, fileAnalysisMap: Map<string, FileAnalysis>) {
    const commits = log.all;
    
    for (const commit of commits) {
      const isBugFix = this.isBugFixCommit(commit.message);
      const commitDate = new Date(commit.date);
      
      // Get files changed in this commit
      const changedFiles = await this.getChangedFiles(commit.hash);
      
      for (const file of changedFiles) {
        if (fileAnalysisMap.has(file)) {
          const analysis = fileAnalysisMap.get(file)!;
          
          // Update modification frequency
          analysis.modificationFrequency++;
          
          // Update bug fix count
          if (isBugFix) {
            analysis.bugFixCount++;
          }
          
          // Update dates
          if (commitDate > analysis.lastModified) {
            analysis.lastModified = commitDate;
          }
          if (commitDate < analysis.firstCommit) {
            analysis.firstCommit = commitDate;
          }
          
          // Add author if not already present
          if (!analysis.authors.includes(commit.author_name)) {
            analysis.authors.push(commit.author_name);
          }
        }
      }
    }
  }

  private isBugFixCommit(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return this.options.bugKeywords!.some(keyword => lowerMessage.includes(keyword));
  }

  private async getChangedFiles(commitHash: string): Promise<string[]> {
    try {
      const result = await this.git.raw(['diff-tree', '--no-commit-id', '--name-only', '-r', commitHash]);
      return result.split('\n').filter(f => f.trim().length > 0);
    } catch {
      return [];
    }
  }

  private async analyzeFileMetrics(filePath: string): Promise<FileAnalysis['metrics']> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      let blankLines = 0;
      let commentLines = 0;
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length === 0) {
          blankLines++;
        } else if (this.isCommentLine(trimmed, filePath)) {
          commentLines++;
        }
      }
      
      return {
        lines: lines.length,
        blankLines,
        commentLines,
        codeLines: lines.length - blankLines - commentLines
      };
    } catch {
      return {
        lines: 0,
        blankLines: 0,
        commentLines: 0,
        codeLines: 0
      };
    }
  }

  private isCommentLine(line: string, filePath: string): boolean {
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    // Simple comment detection based on file extension
    switch (ext) {
      case 'js':
      case 'ts':
      case 'jsx':
      case 'tsx':
      case 'java':
      case 'c':
      case 'cpp':
      case 'go':
      case 'rs':
        return line.startsWith('//') || line.startsWith('/*') || line.startsWith('*');
      case 'py':
        return line.startsWith('#');
      default:
        return false;
    }
  }
}