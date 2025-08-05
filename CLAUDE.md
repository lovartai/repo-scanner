# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Repo Scanner is a command-line tool that analyzes git repositories for code modification frequency, bug fixes, and code metrics. It's built with TypeScript and uses ES modules.

## Essential Commands

### Development
- `npm run dev scan [path]` - Run in development mode using tsx
- `npm run build` - Build TypeScript to dist/
- `npm run lint` - Run ESLint on src/ directory
- `npm test` - Run tests with Vitest (no tests currently exist)

### Running the Tool
- `npm start -- scan [path]` - Run the built version
- After building: `repo-scanner scan [path]` - Run as a CLI tool

### Common Usage Examples
```bash
# Scan current directory
npm run dev scan

# Scan specific directory within repo
npm run dev scan -d src

# Generate HTML report
npm run dev scan -f html -o report.html

# Analyze specific file types
npm run dev scan -e "js,ts" -x "node_modules,dist"
```

## Architecture Overview

### Core Components

1. **Main Entry Points**
   - `src/cli.ts` - CLI interface using Commander.js
   - `src/index.ts` - Core RepoScanner class that orchestrates analysis

2. **Analyzers** (`src/analyzers/`)
   - `git-analyzer.ts` - Analyzes git history for modification frequency and bug fixes
   - `code-analyzer.ts` - Calculates code metrics, duplication, and cyclomatic complexity

3. **Reporters** (`src/reporters/`)
   - `json-reporter.ts` - Generates JSON output with full analysis data
   - `csv-reporter.ts` - Creates CSV files for spreadsheet analysis
   - `html-reporter.ts` - Produces interactive HTML reports with charts

4. **Type Definitions** (`src/types/index.ts`)
   - Core interfaces: FileAnalysis, RepoAnalysis, AnalyzerOptions

### Key Technical Details

- **ES Modules**: Project uses `"type": "module"` - always use `.js` extensions in imports
- **TypeScript**: Strict mode enabled, compiles to ES2022
- **Git Integration**: Uses simple-git library for repository analysis
- **Path Handling**: Carefully manages relative vs absolute paths throughout
- **Async Processing**: Heavy use of async/await for file and git operations

### Analysis Flow

1. CLI validates repository and parses options
2. GitAnalyzer walks git history to collect modification data
3. CodeAnalyzer processes each file for metrics and complexity
4. Results are combined into RepoAnalysis object
5. Selected reporter formats and outputs the data

### Configuration Options

- **fileExtensions**: Which file types to analyze (default: common programming languages)
- **excludePaths**: Directories to skip (default: node_modules, .git, dist, build)
- **bugKeywords**: Commit message keywords indicating bug fixes
- **includePaths**: Limit analysis to specific directories