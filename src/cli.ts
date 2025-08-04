#!/usr/bin/env node

import { Command } from 'commander';
import { RepoScanner } from './index.js';
import chalk from 'chalk';
import { resolve } from 'path';
import { existsSync } from 'fs';

const program = new Command();

program
  .name('repo-scanner')
  .description('Analyze git repositories for code modification frequency, bug fixes, and code metrics')
  .version('1.0.0');

program
  .command('scan [path]')
  .description('Scan a git repository')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Output format (json, csv, html)', 'json')
  .option('-e, --extensions <extensions>', 'File extensions to analyze (comma-separated)', 'js,ts,jsx,tsx,py,java,cpp,c,go,rs')
  .option('-x, --exclude <paths>', 'Paths to exclude (comma-separated)', 'node_modules,.git,dist,build')
  .option('-k, --bug-keywords <keywords>', 'Bug fix keywords (comma-separated)', 'fix,bug,patch,issue,error,correct,resolve')
  .option('-d, --dir <directory>', 'Scan only a specific directory within the repository')
  .action(async (path, options) => {
    try {
      const repoPath = resolve(process.cwd(), path || '.');
      
      // Find the git root
      let gitRoot = repoPath;
      let currentPath = repoPath;
      while (currentPath !== '/' && !existsSync(resolve(currentPath, '.git'))) {
        currentPath = resolve(currentPath, '..');
      }
      
      if (!existsSync(resolve(currentPath, '.git'))) {
        console.error(chalk.red('Error: Not a git repository!'));
        process.exit(1);
      }
      
      gitRoot = currentPath;

      console.log(chalk.blue(`Git repository root: ${gitRoot}`));
      
      // If a specific directory is requested, validate it
      let scanPath = '';
      if (options.dir) {
        scanPath = options.dir;
        const fullScanPath = resolve(gitRoot, scanPath);
        if (!existsSync(fullScanPath)) {
          console.error(chalk.red(`Error: Directory '${scanPath}' does not exist in the repository!`));
          process.exit(1);
        }
        console.log(chalk.blue(`Scanning directory: ${scanPath}`));
      } else {
        console.log(chalk.blue('Scanning entire repository'));
      }

      // Parse options
      const analyzerOptions = {
        fileExtensions: options.extensions.split(',').map((e: string) => e.trim()),
        excludePaths: options.exclude.split(',').map((p: string) => p.trim()),
        bugKeywords: options.bugKeywords.split(',').map((k: string) => k.trim()),
        includePaths: options.dir ? [scanPath + '/**/*'] : undefined
      };

      // Create scanner and run analysis
      const scanner = new RepoScanner(gitRoot, analyzerOptions);
      const analysis = await scanner.scan();

      // Generate report
      const reportOptions = {
        format: options.format as 'json' | 'csv' | 'html',
        outputPath: options.output
      };

      const report = await scanner.generateReport(analysis, reportOptions);

      // If no output path specified, print to console (for JSON)
      if (!options.output && options.format === 'json') {
        console.log('\n' + chalk.green('Analysis Results:'));
        console.log(report);
      }

      console.log(chalk.green('\n Analysis complete!'));
      console.log(chalk.blue(`Total files analyzed: ${analysis.totalFiles}`));
      console.log(chalk.blue(`Total commits: ${analysis.totalCommits}`));

    } catch (error) {
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

program.parse();