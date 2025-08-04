import { GitAnalyzer } from './analyzers/git-analyzer.js';
import { CodeAnalyzer } from './analyzers/code-analyzer.js';
import { JsonReporter } from './reporters/json-reporter.js';
import { CsvReporter } from './reporters/csv-reporter.js';
import { HtmlReporter } from './reporters/html-reporter.js';
import { RepoAnalysis, AnalyzerOptions, ReporterOptions } from './types/index.js';
import ora from 'ora';
import chalk from 'chalk';
import { join } from 'path';

export class RepoScanner {
  private repoPath: string;
  private options: AnalyzerOptions;

  constructor(repoPath: string, options: AnalyzerOptions = {}) {
    this.repoPath = repoPath;
    this.options = options;
  }

  async scan(): Promise<RepoAnalysis> {
    const spinner = ora('Analyzing repository...').start();

    try {
      // Git analysis
      spinner.text = 'Analyzing git history...';
      const gitAnalyzer = new GitAnalyzer(this.repoPath, this.options);
      const fileAnalysisMap = await gitAnalyzer.analyze();

      // Code analysis
      spinner.text = 'Analyzing code complexity and duplication...';
      const codeAnalyzer = new CodeAnalyzer();
      const files = Array.from(fileAnalysisMap.keys());
      
      // Create a map for full paths to relative paths
      const pathMap = new Map<string, string>();
      const fullPaths: string[] = [];
      
      for (const file of files) {
        const fullPath = join(this.repoPath, file);
        fullPaths.push(fullPath);
        pathMap.set(fullPath, file);
      }
      
      const duplicationInfo = codeAnalyzer.analyzeCodeDuplication(fullPaths);
      const complexityInfo = new Map<string, number>();
      
      // Convert back to relative paths for storage
      const relativeDuplicationInfo = new Map<string, any>();
      for (const [fullPath, info] of duplicationInfo) {
        const relativePath = pathMap.get(fullPath) || fullPath;
        relativeDuplicationInfo.set(relativePath, info);
      }
      
      for (const file of files) {
        const fullPath = join(this.repoPath, file);
        const complexity = codeAnalyzer.calculateCyclomaticComplexity(fullPath);
        complexityInfo.set(file, complexity);
      }

      // Get total commits count
      const simpleGit = (await import('simple-git')).default;
      const git = simpleGit(this.repoPath);
      const log = await git.log(['--all']);
      const totalCommits = log.total;

      spinner.succeed('Analysis completed!');

      const analysis: RepoAnalysis = {
        repositoryPath: this.repoPath,
        analyzedAt: new Date(),
        totalCommits,
        totalFiles: fileAnalysisMap.size,
        files: Array.from(fileAnalysisMap.values())
      };

      // Store analysis results for reporting
      (analysis as any)._duplicationInfo = relativeDuplicationInfo;
      (analysis as any)._complexityInfo = complexityInfo;

      return analysis;
    } catch (error) {
      spinner.fail('Analysis failed!');
      throw error;
    }
  }

  async generateReport(analysis: RepoAnalysis, options: ReporterOptions): Promise<string> {
    const duplicationInfo = (analysis as any)._duplicationInfo || new Map();
    const complexityInfo = (analysis as any)._complexityInfo || new Map();

    let reporter;
    switch (options.format) {
      case 'csv':
        reporter = new CsvReporter();
        break;
      case 'html':
        reporter = new HtmlReporter();
        break;
      case 'json':
      default:
        reporter = new JsonReporter();
        break;
    }

    const report = reporter.generate(analysis, duplicationInfo, complexityInfo, options.outputPath);

    if (options.outputPath) {
      console.log(chalk.green(` Report saved to: ${options.outputPath}`));
    }

    return report;
  }
}

export * from './types/index.js';