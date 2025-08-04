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
    
    // Get all files in the repository first
    const files = await this.getRepoFiles();
    
    // Get commits only for the specified paths using raw git command for better performance
    let pathFilter = '';
    
    if (this.options.includePaths && this.options.includePaths.length > 0 && this.options.includePaths[0] !== '**/*') {
      // Extract the base directory from include paths
      const basePaths = this.options.includePaths.map(path => 
        path.replace('/**/*', '').replace('**/*', '')
      ).filter(path => path.length > 0);
      
      if (basePaths.length > 0) {
        pathFilter = `-- ${basePaths.join(' ')}`;
      }
    }
    
    // Use raw git command for better performance with file stats
    // Add a delimiter to separate commits
    const rawLog = await this.git.raw([
      'log', 
      '--all',
      '--format=COMMIT_START%n%H|%an|%ae|%aI|%s',
      '--name-only',
      ...pathFilter.split(' ').filter(arg => arg.length > 0)
    ]);
    
    // Initialize file analysis for each file
    for (const file of files) {
      fileAnalysisMap.set(file, {
        path: file,
        modificationFrequency: 0,
        bugFixCount: 0,
        lastModified: new Date(0), // Initialize to epoch
        firstCommit: new Date('2099-01-01'), // Initialize to future date
        metrics: await this.analyzeFileMetrics(join(this.repoPath, file)),
        authors: []
      });
    }

    // Process commit history
    await this.processCommitHistory(rawLog, fileAnalysisMap);
    
    return fileAnalysisMap;
  }

  private async getRepoFiles(): Promise<string[]> {
    const files: string[] = [];
    
    // If includePaths is specified, use those patterns instead
    if (this.options.includePaths && this.options.includePaths.length > 0 && this.options.includePaths[0] !== '**/*') {
      for (const includePath of this.options.includePaths) {
        for (const ext of this.options.fileExtensions!) {
          const pattern = includePath.endsWith('**/*') 
            ? includePath.replace('**/*', `**/*.${ext}`)
            : `${includePath}/**/*.${ext}`;
          
          const matched = await glob(pattern, {
            cwd: this.repoPath,
            ignore: this.options.excludePaths
          });
          files.push(...matched);
        }
      }
    } else {
      // Default behavior - scan entire repo
      const patterns = this.options.fileExtensions!.map(ext => `**/*.${ext}`);
      
      for (const pattern of patterns) {
        const matched = await glob(pattern, {
          cwd: this.repoPath,
          ignore: this.options.excludePaths
        });
        files.push(...matched);
      }
    }
    
    return files;
  }

  private async processCommitHistory(rawLog: string, fileAnalysisMap: Map<string, FileAnalysis>) {
    // Parse the raw log output using our delimiter
    const commits = rawLog.split('COMMIT_START').filter(block => block.trim());
    
    console.log(`\nProcessing ${commits.length} commits...`);
    
    for (const commitBlock of commits) {
      const lines = commitBlock.trim().split('\n');
      if (lines.length < 1) continue;
      
      // Parse commit info from first line
      const commitInfo = lines[0];
      if (!commitInfo.includes('|')) continue;
      
      const [hash, authorName, authorEmail, date, ...messageParts] = commitInfo.split('|');
      const message = messageParts.join('|');
      const isBugFix = this.isBugFixCommit(message);
      const commitDate = new Date(date);
      
      // Parse changed files (remaining lines)
      for (let i = 1; i < lines.length; i++) {
        const file = lines[i].trim();
        if (!file || file.length === 0) continue;
        
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
          if (!analysis.authors.includes(authorName)) {
            analysis.authors.push(authorName);
          }
        }
      }
    }
    
    // Debug: log some statistics
    const totalFiles = Array.from(fileAnalysisMap.values());
    const filesWithBugFixes = totalFiles.filter(f => f.bugFixCount > 0).length;
    const filesWithMultipleAuthors = totalFiles.filter(f => f.authors.length > 1).length;
    console.log(`Files with bug fixes: ${filesWithBugFixes}/${totalFiles.length}`);
    console.log(`Files with multiple authors: ${filesWithMultipleAuthors}/${totalFiles.length}`);
  }

  private isBugFixCommit(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const isBugFix = this.options.bugKeywords!.some(keyword => lowerMessage.includes(keyword));
    
    // Debug: log first few bug fix commits
    if (isBugFix && (!this.debugBugFixCount || this.debugBugFixCount < 3)) {
      console.log(`Bug fix commit found: "${message}"`);
      this.debugBugFixCount = (this.debugBugFixCount || 0) + 1;
    }
    
    return isBugFix;
  }
  
  private debugBugFixCount?: number;

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